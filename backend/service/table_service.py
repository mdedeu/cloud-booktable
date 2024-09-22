from persistance.reservation_repository import ReservationRepository
from persistance.table_repository import TableRepository


class TableService:
    def __init__(self):
        self.table_repository = TableRepository()
        self.reservations_repository = ReservationRepository()

    def create_table(self, capacity):
        return self.table_repository.create_table(capacity)

    def change_table_status(self, table_id, status):
        return self.table_repository.change_table_status(table_id, status)

    def make_reservation(self, table_id, reservation):
        reservation = self.table_repository.make_reservation(table_id, reservation)
        print(reservation)
        self.change_table_status(table_id, "reserved")

    def get_tables_availability(self):
        return self.table_repository.get_tables_availability()

    def get_reservations(self):
        return self.reservations_repository.get_reservations()



