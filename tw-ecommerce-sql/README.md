# Taiwan E-commerce Plateau Test (DuckDB SQL)

Tests whether Taiwan's online retail has reached a plateau (2019–2025) and collects the market signals used to rank sales channels for brand sellers.

## Files
- `fact_retail_online.csv`: retail online sales, year-on-year growth and share of total retail (MOEA), with source URLs.
- `fact_market_signals.csv`: platform results, Coupang segment growth, cross-border parcels and digital ad market figures, each with a grade and URL.
- `model.sql`: plateau rule — average growth in 2023–2025 under 5% and share movement under 1.5 points across 2021–2025.

## Run
```
pip install duckdb
duckdb < model.sql
```

## Limits
- MOEA online sales cover registered retailers; cross-border purchases are counted separately in customs data.
- Coupang discloses Taiwan growth but not Taiwan revenue; Shopee does not disclose Taiwan revenue.
