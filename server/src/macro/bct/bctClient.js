import axios from "axios";

const BCT_URL =
  "https://www.bct.gov.tn/bct/siteprod/tableau_statistique_a.jsp?params=PL203105";

export async function fetchBctRates() {
  const res = await axios.get(BCT_URL, {
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 20000,
  });
  return res.data;
}
