import sqlite3

con = sqlite3.connect('sheerwood-admission-portal/backend/sheerwood.db')
cur = con.cursor()
tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
counts = {}
for t in tables:
    if not t.startswith('sqlite'):
        counts[t] = cur.execute(f"SELECT count(*) FROM {t}").fetchone()[0]
print(counts)
con.close()

