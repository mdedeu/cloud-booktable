
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

    await client.connect();

    try {
        // Get all tables
        const tablesRes = await client.query('SELECT * FROM tables LEFT JOIN reservations on reservations.table_id = tables.id');
        const tables = tablesRes.rows;
        const resultMap = {};

        // Process the fetched data
        tables.forEach(row => {
            const { table_id, capacity, date, time_slot } = row;

            // Initialize the table entry if it doesn't exist
            if (!resultMap[table_id]) {
                resultMap[table_id] = {
                    id: table_id,
                    capacity,
                    availability: [],
                };
            }
            let availabilityEntry = resultMap[table_id].availability.find(avail => avail.date === date);
            if (!availabilityEntry) {
                availabilityEntry = {
                    date,
                    times: {
                        "12:00 PM": true,
                        "1:00 PM": true,
                        "2:00 PM": true,
                        "3:00 PM": true,
                    },
                };
                resultMap[table_id].availability.push(availabilityEntry);
            }

            // Mark the time slot as unavailable if there's a reservation
            if (time_slot) {
                availabilityEntry.times[time_slot] = false; // Set to false if reserved
            }
        });
        const results = Object.values(resultMap);

        return {
            statusCode: 200,
            body: JSON.stringify(results),
            headers:{
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET'
            }
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    } finally {
        await client.end();
    }
};
