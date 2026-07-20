import sqlite3

DATABASE_PATH = "data/sales_os.db"


def migrate():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    print("=== Sprint A6-4: 安全迁移第一阶段 ===\n")

    print("1. 新增 project_contacts 表...")
    try:
        cursor.execute("""
            CREATE TABLE project_contacts (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                project_id TEXT NOT NULL,
                contact_id TEXT NOT NULL,
                role TEXT,
                remark TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
            )
        """)
        cursor.execute("CREATE INDEX idx_project_contacts_project_id ON project_contacts(project_id)")
        cursor.execute("CREATE INDEX idx_project_contacts_contact_id ON project_contacts(contact_id)")
        print("   ✓ project_contacts 表创建成功")
    except sqlite3.OperationalError as e:
        if "already exists" in str(e):
            print("   ✓ project_contacts 表已存在")
        else:
            print(f"   ✗ 创建失败: {e}")

    conn.commit()
    conn.close()
    print("\n=== 迁移完成! ===")


if __name__ == "__main__":
    migrate()