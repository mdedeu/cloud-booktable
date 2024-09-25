
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
        const tablesRes = await client.query('SELECT id, capacity FROM tables');
        const tables = tablesRes.rows;

        // Prepare the result
        const results = await Promise.all(tables.map(async (table) => {
            const availability = [];

            const today = new Date();
            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

            // Create an array for the dates of the next month
            const datesToCheck = [];
            for (let day = 1; day <= 31; day++) {
                const date = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), day);
                if (date.getMonth() === nextMonth.getMonth()) {
                    datesToCheck.push(date.toISOString().split('T')[0]); // Format YYYY-MM-DD
                }
            }

            for (const date of datesToCheck) {
                const times = {
                    "12:00 PM": true,
                    "1:00 PM": true,
                    "2:00 PM": true,
                    "3:00 PM": true,
                };

                // Check reservations for this table on the specific date
                const reservationsRes = await client.query(
                    `SELECT time_slot FROM reservations WHERE table_id = $1 AND date = $2`,
                    [table.id, date]
                );

                // If there are reservations, set corresponding time slots to false
                reservationsRes.rows.forEach(row => {
                    const reservedTime = row.time_slot;
                    if (times.hasOwnProperty(reservedTime)) {
                        times[reservedTime] = false; // Mark as unavailable
                    }
                });

                availability.push({ date, times });
            }

            return {
                id: table.id,
                capacity: table.capacity,
                availability,
            };
        }));

        return {
            statusCode: 200,
            body: JSON.stringify(results),
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
