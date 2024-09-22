class ReservationService{
    private url;
    constructor() {
        this.url = process.env.URL || 'http://localhost:3000/reservation';
    }

    async getReservations() {
        const response = await fetch(this.url);
        return await response.json();
    }

    async createReservation(reservation) {
        const response = await fetch(this.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reservation)
        });
        return await response.json();
    }
}
export const reservationService = new ReservationService();