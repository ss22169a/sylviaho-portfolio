# Chinese (zh-Hant) pages

The English pages in the repo root are the source. `zh/` is generated from them.

- `tr/*.txt` — one line per text segment: `[id] 中文`. `=` keeps the English text.
- `python3 tools/i18n/dump.py` — lists English segments that have no translation yet (`todo_*.txt`).
- `python3 tools/i18n/build.py` — adds the EN/中文 switch and hreflang links to the English pages and rebuilds every page in `zh/`. It refuses any translation whose HTML tags differ from the English segment.

After editing an English page: run `dump.py`, add the new lines to a file in `tr/`, run `build.py`.
