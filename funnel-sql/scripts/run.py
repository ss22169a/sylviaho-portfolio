import duckdb, json, sys
c = duckdb.connect('funnel.duckdb')
for f in ['sql/01_staging.sql','sql/02_funnel.sql','sql/03_attribution.sql']:
    c.execute(open(f).read())
marts = [r[0] for r in c.execute("select table_name from information_schema.tables where table_name like 'mart_%' order by 1").fetchall()]
out = {}
for m in marts:
    df = c.execute(f"select * from {m}").fetchdf()
    print(f"\n== {m}"); print(df.to_string(index=False))
    out[m] = json.loads(df.to_json(orient='records', date_format='iso'))
json.dump(out, open('results.json','w'), ensure_ascii=False, indent=1)
