export interface Table {
    id: number;
    capacity: number;
    availability: TableAvailability[];
}
interface TableAvailability {
    date: string;
    times: {
        [key: string]: boolean;
    };
}

export type Reservation = {
    id: number
    name: string
    date: string
    time: string
    guests: number
    tableId: number
}