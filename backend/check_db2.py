from sqlalchemy import create_engine, text

engine = create_engine('postgresql+psycopg2://postgres:Cadena23@localhost:5432/bizki_quality')
with engine.connect() as conn:
    res = conn.execute(text("SELECT pid, state, query FROM pg_stat_activity WHERE datname='bizki_quality'"))
    print(res.fetchall())
