-- Follow-up check, added Nov 2026: were the Nov 2025 calls right?
-- Compares May–Oct 2026 with May–Oct 2025 for each attribute, using the full weekly exports.
CREATE OR REPLACE TABLE tw_full AS
SELECT term, date_trunc('month', week) AS month, avg(v) AS v
FROM (UNPIVOT tw_raw ON COLUMNS(* EXCLUDE week) INTO NAME term VALUE v)
GROUP BY ALL HAVING month BETWEEN DATE '2021-12-01' AND DATE '2026-10-01';

CREATE OR REPLACE TABLE gl_full AS
SELECT term, date_trunc('month', week) AS month, avg(v) AS v
FROM (UNPIVOT gl_raw ON COLUMNS(* EXCLUDE week) INTO NAME term VALUE v)
GROUP BY ALL HAVING month BETWEEN DATE '2021-12-01' AND DATE '2026-10-01';

CREATE OR REPLACE TABLE calls AS SELECT * FROM (VALUES
  ('托特包','keep'),('尼龍包','keep'),('迷你包','keep'),('編織包','keep'),
  ('包包吊飾','test'),('老錢風','test'),('保齡球包','test'),('大容量包包','test'),
  ('水桶包','down'),('馬鞍包','down'),('腋下包','down')) t(term, call);

-- Rule for a correct call: test → grew ≥20%; keep → between −10% and +20%; down → fell.
CREATE OR REPLACE TABLE validation AS
WITH w AS (
  SELECT term,
    avg(v) FILTER (WHERE month BETWEEN DATE '2025-05-01' AND DATE '2025-10-01') AS y25,
    avg(v) FILTER (WHERE month BETWEEN DATE '2026-05-01' AND DATE '2026-10-01') AS y26
  FROM tw_full GROUP BY term)
SELECT c.term, c.call, round(y25,1) y25, round(y26,1) y26,
  round(100*((y26+1)/(y25+1)-1)) AS chg_pct,
  CASE c.call WHEN 'test' THEN (y26+1)/(y25+1) >= 1.2
              WHEN 'keep' THEN (y26+1)/(y25+1) BETWEEN 0.9 AND 1.2
              ELSE (y26+1)/(y25+1) < 1 END AS correct
FROM calls c JOIN w USING (term);

-- Did suede reach Taiwan? And does the lead-lag hold with 2026 data?
CREATE OR REPLACE TABLE suede_check AS
SELECT 'GL' mkt, round(avg(v) FILTER (WHERE month BETWEEN DATE '2026-05-01' AND DATE '2026-10-01'),1) y26,
       round(avg(v) FILTER (WHERE month BETWEEN DATE '2025-05-01' AND DATE '2025-10-01'),1) y25 FROM gl_full WHERE term='suede bag'
UNION ALL
SELECT 'TW', round(avg(v) FILTER (WHERE month BETWEEN DATE '2026-05-01' AND DATE '2026-10-01'),1),
       round(avg(v) FILTER (WHERE month BETWEEN DATE '2025-05-01' AND DATE '2025-10-01'),1) FROM tw_full WHERE term='麂皮包';

CREATE OR REPLACE TABLE leadlag_full AS
SELECT p.gl, p.tw, k.k AS lag_months, round(corr(g.v, t.v),2) AS r
FROM pairs p CROSS JOIN range(0,10) k(k)
JOIN gl_full g ON g.term = p.gl
JOIN tw_full t ON t.term = p.tw AND t.month = g.month + to_months(k.k)
GROUP BY ALL;
