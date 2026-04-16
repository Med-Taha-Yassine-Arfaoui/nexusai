const INS_BASE = "https://middleoffice-api.ins.tn/data/find";

/**
 * @param {string} id INS indicator id (e.g. trade balance "1675780959")
 * @returns {Promise<object>}
 */
export async function fetchInsIndicator(id) {
  const res = await fetch(`${INS_BASE}/${id}`);
  if (!res.ok) {
    throw new Error(`INS API error ${res.status} for id ${id}`);
  }
  return res.json();
}
