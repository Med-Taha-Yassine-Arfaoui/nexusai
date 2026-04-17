import requests
import time
from datetime import datetime
import psycopg2
from datetime import datetime
# ==============================
# CONFIG
# ==============================

URL = "https://tunis-stockexchange.com/grafana/api/ds/query?ds_type=grafana-postgresql-datasource&requestId=Q174"

HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "x-grafana-org-id": "1",
    "x-datasource-uid": "ef4kunff033eoe",
    "x-plugin-id": "grafana-postgresql-datasource",
    "x-dashboard-uid": "rottcjl",
    "x-panel-id": "2",
    "Referer": "https://tunis-stockexchange.com/grafana/d-solo/rottcjl/ticker-db",
    "Origin": "https://tunis-stockexchange.com",
    "User-Agent": "Mozilla/5.0"
}

PAYLOAD = {
    "queries": [
        {
            "refId": "A",
            "datasource": {
                "type": "grafana-postgresql-datasource",
                "uid": "ef4kunff033eoe"
            },
            "rawSql": """
WITH latest_date AS (
    SELECT COALESCE(
        MAX(ingested_at::date) FILTER (WHERE ingested_at::date = CURRENT_DATE),
        MAX(ingested_at::date)
    ) AS max_date
    FROM raw_market
),
market_ranked AS (
    SELECT
        raw_data ->> 'codeIsin' AS codeisin,
        (raw_data ->> 'lastTradePrice')::numeric AS last_trade_price,
        raw_data ->> 'mnemo' AS mnemo,
        raw_data ->> 'dateSeance' AS dateseance,
        (raw_data ->> 'time')::timestamp AS time,
        COALESCE((raw_data ->> 'varPrevClose')::numeric, 0) AS var_prev_close,
        (raw_data ->> 'quantity')::numeric AS quantity,
        raw_data ->> 'status' AS status,
        ingested_at,
        ROW_NUMBER() OVER (
            PARTITION BY raw_data ->> 'codeIsin'
            ORDER BY
                CASE WHEN raw_data ->> 'status' = 'Closed' THEN 0 ELSE 1 END,
                (raw_data ->> 'time')::timestamp DESC
        ) AS rn
    FROM raw_market
    WHERE (raw_data ->> 'emm')::int = 1
      AND (raw_data ->> 'ligne')::int = 1
      AND ingested_at::date = (SELECT max_date FROM latest_date)
)
SELECT *
FROM market_ranked
WHERE rn = 1 AND quantity > 0
ORDER BY mnemo;
""",
            "format": "table",
            "datasourceId": 59,
            "intervalMs": 60000,
            "maxDataPoints": 30000
        }
    ],
    "from": "1776184712711",
    "to": "1776206312711"
}

# ==============================
# CORE FUNCTIONS
# ==============================

def fetch_market():
    try:
        res = requests.post(URL, headers=HEADERS, json=PAYLOAD, timeout=10)

        if res.status_code != 200:
            print("❌ Request failed:", res.status_code)
            return []

        data = res.json()

        frame = data["results"]["A"]["frames"][0]
        fields = [f["name"] for f in frame["schema"]["fields"]]
        values = frame["data"]["values"]

        rows = list(zip(*values))
        market = [dict(zip(fields, row)) for row in rows]

        return market

    except Exception as e:
        print("❌ Error:", e)
        return []


def clean_market(market):
    for stock in market:
        stock["time"] = datetime.fromtimestamp(stock["time"] / 1000)
        stock["ingested_at"] = datetime.fromtimestamp(stock["ingested_at"] / 1000)
    return market


def enrich_market(market):
    for stock in market:
        stock["is_up"] = stock["var_prev_close"] > 0
        stock["volume_value"] = stock["quantity"] * stock["last_trade_price"]
    return market


def analyze_market(market):
    top_gainers = sorted(market, key=lambda x: x["var_prev_close"], reverse=True)[:5]
    top_losers = sorted(market, key=lambda x: x["var_prev_close"])[:5]
    most_active = sorted(market, key=lambda x: x["volume_value"], reverse=True)[:5]

    return top_gainers, top_losers, most_active


def save_to_db(market):
    conn = psycopg2.connect("postgresql://postgres:yassine@localhost:5432/nexusai")
    cursor = conn.cursor()
    for stock in market:
      cursor.execute("""
    INSERT INTO "MarketData" 
    (codeisin, mnemo, last_trade_price, quantity, var_prev_close, time, ingested_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (codeisin, time) DO UPDATE SET
        last_trade_price = EXCLUDED.last_trade_price,
        quantity = EXCLUDED.quantity,
        var_prev_close = EXCLUDED.var_prev_close,
        ingested_at = EXCLUDED.ingested_at
""", (
    stock["codeisin"],
    stock["mnemo"],
    stock["last_trade_price"],
    stock["quantity"],
    stock["var_prev_close"],
    stock["time"],
    stock["ingested_at"]
))
    conn.commit()
    cursor.close()
    conn.close()
    print(f"✅ Saved {len(market)} stocks to DB")

    
def display_dashboard(market):
    top_gainers, top_losers, most_active = analyze_market(market)

    print("\n" + "="*50)
    print("📊 LIVE TUNIS MARKET DASHBOARD")
    print("="*50)

    print("\n🚀 Top Gainers:")
    for s in top_gainers:
        print(f"{s['mnemo']:6} | {s['var_prev_close']:>6}% | {s['last_trade_price']}")

    print("\n🔻 Top Losers:")
    for s in top_losers:
        print(f"{s['mnemo']:6} | {s['var_prev_close']:>6}% | {s['last_trade_price']}")

    print("\n💰 Most Active:")
    for s in most_active:
        print(f"{s['mnemo']:6} | {int(s['volume_value'])}")

    print("="*50)



# ==============================
# MAIN LOOP (LIVE MODE)
# ==============================

def run_live(interval=5):
    print("🚀 Starting live market feed...\n")

    while True:
        market = fetch_market()

        if market:
            market = clean_market(market)
            market = enrich_market(market)
            save_to_db(market)   # 🔥 ADD THIS LINE

            display_dashboard(market)
        else:
            print("⚠️ No data received")

        time.sleep(interval)


# ==============================
# ENTRY POINT
# ==============================

if __name__ == "__main__":
    run_live(interval=5)

