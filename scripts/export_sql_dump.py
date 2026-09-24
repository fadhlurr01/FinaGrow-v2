import os
import sqlite3

root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
db_path = os.path.join(root, 'backend', 'database', 'database.sqlite')
out_dir = os.path.join(root, 'cpanel-packages')
out_path = os.path.join(out_dir, 'finagrow-db.sql')

os.makedirs(out_dir, exist_ok=True)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

tables = [
    row[0]
    for row in cur.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
]

with open(out_path, 'w', encoding='utf-8') as f:
    for table in tables:
        schema_row = cur.execute(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name=?",
            (table,),
        ).fetchone()
        if schema_row and schema_row[0]:
            f.write(f"-- Table: {table}\n")
            f.write(f"DROP TABLE IF EXISTS `{table}`;\n")
            f.write(schema_row[0] + ";\n")

        cols = [
            col[1] for col in cur.execute(f"PRAGMA table_info(`{table}`)")
        ]
        rows = cur.execute(f"SELECT * FROM `{table}`").fetchall()

        for row in rows:
            values = []
            for value in row:
                if value is None:
                    values.append('NULL')
                else:
                    values.append("'" + str(value).replace("'", "''") + "'")
            f.write(f"INSERT INTO `{table}` (`{'`,`'.join(cols)}`) VALUES ({','.join(values)});\n")

        f.write("\n")

conn.close()
print(f"Dump database created: {out_path}")
