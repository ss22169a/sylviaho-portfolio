# AI Data Centers → Fuel Cells → Hydrogen (DuckDB SQL)

Scenario model of how much fuel-cell capacity, hydrogen demand and electrolyzer capacity AI data centers could pull by 2030, under low, base and high assumptions.

## Files
- `fact_macro_assumptions.csv`: data-center electricity, grid-connection wait, electrolyzer capacity and cost, FID share. Each row has a source ID, URL and evidence grade.
- `fact_vendor_orders.csv`: fuel-cell vendor revenue, guidance and factory capacity, used to calibrate the 2026–2030 path.
- `model.sql`: scenario levers, yearly forecast (`mart_demand_forecast_matrix`), 2030 summary and calibration check.

## Run
```
pip install duckdb
duckdb < model.sql
```

## Limits
- The fuel-cell share of new load and the hydrogen share of fuel cells are scenario assumptions, not forecasts.
- Contract sizes in vendor disclosures are "up to" amounts.
