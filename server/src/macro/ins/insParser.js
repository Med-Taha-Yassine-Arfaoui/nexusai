/**
 * Normalize INS middle-office JSON into chronological rows (EN locale labels).
 * @param {object} data Raw JSON from fetchInsIndicator
 * @returns {{ period: string, rowOrder: number, [key: string]: string | number | null }[]}
 */
export function parseInsSeries(data) {
  const en = data?.EN;
  if (!en?.fix?.romws || !Array.isArray(en.fix.columns) || !en?.var?.NoFilter) {
    return [];
  }

  const periods = en.fix.romws;
  const columns = en.fix.columns;
  const values = en.var.NoFilter;

  return periods.map((period, rowOrder) => {
    const row = values[period];
    /** @type {Record<string, string | number | null>} */
    const parsed = { period, rowOrder };
    if (!row) return parsed;

    for (const col of columns) {
      const raw = row[col]?.value;
      if (raw === undefined || raw === null || raw === "") {
        parsed[col] = null;
        continue;
      }
      const n = parseFloat(String(raw));
      parsed[col] = Number.isFinite(n) ? n : null;
    }
    return parsed;
  });
}

/**
 * @param {object} data
 * @param {string} columnName e.g. "Trade balance"
 */
export function extractColumnSeries(data, columnName) {
  const rows = parseInsSeries(data);
  return rows.map((r) => ({
    period: r.period,
    rowOrder: r.rowOrder,
    value: r[columnName] ?? null,
    raw: r,
  }));
}
