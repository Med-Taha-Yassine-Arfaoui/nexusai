// Simple sector mapping for mnemonics -> sector
// Expand as needed; imperfect mapping is fine for now
const sectorMap = {
  // Banking
  BIAT: "banking",
  ATB: "banking",
  STB: "banking",
  BNA: "banking",
  UIB: "banking",
  UBCI: "banking",
  WIFAK: "banking",
  TJARI: "banking",

  // Technology
  TLNET: "technology",

  // Consumer
  PGH: "consumer",
  SFBT: "consumer",
  SAH: "consumer",

  // Industrial
  SOMOC: "industrial",
  SIAME: "industrial",
  STPIL: "industrial",
  STPAP: "industrial",

  // Materials / construction
  ASSAD: "materials",
  PLAST: "materials",

  // Energy / utilities (approx)
  SOTUV: "energy",
  STEG: "energy",
};

export function getSector(mnemo) {
  if (!mnemo) return "other";
  const clean = String(mnemo).toUpperCase();
  // If we don't have a mapping, return the ticker as a fallback label
  // e.g., 'TLNET' -> 'tlnet' so the UI shows a specific identifier instead of 'other'
  return sectorMap[clean] || clean.toLowerCase();
}

export default sectorMap;
