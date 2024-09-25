
exports.handler = async (event, context) => {
    const { Client } = require('pg');
    const client = new Client({
        host: process.env.RDS_HOST,
        port: process.env.RDS_PORT || '5432',
        database: process.env.RDS_DB_NAME,
        user: process.env.RDS_USER,
        password: process.env.RDS_PASSWORD,
        ssl:true
    });

    try {
        await client.connect();
        let body = {};
        if (event.body) {
            body = JSON.parse(event.body);
        }
        const res = await client.query("insert into reservations (table_id, name, email, date, time_slot, guests) values ($1, $2, $3, $4, $5, $6)", [body.table_id, body.name, body.email, body.date, body.time_slot, body.guests]);
        await client.end();
        return {
            statusCode: 200
        };
    } catch (error) {
        console.error('Connection error details:', error);
        return {
            statusCode: 500,
            body: `Error connecting to the database: ${error.message}`,
        };
    }
    finally {
        await client.end();
    }
};
