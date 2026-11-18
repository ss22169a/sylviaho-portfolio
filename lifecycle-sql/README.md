# ICE Parts Lifecycle & SKU Harvesting Matrix (DuckDB SQL)

Sorts aftermarket alternator, starter and NOx sensor demand lines into invest, harvest, watch or exit, using vehicle survival data and Amazon demand.

Write-up: https://ss22169a.github.io/sylviaho-portfolio/lifecycle-matrix.html

**Seller data is not included.** It comes from a real seller's account and paid-tool exports, so only the model and the public survival table are published.

Files:
- `lifecycle.sql`: the model (stage, demand rank, decision rules, marts)
- `survival.csv`: NHTSA vehicle survival schedules, passenger cars and light trucks by age (DOT HS 809 952, Tables 3 and 4). Car values past age 25 are floored at 2%.

Input the queries expect: `lines.csv` with one row per part number or search intent: `cat, line, fitment, segment, my0, my1, demand, demand_unit, competitors, price_gap, position, trend`.
