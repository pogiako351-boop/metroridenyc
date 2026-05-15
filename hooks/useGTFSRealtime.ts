import { useState, useEffect, useRef, useCallback } from 'react';

// MTA GTFS-RT feed URLs — these are the public endpoints
// Using the tripUpdates feed which contains StopTimeUpdate arrival times
const FEED_URLS: Record<string, string> = {
  // ACE + BDFM + G + JZ + L + NQR + 1234567 + S
  ACE: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace',
  BDFM: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm',
  G: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g',
  JZ: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz',
  NQRW: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw',
  L: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l',
  '1234567': 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs',
  SIR: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-si',
};

// Map subway line letter to feed key
const LINE_TO_FEED: Record<string, string> = {
  A: 'ACE', C: 'ACE', E: 'ACE',
  B: 'BDFM', D: 'BDFM', F: 'BDFM', M: 'BDFM',
  G: 'G',
  J: 'JZ', Z: 'JZ',
  N: 'NQRW', Q: 'NQRW', R: 'NQRW', W: 'NQRW',
  L: 'L',
  '1': '1234567', '2': '1234567', '3': '1234567',
  '4': '1234567', '5': '1234567', '6': '1234567', '7': '1234567',
  S: '1234567',
};

export interface GTFSStopTimeUpdate {
  stopId: string;
  arrivalTime: number | null;   // Unix timestamp seconds
  departureTime: number | null; // Unix timestamp seconds
}

export interface GTFSTripUpdate {
  tripId: string;
  routeId: string;               // e.g. "A", "1"
  directionId: number;           // 0 = uptown/outbound, 1 = downtown/inbound
  vehicleId?: string;
  startDate?: string;
  stopTimeUpdates: GTFSStopTimeUpdate[];
  timestamp: number;             // feed entity timestamp
}

export interface GTFSRealtimeData {
  tripUpdates: GTFSTripUpdate[];
  feedTimestamp: number;        // when feed was fetched (ms)
  error: string | null;
}

// Parse the raw protobuf binary from MTA GTFS-RT feed
// MTA feeds use Protocol Buffers 2.0 encoding
// We parse the binary manually to avoid needing protobufjs on mobile
function parseGTFSBinary(buffer: ArrayBuffer): GTFSTripUpdate[] {
  const updates: GTFSTripUpdate[] = [];
  const bytes = new Uint8Array(buffer);
  let pos = 0;

  // Protobuf varint decoder
  function readVarint(): number {
    let result = 0;
    let shift = 0;
    while (pos < bytes.length) {
      const byte = bytes[pos++];
      result |= (byte & 0x7f) << shift;
      if (!(byte & 0x80)) break;
      shift += 7;
    }
    return result;
  }

  // Read a length-delimited field (returns slice of bytes)
  function readBytes(): Uint8Array {
    const len = readVarint();
    const slice = bytes.slice(pos, pos + len);
    pos += len;
    return slice;
  }

  // Decode string from bytes
  function readString(): string {
    const b = readBytes();
    return new TextDecoder().decode(b);
  }

  // Skip a field based on wire type
  function skipField(wireType: number) {
    if (wireType === 0) { readVarint(); }
    else if (wireType === 1) { pos += 8; }
    else if (wireType === 2) { const len = readVarint(); pos += len; }
    else if (wireType === 5) { pos += 4; }
  }

  // Parse TripDescriptor (field in TripUpdate)
  function parseTripDescriptor(data: Uint8Array): { tripId: string; routeId: string; directionId: number; startDate?: string } {
    let tripId = '';
    let routeId = '';
    let directionId = 0;
    let startDate: string | undefined;
    let p = 0;
    const b = data;

    function rv(): number {
      let result = 0; let shift = 0;
      while (p < b.length) {
        const byte = b[p++];
        result |= (byte & 0x7f) << shift;
        if (!(byte & 0x80)) break;
        shift += 7;
      }
      return result;
    }
    function rb(): Uint8Array { const len = rv(); const s = b.slice(p, p + len); p += len; return s; }
    function rs(): string { return new TextDecoder().decode(rb()); }

    while (p < b.length) {
      const tag = rv();
      const fieldNum = tag >> 3;
      const wireType = tag & 0x7;
      if (fieldNum === 1) tripId = rs();         // trip_id
      else if (fieldNum === 5) routeId = rs();   // route_id
      else if (fieldNum === 6) startDate = rs(); // start_date
      else if (fieldNum === 3) directionId = rv(); // direction_id
      else {
        if (wireType === 0) rv();
        else if (wireType === 1) p += 8;
        else if (wireType === 2) { const len = rv(); p += len; }
        else if (wireType === 5) p += 4;
      }
    }
    return { tripId, routeId, directionId, startDate };
  }

  // Parse StopTimeEvent (arrival or departure)
  function parseStopTimeEvent(data: Uint8Array): number | null {
    let time: number | null = null;
    let p = 0;
    const b = data;
    function rv(): number {
      let result = 0; let shift = 0;
      while (p < b.length) {
        const byte = b[p++];
        result |= (byte & 0x7f) << shift;
        if (!(byte & 0x80)) break;
        shift += 7;
      }
      return result;
    }
    function rb(): Uint8Array { const len = rv(); const s = b.slice(p, p + len); p += len; return s; }

    while (p < b.length) {
      const tag = rv();
      const fieldNum = tag >> 3;
      const wireType = tag & 0x7;
      if (fieldNum === 2) { time = rv(); } // time (unix timestamp seconds)
      else {
        if (wireType === 0) rv();
        else if (wireType === 1) p += 8;
        else if (wireType === 2) rb();
        else if (wireType === 5) p += 4;
      }
    }
    return time;
  }

  // Parse StopTimeUpdate
  function parseStopTimeUpdate(data: Uint8Array): GTFSStopTimeUpdate {
    let stopId = '';
    let arrivalTime: number | null = null;
    let departureTime: number | null = null;
    let p = 0;
    const b = data;
    function rv(): number {
      let result = 0; let shift = 0;
      while (p < b.length) {
        const byte = b[p++];
        result |= (byte & 0x7f) << shift;
        if (!(byte & 0x80)) break;
        shift += 7;
      }
      return result;
    }
    function rb(): Uint8Array { const len = rv(); const s = b.slice(p, p + len); p += len; return s; }
    function rs(): string { return new TextDecoder().decode(rb()); }

    while (p < b.length) {
      const tag = rv();
      const fieldNum = tag >> 3;
      const wireType = tag & 0x7;
      if (fieldNum === 3) stopId = rs();                          // stop_id
      else if (fieldNum === 1) arrivalTime = parseStopTimeEvent(rb());   // arrival
      else if (fieldNum === 2) departureTime = parseStopTimeEvent(rb()); // departure
      else {
        if (wireType === 0) rv();
        else if (wireType === 1) p += 8;
        else if (wireType === 2) rb();
        else if (wireType === 5) p += 4;
      }
    }
    return { stopId, arrivalTime, departureTime };
  }

  // Parse TripUpdate entity
  function parseTripUpdate(data: Uint8Array): GTFSTripUpdate | null {
    let trip: { tripId: string; routeId: string; directionId: number; startDate?: string } = { tripId: '', routeId: '', directionId: 0 };
    let vehicleId: string | undefined;
    let entityTimestamp = 0;
    const stopTimeUpdates: GTFSStopTimeUpdate[] = [];
    let p = 0;
    const b = data;
    function rv(): number {
      let result = 0; let shift = 0;
      while (p < b.length) {
        const byte = b[p++];
        result |= (byte & 0x7f) << shift;
        if (!(byte & 0x80)) break;
        shift += 7;
      }
      return result;
    }
    function rb(): Uint8Array { const len = rv(); const s = b.slice(p, p + len); p += len; return s; }

    while (p < b.length) {
      const tag = rv();
      const fieldNum = tag >> 3;
      const wireType = tag & 0x7;
      if (fieldNum === 1) trip = parseTripDescriptor(rb());         // trip
      else if (fieldNum === 2) { const vd = rb(); vehicleId = new TextDecoder().decode(vd); } // vehicle (simplified)
      else if (fieldNum === 3) stopTimeUpdates.push(parseStopTimeUpdate(rb())); // stop_time_update
      else if (fieldNum === 4) entityTimestamp = rv();              // timestamp
      else {
        if (wireType === 0) rv();
        else if (wireType === 1) p += 8;
        else if (wireType === 2) rb();
        else if (wireType === 5) p += 4;
      }
    }

    if (!trip.routeId || stopTimeUpdates.length === 0) return null;
    return {
      tripId: trip.tripId,
      routeId: trip.routeId,
      directionId: trip.directionId,
      vehicleId,
      startDate: trip.startDate,
      stopTimeUpdates,
      timestamp: entityTimestamp,
    };
  }

  // Parse FeedMessage -> FeedEntity -> TripUpdate
  while (pos < bytes.length) {
    const tag = readVarint();
    const fieldNum = tag >> 3;
    const wireType = tag & 0x7;

    if (fieldNum === 1) {
      // FeedHeader — skip
      skipField(wireType);
    } else if (fieldNum === 2) {
      // FeedEntity
      if (wireType === 2) {
        const entityData = readBytes();
        // Parse entity to find trip_update
        let ep = 0;
        const eb = entityData;
        function erv(): number {
          let result = 0; let shift = 0;
          while (ep < eb.length) {
            const byte = eb[ep++];
            result |= (byte & 0x7f) << shift;
            if (!(byte & 0x80)) break;
            shift += 7;
          }
          return result;
        }
        function erb(): Uint8Array { const len = erv(); const s = eb.slice(ep, ep + len); ep += len; return s; }

        while (ep < eb.length) {
          const etag = erv();
          const efieldNum = etag >> 3;
          const ewireType = etag & 0x7;
          if (efieldNum === 3) {
            // trip_update field in FeedEntity
            const tu = parseTripUpdate(erb());
            if (tu) updates.push(tu);
          } else {
            if (ewireType === 0) erv();
            else if (ewireType === 1) ep += 8;
            else if (ewireType === 2) erb();
            else if (ewireType === 5) ep += 4;
          }
        }
      } else {
        skipField(wireType);
      }
    } else {
      skipField(wireType);
    }
  }

  return updates;
}

// Fetch a single GTFS-RT feed and parse it
async function fetchFeed(feedKey: string): Promise<GTFSTripUpdate[]> {
  const url = FEED_URLS[feedKey];
  if (!url) return [];

  try {
    const response = await fetch(url, {
      headers: {
        'x-api-key': '0', // MTA public feeds don't require key; some proxies use 0
      },
    });

    if (!response.ok) {
      throw new Error(`Feed ${feedKey} returned ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    return parseGTFSBinary(buffer);
  } catch (err) {
    // Wrap network/parse errors with context
    const message = err instanceof Error ? err.message : 'Unknown fetch error';
    throw new Error(`[GTFS] ${feedKey}: ${message}`);
  }
}

// Get earliest upcoming arrival at any stop for a trip (next stop arrival)
export function getNextArrivalTimestamp(update: GTFSTripUpdate): number | null {
  const nowSec = Date.now() / 1000;
  // Find first stop whose arrival or departure is in the future
  for (const stu of update.stopTimeUpdates) {
    const t = stu.arrivalTime ?? stu.departureTime;
    if (t !== null && t > nowSec - 30) {
      return t * 1000; // convert to ms
    }
  }
  return null;
}

// Aggregate all trip updates from needed feeds
const POLL_INTERVAL_MS = 30000; // 30 seconds — balanced for real-time accuracy vs API load

export function useGTFSRealtime(lines: string[]) {
  const [data, setData] = useState<GTFSRealtimeData>({
    tripUpdates: [],
    feedTimestamp: 0,
    error: null,
  });
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  // Get unique feed keys needed
  const feedKeys = Array.from(new Set(lines.map((l) => LINE_TO_FEED[l]).filter(Boolean)));

  const poll = useCallback(async () => {
    if (feedKeys.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const results = await Promise.allSettled(feedKeys.map((key) => fetchFeed(key)));

      const allUpdates: GTFSTripUpdate[] = [];
      let anySuccess = false;
      const errors: string[] = [];

      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          allUpdates.push(...r.value);
          anySuccess = true;
        } else {
          errors.push(`${feedKeys[i]}: ${r.reason?.message ?? 'unknown error'}`);
        }
      });

      if (!mountedRef.current) return;

      if (anySuccess) {
        setData({
          tripUpdates: allUpdates,
          feedTimestamp: Date.now(),
          error: errors.length > 0 ? errors.join('; ') : null,
        });
      } else {
        setData((prev) => ({
          ...prev,
          error: errors.join('; ') || 'Failed to fetch GTFS-RT feeds',
        }));
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setData((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [feedKeys.join(',')]);

  useEffect(() => {
    mountedRef.current = true;
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [poll]);

  return { data, loading };
}
