-- =====================================================================
-- Attribution: four lenses, from weakest to strongest evidence.
-- No click-level join exists (Google can't see Amazon checkout), so we
-- triangulate instead of trusting a single "ROAS".
-- =====================================================================

-- A1. Pre/post incrementality vs the 28-day pre-ad baseline
CREATE OR REPLACE TABLE mart_incrementality AS
WITH base AS (SELECT revenue_usd/days AS rev_day, orders*1.0/days AS ord_day,
                     sessions*1.0/days AS ses_day FROM stg_baseline),
     agg AS (SELECT regime, COUNT(*) AS days, SUM(revenue_usd) AS rev, SUM(orders) AS ord,
                    SUM(sessions) AS ses, SUM(spend_usd) AS spend FROM stg_daily GROUP BY regime
             UNION ALL
             SELECT 'Total ad window', COUNT(*), SUM(revenue_usd), SUM(orders),
                    SUM(sessions), SUM(spend_usd) FROM stg_daily)
SELECT regime, days,
       ROUND(spend,2)                               AS spend_usd,
       ROUND(rev,2)                                 AS revenue_usd,
       ROUND(rev/spend,2)                           AS blended_roas,
       ROUND(rev - b.rev_day*days, 2)               AS incremental_revenue_usd,
       ROUND((rev - b.rev_day*days)/spend, 2)       AS iroas,
       ROUND(ses*1.0/days / b.ses_day - 1, 3)       AS session_lift,
       ROUND(ord*1.0/days / b.ord_day - 1, 3)       AS order_lift
FROM agg, base b ORDER BY regime;

-- A2. Seasonality control: same calendar window one year earlier
CREATE OR REPLACE TABLE mart_yoy AS
SELECT year(order_date) AS yr,
       COUNT(*) FILTER (status='shipped')                   AS shipped_orders,
       ROUND(SUM(amount_usd) FILTER (status='shipped'), 2)  AS net_revenue_usd
FROM stg_orders
WHERE (order_date BETWEEN DATE '2025-10-07' AND DATE '2025-11-15')
   OR (order_date BETWEEN DATE '2026-10-07' AND DATE '2026-11-15')
GROUP BY yr ORDER BY yr;

-- A3. Budget–demand alignment: share of spend vs share of proven demand
--     Demand = shipped revenue Jan 2025 – Nov 2026 (independent of ads).
CREATE OR REPLACE TABLE mart_alignment AS
WITH spend AS (SELECT segment, SUM(spend_usd) s FROM stg_ads GROUP BY segment),
     demand AS (SELECT segment, SUM(amount_usd) FILTER (status='shipped') r,
                       COUNT(*) FILTER (status='shipped') n FROM stg_orders GROUP BY segment),
     seg AS (SELECT segment FROM spend UNION SELECT segment FROM demand)
SELECT seg.segment,
       ROUND(COALESCE(s,0),2)                                AS spend_usd_30d,
       ROUND(COALESCE(s,0) / (SELECT SUM(s) FROM spend), 3)  AS spend_share,
       COALESCE(n,0)                                         AS shipped_orders,
       ROUND(COALESCE(r,0),2)                                AS demand_usd,
       ROUND(COALESCE(r,0) / (SELECT SUM(r) FROM demand), 3) AS demand_share,
       ROUND(COALESCE(r,0) / NULLIF(n,0), 2)                 AS aov_usd
FROM seg LEFT JOIN spend USING (segment) LEFT JOIN demand USING (segment)
ORDER BY demand_share DESC;

-- A4. Coverage attribution: was a matching vehicle-specific ad group live
--     (≥1 click in the 3 days before) when each ad-window order was placed?
CREATE OR REPLACE TABLE mart_coverage AS
WITH live AS (SELECT segment, date FROM stg_ads
              WHERE targeting='Vehicle-specific' GROUP BY ALL HAVING SUM(clicks)>0)
SELECT o.order_date, o.model, o.fitment, o.segment, o.status, o.amount_usd,
       EXISTS (SELECT 1 FROM live l WHERE l.segment=o.segment
               AND l.date BETWEEN o.order_date - 3 AND o.order_date) AS covered_by_specific_ad
FROM stg_orders o, params p
WHERE o.order_date BETWEEN p.ads_start AND p.ads_end AND o.status <> 'replacement'
ORDER BY o.order_date;

-- A5. Response curve: does daily spend move product-page sessions? (S2 only)
CREATE OR REPLACE TABLE mart_lag AS
WITH s2 AS (SELECT * FROM stg_daily, params WHERE date >= s2_start AND date <= DATE '2026-11-14')
SELECT k AS lag_days,
       ROUND(corr(a.spend_usd, b.sessions), 2) AS corr_spend_sessions,
       ROUND(corr(a.clicks,    b.sessions), 2) AS corr_clicks_sessions,
       COUNT(*) AS n_days
FROM range(0,4) t(k)
JOIN s2 a ON TRUE
JOIN s2 b ON b.date = a.date + CAST(k AS INTEGER)
GROUP BY k ORDER BY k;

-- A6. Break-even math: what the account must deliver per week
CREATE OR REPLACE TABLE mart_breakeven AS
WITH w AS (SELECT SUM(spend_usd)*7.0/COUNT(*) spend_wk,
                  SUM(revenue_usd)*7.0/COUNT(*) rev_wk FROM stg_daily),
     aov AS (SELECT AVG(amount_usd) a FROM stg_orders WHERE status='shipped')
SELECT ROUND(spend_wk,2) AS spend_per_week_usd,
       ROUND(rev_wk,2)   AS revenue_per_week_usd,
       ROUND(spend_wk * p.breakeven_roas, 2) AS revenue_needed_per_week_usd,
       ROUND(spend_wk * p.breakeven_roas / aov.a, 1) AS orders_needed_per_week,
       ROUND((SELECT orders*7.0/days FROM stg_baseline), 1) AS baseline_orders_per_week,
       ROUND(aov.a,2) AS aov_usd
FROM w, aov, params p;
