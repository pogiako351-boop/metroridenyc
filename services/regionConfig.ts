/**
 * MetroRide NYC — Regional Configuration
 *
 * ACTIVE_REGION is forced to NYC for this deployment.
 * All UI strings, feed URLs, and terminology are keyed off this value.
 */

export type Region = 'NYC' | 'LA' | 'CHI' | 'SF';

// Force NYC for this deployment — driven by EXPO_PUBLIC_APP_REGION env var
// but always falls back to NYC as the canonical default.
export const ACTIVE_REGION: Region =
  (process.env.EXPO_PUBLIC_APP_REGION as Region | undefined) ?? 'NYC';

export interface RegionConfig {
  name: string;
  displayName: string;
  transitName: string;           // "Subway" / "Metro" / "El"
  agencyName: string;            // "MTA" / "LACMTA"
  statusLabel: string;           // "MTA Status" / "Metro Status"
  nearbyLabel: string;           // "Nearby Stations"
  fareLabel: string;             // "OMNY" / "TAP"
  fareSystemName: string;        // "OMNY" / "TAP Card"
  tapsToUnlimited: number;       // 12 for NYC
  farePerRide: number;           // USD
  timezone: string;
}

const REGION_CONFIGS: Record<Region, RegionConfig> = {
  NYC: {
    name: 'NYC',
    displayName: 'New York City',
    transitName: 'Subway',
    agencyName: 'MTA',
    statusLabel: 'MTA Status',
    nearbyLabel: 'Nearby Stations',
    fareLabel: 'OMNY',
    fareSystemName: 'OMNY',
    tapsToUnlimited: 12,
    farePerRide: 2.90,
    timezone: 'America/New_York',
  },
  LA: {
    name: 'LA',
    displayName: 'Los Angeles',
    transitName: 'Metro',
    agencyName: 'LACMTA',
    statusLabel: 'Metro Status',
    nearbyLabel: 'Nearby Stations',
    fareLabel: 'TAP',
    fareSystemName: 'TAP Card',
    tapsToUnlimited: 0,
    farePerRide: 1.75,
    timezone: 'America/Los_Angeles',
  },
  CHI: {
    name: 'CHI',
    displayName: 'Chicago',
    transitName: 'El',
    agencyName: 'CTA',
    statusLabel: 'CTA Status',
    nearbyLabel: 'Nearby Stops',
    fareLabel: 'Ventra',
    fareSystemName: 'Ventra Card',
    tapsToUnlimited: 0,
    farePerRide: 2.25,
    timezone: 'America/Chicago',
  },
  SF: {
    name: 'SF',
    displayName: 'San Francisco',
    transitName: 'BART',
    agencyName: 'BART',
    statusLabel: 'BART Status',
    nearbyLabel: 'Nearby Stations',
    fareLabel: 'Clipper',
    fareSystemName: 'Clipper Card',
    tapsToUnlimited: 0,
    farePerRide: 2.50,
    timezone: 'America/Los_Angeles',
  },
};

/** Active region's full configuration. Always NYC for this build. */
export const regionConfig: RegionConfig = REGION_CONFIGS[ACTIVE_REGION];

/** Shorthand getters for commonly-used labels */
export const { transitName, agencyName, statusLabel, nearbyLabel, fareSystemName } = regionConfig;
