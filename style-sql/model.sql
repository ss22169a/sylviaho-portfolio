-- Style-signal model for a mid-price handbag brand (DuckDB)
-- Inputs: weekly Google Trends exports, Taiwan (shared 托特包 anchor) and worldwide.
CREATE OR REPLACE TABLE tw_raw AS
SELECT a.week, a."托特包", a."麂皮包", a."包包吊飾", a."腋下包", a."水桶包",
       b."馬鞍包", b."保齡球包", b."編織包", b."尼龍包",
       c."老錢風", c."大容量包包", c."迷你包"
FROM read_csv_auto('raw/TW-1.csv') a
JOIN read_csv_auto('raw/TW-2.csv') b USING (week)
JOIN read_csv_auto('raw/TW-3.csv') c USING (week);

CREATE OR REPLACE TABLE gl_raw AS SELECT * FROM read_csv_auto('raw/GL-1.csv');

-- long format, monthly mean
CREATE OR REPLACE TABLE tw_m AS
SELECT term, date_trunc('month', week) AS month, avg(v) AS v
FROM (UNPIVOT tw_raw ON COLUMNS(* EXCLUDE week) INTO NAME term VALUE v)
GROUP BY ALL;

CREATE OR REPLACE TABLE gl_m AS
SELECT term, date_trunc('month', week) AS month, avg(v) AS v
FROM (UNPIVOT gl_raw ON COLUMNS(* EXCLUDE week) INTO NAME term VALUE v)
GROUP BY ALL;

-- drop the partial first/last months
CREATE OR REPLACE TABLE tw_mc AS SELECT * FROM tw_m WHERE month BETWEEN DATE '2021-12-01' AND DATE '2026-10-01';
CREATE OR REPLACE TABLE gl_mc AS SELECT * FROM gl_m WHERE month BETWEEN DATE '2021-12-01' AND DATE '2026-10-01';

-- Taiwan scorecard: level = last 6 months (May–Oct 2026) on the 托特包 scale;
-- momentum = last 6 months vs the same 6 months a year earlier; +1 smooths the zero floor.
CREATE OR REPLACE TABLE tw_score AS
WITH w AS (
  SELECT term,
    avg(v) FILTER (WHERE month BETWEEN DATE '2026-05-01' AND DATE '2026-10-01') AS lvl_now,
    avg(v) FILTER (WHERE month BETWEEN DATE '2025-05-01' AND DATE '2025-10-01') AS lvl_ly,
    avg(v) FILTER (WHERE month BETWEEN DATE '2022-01-01' AND DATE '2022-12-01') AS lvl_2022,
    avg(v) FILTER (WHERE month BETWEEN DATE '2026-08-01' AND DATE '2026-10-01') AS l3,
    avg(v) FILTER (WHERE month BETWEEN DATE '2026-05-01' AND DATE '2026-07-01') AS p3
  FROM tw_mc GROUP BY term)
SELECT term, round(lvl_now,1) lvl_now, round(lvl_ly,1) lvl_ly, round(lvl_2022,1) lvl_2022,
  round(100*((lvl_now+1)/(lvl_ly+1)-1)) AS yoy_pct,
  round(100*((lvl_now+1)/(lvl_2022+1)-1)) AS vs2022_pct,
  round(100*((l3+1)/(p3+1)-1)) AS q_pct
FROM w;

-- Global scorecard on its own scale (May–Oct 2026 vs a year earlier)
CREATE OR REPLACE TABLE gl_score AS
WITH w AS (
  SELECT term,
    avg(v) FILTER (WHERE month BETWEEN DATE '2026-05-01' AND DATE '2026-10-01') AS now,
    avg(v) FILTER (WHERE month BETWEEN DATE '2025-05-01' AND DATE '2025-10-01') AS ly,
    avg(v) FILTER (WHERE month BETWEEN DATE '2022-01-01' AND DATE '2022-12-01') AS b22
  FROM gl_mc GROUP BY term)
SELECT term, round(now,1) now, round(100*(now/ly-1)) yoy_pct, round(now/b22,1) x_vs_2022 FROM w;

-- Onset: first month a term holds ≥2× its 2022 average for 3 straight months
CREATE OR REPLACE TABLE onset AS
WITH b AS (SELECT 'TW' mkt, term, month, v FROM tw_mc UNION ALL SELECT 'GL', term, month, v FROM gl_mc),
base AS (SELECT mkt, term, avg(v)+1 AS b FROM b WHERE year(month)=2022 GROUP BY ALL),
f AS (SELECT b.*, (v+1) >= 2*base.b AS hi FROM b JOIN base USING (mkt, term)),
r AS (SELECT *, hi AND lead(hi,1) OVER w AND lead(hi,2) OVER w AS run3 FROM f WINDOW w AS (PARTITION BY mkt, term ORDER BY month))
SELECT mkt, term, min(month) FILTER (WHERE run3) AS onset_month FROM r GROUP BY ALL;

-- Lead-lag: correlation of global(t) with Taiwan(t+k), k = 0..9 months
CREATE OR REPLACE TABLE pairs AS SELECT * FROM (VALUES
  ('suede bag','麂皮包'),('bag charm','包包吊飾'),('bowling bag','保齡球包')) t(gl, tw);
CREATE OR REPLACE TABLE leadlag AS
SELECT p.gl, p.tw, k.k AS lag_months, round(corr(g.v, t.v),2) AS r
FROM pairs p CROSS JOIN range(0,10) k(k)
JOIN gl_mc g ON g.term = p.gl
JOIN tw_mc t ON t.term = p.tw AND t.month = g.month + to_months(k.k)
GROUP BY ALL ORDER BY p.gl, k.k;

-- Seasonality: average index by calendar month, 2022–2025 full years
CREATE OR REPLACE TABLE season AS
SELECT term, month(month) AS m, round(avg(v),1) AS v
FROM tw_mc WHERE year(month) BETWEEN 2022 AND 2025 GROUP BY ALL;
