import sqlite3
import psycopg2

sqlite_db = r'\\Server-alvarezp\c\IA_AlvarezPlacas\data\alvarez_placas.db'
pg_conn_str = 'postgresql://alvarez_admin:AlvarezAdmin2026@100.127.6.20:5432/alvarezplacas'

def run():
    print("Connecting to SQLite...")
    sl_conn = sqlite3.connect(sqlite_db)
    sl_conn.row_factory = sqlite3.Row
    sl_cur = sl_conn.cursor()
    sl_cur.execute("SELECT * FROM empleados")
    empleados = sl_cur.fetchall()
    
    print(f"Found {len(empleados)} employees in SQLite.")
    
    print("Connecting to PostgreSQL...")
    pg_conn = psycopg2.connect(pg_conn_str)
    pg_cur = pg_conn.cursor()
    
    print("Clearing control_personal...")
    pg_cur.execute("DELETE FROM control_personal")
    
    print("Inserting into PostgreSQL...")
    for emp in empleados:
        nombre_completo = f"{emp['apellido']}, {emp['nombre']}"
        funcion = emp['puesto'] if emp['puesto'] else 'Operario'
        
        sueldo = 0
        try:
            sueldo = float(emp['sueldo_neto'] or 0)
        except:
            pass
            
        email = emp['email'] if 'email' in emp.keys() and emp['email'] else ''
        telefono = emp['telefono'] if 'telefono' in emp.keys() and emp['telefono'] else ''
        
        pg_cur.execute(
            """
            INSERT INTO control_personal (nombre, funcion, sueldo_base, email, whatsapp, status) 
            VALUES (%s, %s, %s, %s, %s, 'active')
            """,
            (nombre_completo, funcion, sueldo, email, telefono)
        )
    
    pg_conn.commit()
    print("Migration complete!")

if __name__ == "__main__":
    run()
