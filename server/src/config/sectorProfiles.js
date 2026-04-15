/**
 * Sector metadata for BVMT-style behavior (keep in config, not scattered in services).
 * Expand when you move tickers to DB.
 */
export const sectorProfiles = {
  banking: {
    systemic: true,
    sensitivity: "high",
    drivesIndex: true,
    escalationWeight: 1.15,
  },
  technology: {
    systemic: false,
    sensitivity: "medium",
    drivesIndex: false,
    escalationWeight: 1,
  },
  other: {
    systemic: false,
    sensitivity: "low",
    drivesIndex: false,
    escalationWeight: 0.9,
  },
};

export function getSectorProfile(sectorName) {
  if (!sectorName || sectorName === "unknown") return sectorProfiles.other;
  return sectorProfiles[sectorName] || sectorProfiles.other;
}
