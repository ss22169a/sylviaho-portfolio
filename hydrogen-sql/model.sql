-- AI data centers -> fuel cells -> hydrogen -> electrolyzers (DuckDB)
-- Every external input lives in fact_macro_assumptions / fact_vendor_orders with source_id and grade.
CREATE OR REPLACE TABLE fact_macro_assumptions AS SELECT * FROM read_csv_auto('fact_macro_assumptions.csv');
CREATE OR REPLACE TABLE fact_vendor_orders     AS SELECT * FROM read_csv_auto('fact_vendor_orders.csv');

-- Scenario levers (judgment, not sourced) and engineering constants
CREATE OR REPLACE TABLE dim_scenario AS SELECT * FROM (VALUES
  ('Low', 0.02, 0.00), ('Base', 0.05, 0.05), ('High', 0.10, 0.20)) t(scenario, fc_share_2030, h2_share_2030);
CREATE OR REPLACE TABLE dim_constants AS SELECT
  0.55 AS fc_eff, 33.33 AS h2_lhv_kwh_kg, 0.90 AS fc_cf, 52.0 AS ely_kwh_kg, 0.50 AS ely_cf;

-- Added average data-center load by year: linear path from 2024 to 2030 (IEA endpoints)
CREATE OR REPLACE TABLE added_load AS
WITH e AS (SELECT MAX(value) FILTER (year=2024) AS e24, MAX(value) FILTER (year=2030) AS e30
           FROM fact_macro_assumptions WHERE metric='dc_electricity')
SELECT y AS year, ((e24 + (e30-e24)*(y-2024)/6.0) - e24) * 1000 / 8760 AS added_gw
FROM e, range(2026, 2031) r(y);

-- Fuel-cell share and hydrogen share ramp linearly to their 2030 values
CREATE OR REPLACE TABLE mart_demand_forecast AS
SELECT s.scenario, a.year,
       a.added_gw * s.fc_share_2030 * (a.year-2025)/5.0                       AS fc_cum_gw,
       s.h2_share_2030 * (a.year-2025)/5.0                                     AS h2_share
FROM added_load a CROSS JOIN dim_scenario s;

CREATE OR REPLACE TABLE mart_demand_forecast_matrix AS
WITH f AS (
  SELECT m.*, m.fc_cum_gw * m.h2_share AS h2_gw,
         m.fc_cum_gw - COALESCE(LAG(m.fc_cum_gw) OVER (PARTITION BY scenario ORDER BY year), 0) AS fc_add_gw
  FROM mart_demand_forecast m)
SELECT f.scenario, f.year, f.fc_add_gw * 1000 AS fc_add_mw, f.fc_cum_gw, f.h2_gw,
       f.h2_gw * 8760 * c.fc_cf * 1000 / (c.fc_eff * c.h2_lhv_kwh_kg) / 1000 AS h2_kt,      -- GWh -> t -> kt
       f.h2_gw * 8760 * c.fc_cf * 1000 / (c.fc_eff * c.h2_lhv_kwh_kg) * c.ely_kwh_kg / (8760 * c.ely_cf) / 1000 AS ely_gw,
       (SELECT value FROM fact_macro_assumptions WHERE metric='electrolyser_capex_china')          AS capex_lo,
       (SELECT value FROM fact_macro_assumptions WHERE metric='electrolyser_capex_outside_china')  AS capex_hi
FROM f, dim_constants c;

-- Cumulative electrolyzer spend pulled by data centers, USD bn (range by equipment origin)
CREATE OR REPLACE TABLE mart_scenario_2030 AS
SELECT scenario, fc_cum_gw, h2_kt, ely_gw,
       ely_gw * capex_lo / 1000 AS ely_spend_bn_lo, ely_gw * capex_hi / 1000 AS ely_spend_bn_hi,
       POWER(NULLIF(fc_add_mw,0) / NULLIF((SELECT fc_add_mw FROM mart_demand_forecast_matrix x WHERE x.scenario=m.scenario AND x.year=2026),0), 1/4.0) - 1 AS fc_add_cagr
FROM mart_demand_forecast_matrix m WHERE year = 2030;

-- Calibration check: base-case data-center fuel-cell adds vs the leading vendor's factory capacity
CREATE OR REPLACE TABLE check_calibration AS
SELECT m.year, m.fc_add_mw, v.value * 1000 AS vendor_capacity_mw, m.fc_add_mw / (v.value*1000) AS share_of_vendor_capacity
FROM mart_demand_forecast_matrix m JOIN fact_vendor_orders v ON v.metric='factory_capacity' AND v.period='2026'
WHERE m.scenario='Base';
