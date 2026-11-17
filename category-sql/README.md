# Amazon Category Intelligence (DuckDB SQL)

This model checks a seller's Amazon catalog against market demand for alternators, starters and NOx sensors. Products are matched by LESTER or OE part number.

Write-up: https://ss22169a.github.io/sylviaho-portfolio/category-intelligence.html

**The data is not included.** It is a real seller's account and paid-tool exports, so only the model is published.

Inputs the queries expect in `data/`:
- `alt_parts.csv`: competitor clicks per part number and the seller's match for each
- `starter_intents.csv`: unmet-demand search intents
- `nox_parts.csv`: same-part price comparison
- `orders.csv`: order lines
