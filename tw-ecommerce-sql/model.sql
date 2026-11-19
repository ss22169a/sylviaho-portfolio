-- Plateau test: growth decay and share stability of Taiwan retail online sales (DuckDB)
CREATE OR REPLACE TABLE fact_retail_online AS SELECT * FROM read_csv_auto('fact_retail_online.csv');
CREATE OR REPLACE TABLE fact_market_signals AS SELECT * FROM read_csv_auto('fact_market_signals.csv');
CREATE OR REPLACE TABLE mart_plateau_test AS
SELECT
  AVG(online_yoy) FILTER (year BETWEEN 2020 AND 2021) AS boom_growth,
  AVG(online_yoy) FILTER (year BETWEEN 2023 AND 2025) AS recent_growth,
  MAX(online_share_of_retail) FILTER (year BETWEEN 2021 AND 2025) - MIN(online_share_of_retail) FILTER (year BETWEEN 2021 AND 2025) AS share_range_pp,
  CASE WHEN AVG(online_yoy) FILTER (year BETWEEN 2023 AND 2025) < 0.05
        AND MAX(online_share_of_retail) FILTER (year BETWEEN 2021 AND 2025) - MIN(online_share_of_retail) FILTER (year BETWEEN 2021 AND 2025) < 0.015
       THEN 'plateau' ELSE 'still expanding' END AS verdict
FROM fact_retail_online;
