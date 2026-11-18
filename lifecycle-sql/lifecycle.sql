-- =====================================================================
-- ICE aftermarket parts: lifecycle stage x demand -> SKU decision (DuckDB)
-- Inputs: lines.csv (Amazon Product Opportunity Explorer demand per part
-- number or search intent, joined to the seller's catalog by LESTER / OE
-- part number) and survival.csv (NHTSA DOT HS 809 952, Tables 3-4).
-- Reference year 2026. Heavy-duty trucks use the light-truck curve as a
-- conservative proxy (NHTSA publishes no heavy-truck schedule).
-- =====================================================================
CREATE OR REPLACE TABLE surv AS SELECT * FROM read_csv_auto('survival.csv');
CREATE OR REPLACE TABLE lines AS SELECT * FROM read_csv_auto('lines.csv');

CREATE OR REPLACE TABLE aged AS
SELECT l.*,
       2026 - my1                                   AS age_min,
       2026 - my0                                   AS age_max,
       2026 - (my0 + my1) / 2.0                     AS age_mid,
       CASE WHEN segment = 'Passenger car' THEN s.car ELSE s.light_truck END AS surviving
FROM lines l
JOIN surv s ON s.age = GREATEST(1, LEAST(36, CAST(ROUND(2026 - (my0 + my1) / 2.0) AS INT)))
WHERE my0 IS NOT NULL AND demand IS NOT NULL;

-- Stage = share of the original fleet still on the road at the midpoint model year
CREATE OR REPLACE TABLE staged AS
SELECT *,
  CASE WHEN surviving >= 0.85 THEN '1 · Ramp'
       WHEN surviving >= 0.45 THEN '2 · Prime'
       WHEN surviving >= 0.15 THEN '3 · Tail'
       ELSE '4 · Sunset' END AS stage,
  PERCENT_RANK() OVER (PARTITION BY cat ORDER BY demand) AS demand_pct
FROM aged;

-- Decision rules (price override first)
CREATE OR REPLACE TABLE decided AS
SELECT *,
  CASE
    WHEN price_gap >= 0.50 AND competitors >= 1           THEN 'Reprice or exit'
    WHEN stage IN ('1 · Ramp','2 · Prime') AND demand_pct >= 0.5 THEN 'Invest'
    WHEN stage IN ('3 · Tail','4 · Sunset') AND demand_pct >= 0.5 THEN 'Harvest'
    WHEN stage IN ('1 · Ramp','2 · Prime')                 THEN 'Watch'
    ELSE 'Exit' END AS decision
FROM staged;

CREATE OR REPLACE TABLE mart_decision AS
SELECT decision, COUNT(*) AS lines,
       ROUND(SUM(demand) FILTER (cat='Alternator') * 1.0 / SUM(SUM(demand) FILTER (cat='Alternator')) OVER (), 3) AS alt_demand_share, ROUND(SUM(demand_pct)/COUNT(*),2) AS avg_demand_pct,
       COUNT(*) FILTER (position = 'In stock') AS in_stock,
       COUNT(*) FILTER (position IN ('Delisted','Different part no.','Not carried')) AS gaps
FROM decided GROUP BY decision ORDER BY decision;

CREATE OR REPLACE TABLE mart_stage_cat AS
SELECT cat, stage, COUNT(*) AS lines, SUM(demand) AS demand
FROM decided GROUP BY cat, stage ORDER BY cat, stage;

-- Validation: does search momentum fall as starter fitments age?
CREATE OR REPLACE TABLE mart_trend_by_stage AS
SELECT stage, COUNT(*) AS intents, ROUND(MEDIAN(trend),3) AS median_search_growth,
       ROUND(AVG(trend),3) AS avg_search_growth
FROM decided WHERE cat = 'Starter' AND trend IS NOT NULL GROUP BY stage ORDER BY stage;
