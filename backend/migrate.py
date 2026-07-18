import sqlite3

DATABASE_PATH = "data/sales_os.db"


def migrate():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    tables = ["customers", "tasks", "projects", "activities", "inbox_items", "ai_suggestions", "customer_ai_summary"]
    
    for table in tables:
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN user_id TEXT;")
            print(f"✓ Added user_id to {table}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"✓ user_id already exists in {table}")
            else:
                print(f"✗ Error adding user_id to {table}: {e}")

    conn.commit()
    conn.close()
    print("\nMigration completed!")


if __name__ == "__main__":
    migrate()
