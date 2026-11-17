-- =====================================================================
-- E-commerce Funnel & Attribution — staging layer (DuckDB)
-- Sources: Google Ads (ad group × day × network × device, via Windsor.ai),
--          Amazon Seller Central (Sales & Traffic by day, All Orders),
--          cancellation log. Currency: Google Ads in TWD, Amazon in USD.
-- =====================================================================

CREATE OR REPLACE TABLE params AS
SELECT 32.0                 AS twd_per_usd,       -- company booking rate
       DATE '2026-09-09'    AS base_start,        -- pre-ad baseline window
       DATE '2026-10-06'    AS base_end,
       DATE '2026-10-07'    AS ads_start,
       DATE '2026-10-21'    AS s2_start,          -- restructure: store home → category/vehicle pages
       DATE '2026-11-15'    AS ads_end,           -- last fully reported day
       2.9                  AS breakeven_roas;    -- 1 / contribution margin (35% GM, fees)

-- Pre-ad baseline (aggregate from Seller Central, 28 days)
CREATE OR REPLACE TABLE stg_baseline AS
SELECT 28 AS days, 5 AS orders, 427.30 AS revenue_usd, 367 AS sessions;

-- Daily blended table: Google spend/clicks + Amazon product-page sessions/orders
CREATE OR REPLACE TABLE stg_daily AS
SELECT d.date::DATE                         AS date,
       d.spend_twd,
       d.spend_twd / p.twd_per_usd          AS spend_usd,
       d.clicks, d.sessions, d.orders, d.units, d.revenue_usd,
       CASE WHEN d.date < p.s2_start THEN 'S1 · Store home, generic broad'
            ELSE 'S2 · Category & vehicle pages' END AS regime
FROM read_csv_auto('data/daily.csv') d, params p
WHERE d.date BETWEEN p.ads_start AND p.ads_end;

-- Ad group grain, mapped to the demand segment each group targets
CREATE OR REPLACE TABLE stg_ads AS
SELECT a.date::DATE AS date, a.campaign, a.ad_group, a.network, a.device,
       a.impressions, a.clicks, a.spend_twd,
       a.spend_twd / p.twd_per_usd AS spend_usd,
       CASE
         WHEN a.ad_group LIKE 'LEGACY%'           THEN 'Generic'
         WHEN a.ad_group LIKE 'BRAND%'            THEN 'Brand'
         WHEN a.ad_group LIKE '%Category%'        THEN 'Category'
         ELSE 'Vehicle-specific' END             AS targeting,
       CASE
         WHEN a.ad_group LIKE 'NOX%'                                   THEN 'NOx sensor'
         WHEN a.ad_group LIKE 'STR%'                                   THEN 'Starter'
         WHEN regexp_matches(a.ad_group, 'Heavy Duty|B6000|Medium-Duty') THEN 'Medium/heavy truck'
         WHEN regexp_matches(a.ad_group, 'F-150|E-Series|Ford 3G')     THEN 'Pickup/van'
         WHEN regexp_matches(a.ad_group, 'Subaru|Infiniti|Jeep Compass') THEN 'Passenger/SUV'
         ELSE 'Unspecified (generic/category/brand)' END              AS segment
FROM read_csv_auto('data/gads_adgroup_daily.csv') a, params p;

-- Order lines 2025-01-01 → 2026-11-15 (status: 成交 = shipped, 取消 = cancelled)
CREATE OR REPLACE TABLE stg_orders AS
SELECT order_date::DATE AS order_date, asin, model, fitment, category, vehicle_class,
       CASE status WHEN '成交' THEN 'shipped' WHEN '取消' THEN 'cancelled' ELSE 'replacement' END AS status,
       units, amount_usd, returned = 'Y' AS returned,
       CASE WHEN category = '啟動馬達'     THEN 'Starter'
            WHEN category LIKE '%NOx%'     THEN 'NOx sensor'
            WHEN vehicle_class = '中重型卡車'   THEN 'Medium/heavy truck'
            WHEN vehicle_class = '皮卡／廂型車' THEN 'Pickup/van'
            WHEN vehicle_class = '小客車／SUV'  THEN 'Passenger/SUV'
            ELSE 'Industrial/off-road' END AS segment
FROM read_csv_auto('data/orders.csv');

CREATE OR REPLACE TABLE stg_cancellations AS
SELECT order_date::DATE AS order_date, asin, amount_usd, ship_service,
       CASE reason_class
         WHEN '付款未完成或重複下單' THEN 'Payment not completed / duplicate'
         WHEN '可能無法如期加急出貨' THEN 'Expedited promise missed'
         ELSE 'Out of stock / unable to ship' END AS cause
FROM read_csv_auto('data/cancellations.csv');

-- ASIN × day traffic from Seller Central Sales & Traffic (last 30 days)
CREATE OR REPLACE TABLE stg_asin_daily AS
SELECT date::DATE AS date, asin, sessions, pageviews, buybox_pct, units, order_items, sales_usd
FROM read_csv_auto('data/asin_daily.csv');
