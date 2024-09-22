class TableService {
    private url;

    constructor() {
        this.url = process.env.URL || 'http://localhost:3000/table';
    }

    async getTables() {
        const response = await fetch(this.url);
        return await response.json();
    }

    async getTable(id) {
        const response = await fetch(`${this.url}/${id}`);
        return await response.json();
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