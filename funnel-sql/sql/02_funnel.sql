-- =====================================================================
-- Funnel: Impression → Click → Product-page session → Order → Net order
-- Google cannot see Amazon purchases, so the click→session hop is a
-- blended ratio (all product-page sessions ÷ paid clicks), not a join.
-- =====================================================================

-- F1. Daily funnel by regime (S1 vs S2)
CREATE OR REPLACE TABLE mart_funnel_regime AS
SELECT regime,
       COUNT(*)                                   AS days,
       SUM(clicks)                                AS clicks,
       SUM(sessions)                              AS sessions,
       SUM(orders)                                AS orders,
       ROUND(SUM(spend_usd), 2)                   AS spend_usd,
       ROUND(SUM(revenue_usd), 2)                 AS revenue_usd,
       ROUND(SUM(sessions) / SUM(clicks), 3)      AS session_per_click,
       ROUND(SUM(orders)   / NULLIF(SUM(sessions),0), 4) AS order_per_session,
       ROUND(SUM(spend_usd) / NULLIF(SUM(sessions),0), 2) AS cost_per_session_usd,
       ROUND(SUM(sessions) * 7.0 / COUNT(*), 1)   AS sessions_per_week
FROM stg_daily GROUP BY regime ORDER BY regime;

-- F2. Ad-platform top of funnel at ad-group grain (last 30 days)
CREATE OR REPLACE TABLE mart_adgroup AS
SELECT targeting, segment, ad_group,
       SUM(impressions) AS impressions, SUM(clicks) AS clicks,
       ROUND(SUM(spend_usd), 2) AS spend_usd,
       ROUND(SUM(clicks) / NULLIF(SUM(impressions),0), 3) AS ctr,
       ROUND(SUM(spend_usd) / NULLIF(SUM(clicks),0), 2)   AS cpc_usd,
       ROUND(SUM(spend_usd) / SUM(SUM(spend_usd)) OVER (), 3) AS spend_share
FROM stg_ads GROUP BY ALL ORDER BY spend_usd DESC;

-- F3. Where the spend lands: network × device leakage
CREATE OR REPLACE TABLE mart_network AS
SELECT network, device, SUM(clicks) AS clicks, ROUND(SUM(spend_usd),2) AS spend_usd,
       ROUND(SUM(spend_usd) / SUM(SUM(spend_usd)) OVER (), 3) AS spend_share
FROM stg_ads GROUP BY ALL ORDER BY spend_usd DESC;

-- F4. End-to-end funnel for the ad window (10/7 – 11/15)
--     Orders placed → shipped → kept (not returned), from the order log
CREATE OR REPLACE TABLE mart_funnel_full AS
WITH win AS (SELECT * FROM stg_orders, params
             WHERE order_date BETWEEN ads_start AND ads_end AND status <> 'replacement'),
     top AS (SELECT SUM(impressions) imp FROM stg_ads, params
             WHERE date BETWEEN ads_start AND ads_end)
SELECT 1 AS step, 'Impressions (10/18–11/15, ad-group data)' AS stage, (SELECT imp FROM top) AS n UNION ALL
SELECT 2, 'Paid clicks',               (SELECT SUM(clicks)   FROM stg_daily) UNION ALL
SELECT 3, 'Product-page sessions',     (SELECT SUM(sessions) FROM stg_daily) UNION ALL
SELECT 4, 'Orders placed',             (SELECT COUNT(*) FROM win) UNION ALL
SELECT 5, 'Orders shipped',            (SELECT COUNT(*) FROM win WHERE status='shipped') UNION ALL
SELECT 6, 'Orders kept (net of returns)', (SELECT COUNT(*) FROM win WHERE status='shipped' AND NOT returned)
ORDER BY step;

-- F5. Post-click leakage over the full history: cancellations and returns
CREATE OR REPLACE TABLE mart_leakage AS
SELECT segment,
       COUNT(*) FILTER (status IN ('shipped','cancelled'))       AS orders_placed,
       COUNT(*) FILTER (status='cancelled')                      AS cancelled,
       ROUND(COUNT(*) FILTER (status='cancelled') * 1.0
             / COUNT(*) FILTER (status IN ('shipped','cancelled')), 3) AS cancel_rate,
       COUNT(*) FILTER (returned)                                AS returned,
       ROUND(SUM(amount_usd) FILTER (status='shipped'), 2)       AS net_revenue_usd,
       ROUND(SUM(amount_usd) FILTER (status='cancelled' AND amount_usd>0), 2) AS cancelled_value_usd
FROM stg_orders GROUP BY segment ORDER BY net_revenue_usd DESC NULLS LAST;

CREATE OR REPLACE TABLE mart_cancel_cause AS
SELECT cause, COUNT(*) AS n,
       ROUND(COUNT(*) * 1.0 / SUM(COUNT(*)) OVER (), 3) AS share,
       ROUND(SUM(amount_usd), 2) AS value_usd
FROM stg_cancellations WHERE order_date >= DATE '2026-01-01'
GROUP BY cause ORDER BY n DESC;

-- F6. Product-page layer: are sessions landing on products that convert?
CREATE OR REPLACE TABLE mart_asin AS
WITH a AS (SELECT asin, SUM(sessions) s, SUM(order_items) o, SUM(sales_usd) r
           FROM stg_asin_daily GROUP BY asin),
     m AS (SELECT DISTINCT asin, model, segment FROM stg_orders),
     hist AS (SELECT asin, COUNT(*) FILTER (status='cancelled') cxl_hist,
                     COUNT(*) FILTER (returned) ret_hist FROM stg_orders GROUP BY asin)
SELECT a.asin, m.model, COALESCE(m.segment,'Never ordered') AS segment,
       a.s AS sessions, a.o AS order_items,
       ROUND(a.o / NULLIF(a.s,0), 3) AS unit_session_pct,
       COALESCE(h.cxl_hist,0) AS cancels_all_time, COALESCE(h.ret_hist,0) AS returns_all_time
FROM a LEFT JOIN m USING (asin) LEFT JOIN hist h USING (asin)
ORDER BY sessions DESC;

CREATE OR REPLACE TABLE mart_asin_summary AS
SELECT COUNT(*) AS asins_with_traffic,
       COUNT(*) FILTER (order_items > 0) AS asins_converting,
       COUNT(*) FILTER (sessions = 1) AS single_session_asins,
       SUM(sessions) AS sessions, SUM(order_items) AS order_items,
       ROUND(SUM(order_items) / SUM(sessions), 3) AS unit_session_pct,
       ROUND(SUM(sessions) FILTER (segment = 'Never ordered') / SUM(sessions), 3) AS share_sessions_never_ordered_asins
FROM mart_asin;

CREATE OR REPLACE TABLE mart_window_cancels AS
SELECT cause, COUNT(*) AS n
FROM stg_cancellations, params
WHERE order_date BETWEEN ads_start AND ads_end
GROUP BY cause;

CREATE OR REPLACE TABLE mart_attribution_tags AS
SELECT COUNT(DISTINCT ad_group) AS ad_groups,
       COUNT(DISTINCT ad_group) FILTER (final_url LIKE '%maas=%') AS tagged
FROM read_csv_auto('data/gads_adgroup_daily.csv');
