class TableRepository:

    def create_table(self, table):
        self.db.tables[table.id] = table

    def change_table_status(self, table_id, status):
        self.db.tables[table_id].status = status

    def get_tables_availability(self):
        return self.db.tables
