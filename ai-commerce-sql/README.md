# AI and Consumer E-commerce: Category Readiness (DuckDB SQL)

Scores eight consumer product categories on how much AI discovery drives the sale, how much repeat or automatic reordering is possible, and how high return and trust risk is, then assigns each a play.

## Files
- `dim_category_scores.csv`: 0–2 scores per category, each with its basis (cited evidence or judgment).
- `fact_ai_commerce_signals.csv`: AI-referral traffic and conversion, assistant-driven sales, retail media revenue, return rates and social commerce share, each with a grade and URL.
- `model.sql`: category matrix and play assignment.

## Run
```
pip install duckdb
duckdb < model.sql
```

## Limits
- Most signals are U.S.-measured.
- Company-reported AI sales use each company's own attribution window.
- Reorder and most risk scores are judgment calls and are labelled as such.
