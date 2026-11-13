with closing(connect()) as connection, connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                message_json TEXT NOT NULL
            )
        """)
        connection.execute("CREATE INDEX IF NOT EXISTS messages_session ON messages(session_id, id)")
        connection.execute("""
            CREATE TABLE IF NOT EXISTS complaints (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_name TEXT NOT NULL,
                order_id TEXT NOT NULL,
                phone TEXT NOT NULL,
                complaint TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Pending',
                # UNIQUE(customer_name, order_id, phone, complaint)
            )
        """)
