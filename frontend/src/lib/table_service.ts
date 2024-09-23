import {json} from "node:stream/consumers";

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
        const jsonResponse = await response.json();
        return JSON.parse(jsonResponse.body);
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