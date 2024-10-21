
class TableService {
    url;

    constructor() {
        this.url = process.env.NEXT_PUBLIC_BACKEND_URL ? process.env.NEXT_PUBLIC_BACKEND_URL +  '/table' : 'http://localhost:3000/table';
    }

    async getTables() {
        const response = await fetch(this.url);
        if (!response.ok) {
            throw new Error('Failed to fetch tables');
        }
        return await response;
    }

    async createTable(table) {
        const response = await fetch(this.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(table)
        });
        return await response.json();
    }

    async updateTable(id, table) {
        const response = await fetch(`${this.url}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(table)
        });
        return await response.json();
    }
}
export const tableService = new TableService();