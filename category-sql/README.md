# Amazon Category Intelligence (DuckDB SQL)

Checks a seller's Amazon catalog against market demand for alternators, starters and NOx sensors, matched by LESTER or OE part number. Answers three questions: which demand the catalog already covers, where listings exist but are hidden or mispriced, and which gaps are worth filling first.

## Inputs
Seller data is proprietary and not included. The queries expect these files in `data/`:
- `alt_parts.csv`: competitor clicks per part number and the seller's match for each
- `starter_intents.csv`: unmet-demand search intents
- `nox_parts.csv`: same-part price comparison
- `orders.csv`: order lines

## Run
```
pip install duckdb
duckdb < category.sql
```
