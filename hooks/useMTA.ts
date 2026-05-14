import { useState, useEffect, useRef, useCallback } from 'react';
import { useGTFSRealtime, getNextArrivalTimestamp, GTFSTripUpdate } from './useGTFSRealtime';

export interface TrainArrival {
  line: string;
  destination: string;
  /** @deprecated Use arrivalTimestampMs for real-time countdown */
  minutesAway: number;
  occupancy: 'low' | 'medium' | 'high';
  isGhost: boolean;
  vehicleId: string;
  lastUpdate: number;
  /** Unix ms of next arrival at this stop (from GTFS-RT). null if not available. */
  arrivalTimestampMs: number | null;
}

export interface TrainCar {
  carId: string;
  occupancy: 'quiet' | 'moderate' | 'busy';
  exitTip?: string;
}

// Seed arrival times relative to now for mock data
function seedArrivalMs(minutesAway: number): number {
  return Date.now() + minutesAway * 60 * 1000;
}

// Mock data — used when GTFS-RT feed is unavailable or loading
const buildMockTrains = (): TrainArrival[] => [
  {
    line: 'A',
    destination: 'Inwood - 207 St',
    minutesAway: 2,
    occupancy: 'low',
    isGhost: false,
    vehicleId: 'A001',
    lastUpdate: Date.now(),
    arrivalTimestampMs: seedArrivalMs(2),
  },
  {
    line: 'C',
    destination: '168 St',
    minutesAway: 5,
    occupancy: 'medium',
    isGhost: false,
    vehicleId: 'C001',
    lastUpdate: Date.now(),
    arrivalTimestampMs: seedArrivalMs(5),
  },
  {
    line: 'E',
    destination: 'Jamaica Center',
    minutesAway: 9,
    occupancy: 'high',
    isGhost: true,
    vehicleId: 'E001',
    lastUpdate: Date.now() - 200000,
    arrivalTimestampMs: seedArrivalMs(9),
  },
  {
    line: '1',
    destination: 'Van Cortlandt Park',
    minutesAway: 3,
    occupancy: 'low',
    isGhost: false,
    vehicleId: '1001',
    lastUpdate: Date.now(),
    arrivalTimestampMs: seedArrivalMs(3),
  },
  {
    line: 'N',
    destination: 'Astoria',
    minutesAway: 7,
    occupancy: 'medium',
    isGhost: false,
    vehicleId: 'N001',
    lastUpdate: Date.now(),
    arrivalTimestampMs: seedArrivalMs(7),
  },
];

const MOCK_CARS: TrainCar[] = [
  { carId: '8412', occupancy: 'quiet', exitTip: 'Board Car 1 for stairs at Times Sq' },
  { carId: '8413', occupancy: 'moderate' },
  { carId: '8414', occupancy: 'busy', exitTip: 'Board Car 4 for 42nd St Exit' },
  { carId: '8415', occupancy: 'quiet' },
  { carId: '8416', occupancy: 'moderate', exitTip: 'Best for Penn Station exit' },
  { carId: '8417', occupancy: 'busy' },
  { carId: '8418', occupancy: 'quiet', exitTip: 'Last car — least crowded' },
  { carId: '8419', occupancy: 'moderate' },
];

// Lines to fetch GTFS-RT data for
const TRACKED_LINES = ['A', 'C', 'E', '1', 'N', 'Q', 'R', 'B', 'D', 'F', 'L', '4', '5', '6', '7', 'G', 'J', 'Z', 'W', 'M', '2', '3', 'S'];

// Find the best matching trip update for a given line from live feed
function matchTripUpdate(
  tripUpdates: GTFSTripUpdate[],
  vehicleId: string,
  line: string,
): GTFSTripUpdate | null {
  // Try matching by vehicleId first (exact)
  const byVehicle = tripUpdates.find(
    (u) => u.vehicleId === vehicleId || u.tripId.includes(vehicleId),
  );
  if (byVehicle) return byVehicle;

  // Fall back to first upcoming trip for this route
  const now = Date.now() / 1000;
  const byRoute = tripUpdates.filter(
    (u) =>
      u.routeId === line &&
      u.stopTimeUpdates.some((s) => (s.arrivalTime ?? s.departureTime ?? 0) > now),
  );
  if (byRoute.length > 0) return byRoute[0];

  return null;
}

// Merge live GTFS-RT arrival timestamps into train list
function mergeGTFSData(
  trains: TrainArrival[],
  tripUpdates: GTFSTripUpdate[],
  feedTimestamp: number,
): TrainArrival[] {
  if (tripUpdates.length === 0) return trains;

  return trains.map((train) => {
    const matched = matchTripUpdate(tripUpdates, train.vehicleId, train.line);
    if (!matched) return train;

    const arrivalTimestampMs = getNextArrivalTimestamp(matched);
    const isGhost = feedTimestamp > 0
      ? Date.now() - feedTimestamp > 180000 || (matched.timestamp > 0 && Date.now() / 1000 - matched.timestamp > 180)
      : train.isGhost;

    return {
      ...train,
      arrivalTimestampMs,
      isGhost,
      lastUpdate: matched.timestamp > 0 ? matched.timestamp * 1000 : train.lastUpdate,
    };
  });
}

export function useMTATrains() {
  const [mockTrains] = useState<TrainArrival[]>(() => buildMockTrains());
  const { data: gtfsData, loading: gtfsLoading } = useGTFSRealtime(TRACKED_LINES);

  // Merge live data into trains whenever feed updates
  const trains = gtfsData.feedTimestamp > 0
    ? mergeGTFSData(mockTrains, gtfsData.tripUpdates, gtfsData.feedTimestamp)
    : mockTrains;

  // Filter out trains that have already departed (more than 60s past)
  const activeTrains = trains.filter((t) => {
    if (t.arrivalTimestampMs === null) return true;
    return t.arrivalTimestampMs > Date.now() - 60000;
  });

  return {
    trains: activeTrains,
    loading: gtfsLoading,
    feedError: gtfsData.error,
    feedTimestamp: gtfsData.feedTimestamp,
  };
}

export function useTrainCars(line: string) {
  const [cars] = useState<TrainCar[]>(MOCK_CARS);
  const isGhost = line === 'E';
  return { cars, isGhost };
}

// Hook for getting a single train's live arrival from GTFS-RT
export function useTrainArrival(line: string, vehicleId: string) {
  const { data: gtfsData, loading } = useGTFSRealtime([line]);

  const tripUpdate = gtfsData.tripUpdates.length > 0
    ? matchTripUpdate(gtfsData.tripUpdates, vehicleId, line)
    : null;

  const arrivalTimestampMs = tripUpdate ? getNextArrivalTimestamp(tripUpdate) : null;

  return {
    arrivalTimestampMs,
    loading,
    error: gtfsData.error,
    feedTimestamp: gtfsData.feedTimestamp,
  };
}
