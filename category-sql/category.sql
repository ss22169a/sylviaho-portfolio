-- =====================================================================
-- Amazon Category Intelligence: demand vs. catalog (DuckDB)
-- Sources: Amazon Product Opportunity Explorer exports (niche pages,
-- "matched products" from seed ASINs, unmet-demand lists), the seller's
-- All Listings report and order history. Part numbers are LESTER / OE.
-- =====================================================================

CREATE OR REPLACE TABLE market AS
SELECT * FROM (VALUES
  ('Alternators', 299980, 90000, 112.02, 0.0753, 41),
  ('Starters',    170134, 70000,  74.33, 0.0460,  2)
) t(category, monthly_searches, units_360d_mid, avg_price_usd, return_rate, our_units_360d);

-- Alternator part numbers: competitor demand vs. what we list
CREATE OR REPLACE TABLE alt AS
SELECT part, fitment, make,
       TRY_CAST(replace(monthly_clicks, ',', '') AS INT)                      AS monthly_clicks,
       TRY_CAST(replace(replace(price_gap, '%', ''), '+', '') AS DOUBLE)/100   AS price_gap,
       TRY_CAST(our_units AS INT)                                             AS our_units,
       CASE
         WHEN match LIKE '有貨%'            THEN '1 · Exact part, in stock'
         WHEN match LIKE '有同料號，但已停售%' THEN '2 · Exact part, delisted'
         WHEN match LIKE '有同車款%'        THEN '3 · Same vehicle, different part no.'
         WHEN match = '沒有'                THEN '4 · Not carried'
         WHEN match LIKE '已售出%'          THEN '5 · Our sellers (no demand data)'
         ELSE '0 · OE reference' END AS bucket
FROM read_csv_auto('data/alt_parts.csv', all_varchar = true);

CREATE OR REPLACE TABLE mart_alt_buckets AS
SELECT bucket, COUNT(*) AS parts, SUM(monthly_clicks) AS monthly_clicks,
       ROUND(SUM(monthly_clicks) * 1.0 / SUM(SUM(monthly_clicks)) OVER (), 3) AS click_share,
       COALESCE(SUM(our_units), 0) AS our_units,
       ROUND(MEDIAN(price_gap), 3) AS median_price_gap,
       COUNT(*) FILTER (ABS(price_gap) <= 0.15) AS priced_within_15pct
FROM alt WHERE bucket NOT LIKE '0%' GROUP BY bucket ORDER BY bucket;

CREATE OR REPLACE TABLE mart_alt_top_delisted AS
SELECT part, fitment, monthly_clicks FROM alt
WHERE bucket LIKE '2%' ORDER BY monthly_clicks DESC;

-- Starter purchase intents (unmet-demand list) vs. what we list
CREATE OR REPLACE TABLE st AS
SELECT intent, make,
       TRY_CAST(replace(monthly_searches, ',', '') AS INT) AS monthly_searches,
       TRY_CAST(replace(monthly_purchases, ',', '') AS INT) AS monthly_purchases,
       TRY_CAST(our_units AS INT) AS our_units,
       CASE WHEN match LIKE '有貨%' THEN '1 · In stock, title lacks model year'
            WHEN match LIKE '有同車款，但年份不符%' THEN '2 · Same vehicle, wrong years'
            WHEN match LIKE '有同車款，但已停售%' THEN '3 · Same vehicle, delisted'
            WHEN match = '沒有' THEN '4 · Not carried'
            ELSE '5 · Our sellers (no demand data)' END AS bucket
FROM read_csv_auto('data/starter_intents.csv', all_varchar = true);

CREATE OR REPLACE TABLE mart_starter_buckets AS
SELECT bucket, COUNT(*) AS intents, SUM(monthly_searches) AS monthly_searches,
       SUM(monthly_purchases) AS market_purchases_per_month, COALESCE(SUM(our_units),0) AS our_units
FROM st GROUP BY bucket ORDER BY bucket;

CREATE OR REPLACE TABLE mart_starter_gap_by_make AS
SELECT make, SUM(monthly_searches) AS monthly_searches, SUM(monthly_purchases) AS market_purchases
FROM st WHERE bucket LIKE '4%' GROUP BY make ORDER BY monthly_searches DESC;

-- NOx sensors: same part number, our price vs. aftermarket median
CREATE OR REPLACE TABLE mart_nox AS
SELECT part, TRY_CAST(replace(monthly_clicks, ',', '') AS INT) AS monthly_clicks,
       TRY_CAST(replace(replace(price_gap, '%', ''), '+', '') AS DOUBLE)/100 AS price_gap
FROM read_csv_auto('data/nox_parts.csv', all_varchar = true)
WHERE match LIKE '有貨%' ORDER BY price_gap;

-- Where the seller actually wins: shipped orders by vehicle class
CREATE OR REPLACE TABLE mart_wins AS
SELECT CASE WHEN category = '啟動馬達' THEN 'Starters'
            WHEN category LIKE '%NOx%' THEN 'NOx sensors'
            WHEN vehicle_class = '中重型卡車' THEN 'Alternators · medium/heavy truck'
            WHEN vehicle_class = '工業／工程機械' THEN 'Alternators · industrial/off-road'
            WHEN vehicle_class = '皮卡／廂型車' THEN 'Alternators · pickup/van'
            ELSE 'Alternators · passenger/SUV' END AS segment,
       COUNT(*) FILTER (status = '成交') AS shipped_orders,
       ROUND(SUM(amount_usd) FILTER (status = '成交') / SUM(SUM(amount_usd) FILTER (status = '成交')) OVER (), 3) AS revenue_share
FROM read_csv_auto('data/orders.csv') GROUP BY 1 ORDER BY revenue_share DESC NULLS LAST;
