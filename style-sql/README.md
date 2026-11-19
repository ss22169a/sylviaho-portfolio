# Handbag Style Signals (DuckDB SQL)

Scores bag attributes (shapes, materials, styles) by Google search interest in Taiwan and worldwide, to decide which styles a mid-price handbag brand should scale, test or drop. Answers three questions: which attributes are rising in Taiwan, how far worldwide searches lead Taiwan, and when each attribute peaks in the year.

## Files
- `model.sql`: reshapes weekly exports to monthly, then builds the scorecard, take-off months, lead-lag correlations and seasonality.
- `raw/TW-1.csv`, `raw/TW-2.csv`, `raw/TW-3.csv`: Taiwan, weekly, Nov 2021 – Nov 2025. All three batches include 托特包 as a shared anchor, so values sit on one scale.
- `raw/GL-1.csv`: worldwide, weekly, same period, on its own scale.

## Method
- Level: average of the last six full months (May–Oct 2025).
- Momentum: level vs the same six months a year earlier; 1 is added to both sides so terms at the zero floor do not divide by zero.
- Take-off: first month a term holds at least twice its 2022 average for three straight months.
- Lead-lag: correlation of the worldwide series with the Taiwan series shifted 0–9 months.

## Run
```
pip install duckdb
python -c "import duckdb; duckdb.connect('bag.duckdb').execute(open('model.sql').read())"
```
Then query `tw_score`, `gl_score`, `onset`, `leadlag` and `season`.

## Limits
- Google Trends values are relative and sampled; small Taiwan terms move between 0 and 10 week to week, so only multi-month averages are used.
- Lead-lag rests on two attribute pairs (bag charm, bowling bag).
- Search interest is not sales; pair the scores with test sales before ordering stock.
