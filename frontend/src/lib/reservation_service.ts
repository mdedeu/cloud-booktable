class ReservationService{
    url;
    constructor() {
        this.url = process.env.NEXT_PUBLIC_BACKEND_URL ? process.env.NEXT_PUBLIC_BACKEND_URL +  '/reservation' : 'http://localhost:3000/reservation';
    }

    async getReservations() {
        const response = await fetch(this.url);
        if (!response.ok) {
            throw new Error('Failed to fetch reservations');
        }
        const jsonResponse = await response.json();
        console.log(jsonResponse);
        return JSON.parse(jsonResponse.body);
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