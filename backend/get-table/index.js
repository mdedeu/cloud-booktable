exports.handler = async (event, context) => {
    const { Client } = require('pg');
    const client = new Client({
        host: process.env.RDS_HOST,
        port: process.env.RDS_PORT || '5432',
        database: process.env.RDS_DB_NAME,
        user: process.env.RDS_USER,
        password: process.env.RDS_PASSWORD,
        ssl: true
    });

    await client.connect();

    try {
        // Get all tables
        const tablesRes = await client.query(`
            SELECT tables.id AS table_id, capacity, reservations.date AS date, reservations.time_slot AS time_slot 
            FROM tables 
            LEFT JOIN reservations ON tables.id = reservations.table_id
        `);
        const tables = tablesRes.rows;
        const resultMap = {};

        // Define a mapping for time formats
        const timeFormatMap = {
            "12:00:00": "12:00 PM",
            "13:00:00": "1:00 PM",
            "14:00:00": "2:00 PM",
            "15:00:00": "3:00 PM",
            // Add more mappings as needed
        };

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

            // Normalize the time slot using the mapping
            if (time_slot) {
                const formattedTimeSlot = timeFormatMap[time_slot] || time_slot; // Use the mapped value or the original
                availabilityEntry.times[formattedTimeSlot] = false; // Set to false if reserved
            }
        });

        const results = Object.values(resultMap);

        return {
            statusCode: 200,
            body: JSON.stringify(results),
            headers: {
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
