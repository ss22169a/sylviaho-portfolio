-- Category x AI readiness (DuckDB). Scores 0-2; each score carries its basis (evidence or judgment).
CREATE OR REPLACE TABLE dim_category_scores AS SELECT * FROM read_csv_auto('dim_category_scores.csv');
CREATE OR REPLACE TABLE fact_ai_commerce_signals AS SELECT * FROM read_csv_auto('fact_ai_commerce_signals.csv');
CREATE OR REPLACE TABLE mart_category_matrix AS
SELECT category, ai_discovery, replenishment, trust_return_risk,
       CASE WHEN trust_return_risk > 1                           THEN 'Brand- and experience-led'
            WHEN replenishment >= 1.5 AND ai_discovery >= 1.5    THEN 'AI discovery + auto-reorder'
            WHEN replenishment >= 1.5                            THEN 'Automate reorder'
            WHEN ai_discovery >= 1.5                             THEN 'Win AI-led discovery'
            ELSE 'Basics only' END AS play
FROM dim_category_scores;
