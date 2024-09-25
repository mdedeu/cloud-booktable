
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
        const res = await client.query("insert into reservations (table_id, name, email, date, time_slot, guests) values ($1, $2, $3, $4, $5, $6)", [event.table_id, event.name, event.email, event.date, event.time_slot, event.guests]);
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
