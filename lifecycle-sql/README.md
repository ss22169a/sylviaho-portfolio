# ICE Parts Lifecycle & SKU Harvesting Matrix (DuckDB SQL)

Sorts aftermarket alternator, starter and NOx sensor demand lines into invest, harvest, watch or exit, using vehicle survival data and Amazon demand, with a price override for lines priced far above same-part rivals.

## Files
- `lifecycle.sql`: stage assignment, demand rank, decision rules and summary marts
- `survival.csv`: NHTSA vehicle survival schedules for passenger cars and light trucks by age (DOT HS 809 952, Tables 3 and 4). Car values past age 25 are floored at 2%.

## Inputs
Seller demand and catalog data are proprietary and not included. The model expects `lines.csv` with one row per part number or search intent: `cat, line, fitment, segment, my0, my1, demand, demand_unit, competitors, price_gap, position, trend`.

## Run
```
pip install duckdb
duckdb < lifecycle.sql
```

## Limits
- The NHTSA schedules date from 2006; vehicles now last longer, so stages are conservative.
- Heavy-duty trucks use the light-truck curve as a proxy.
