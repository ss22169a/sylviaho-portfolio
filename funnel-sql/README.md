# E-commerce Funnel & Attribution Analysis (DuckDB SQL)

Google Ads traffic → Amazon product-page sessions → orders → net orders, for a U.S. automotive aftermarket seller on Amazon (Oct 7 – Nov 15, 2026).
Write-up: https://ss22169a.github.io/sylviaho-portfolio/funnel-analysis.html

**Data is not included.** The source is a real seller's account, so only the model is published. The page shows shares and indexes from these queries.

## Questions
1. Where does paid traffic leak between the ad click and a kept order?
2. How much revenue did the ads actually cause?
3. Does the budget follow proven demand?
4. Which changes move the account toward break-even?

## Model
| Layer | File | Contents |
|---|---|---|
| Staging | `sql/01_staging.sql` | Parameters (FX, windows, break-even), daily blend, ad group × day mapped to vehicle segment, order lines, cancellations, ASIN × day traffic |
| Funnel | `sql/02_funnel.sql` | Funnel by regime, ad-group economics, network/device mix, end-to-end funnel, cancellation and return leakage, ASIN traffic quality |
| Attribution | `sql/03_attribution.sql` | A1 pre/post incrementality · A2 YoY seasonality control · A3 budget–demand alignment · A4 segment coverage · A5 spend/click → session lag · A6 break-even |

Google Ads cannot see Amazon checkouts, so there is no click-level join. The model triangulates with four lenses instead of trusting one ratio.

## Run
```
pip install duckdb
python scripts/run.py   # expects data/*.csv with the columns read in 01_staging.sql
```

## Limits
- Order counts are in single digits per week, so the results set direction rather than prove effects. A tagged, two-week ads-off holdout is the proposed test.
- The pre-ad baseline is a single 28-day window, and the ad API returns only the last 30 days.
