import psycopg2

conn = psycopg2.connect("postgresql://postgres:yassine@localhost:5432/nexusai")
cursor = conn.cursor()

cursor.execute("""
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
""")

print(cursor.fetchall())