
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
        const res = await client.query("CREATE TABLE tables (id SERIAL PRIMARY KEY, capacity INT NOT NULL");
        await client.end();
        return {
            statusCode: 200,
            body: 'Table created successfully',
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
