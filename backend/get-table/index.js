const { Client } = require('pg');

exports.handler = async (event, context) => {
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
            SELECT id, capacity
            FROM tables
        `);
        const tables = tablesRes.rows;

        // Get reservations for the next two weeks
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const twoWeeksLater = new Date(today);
        twoWeeksLater.setDate(today.getDate() + 14);

        const reservationsRes = await client.query(`
            SELECT table_id, date, time_slot
            FROM reservations
            WHERE date >= $1 AND date < $2
        `, [today.toISOString(), twoWeeksLater.toISOString()]);
        const reservations = reservationsRes.rows;

        // Define a mapping for time formats
        const timeFormatMap = {
            "12:00:00": "12:00 PM",
            "13:00:00": "1:00 PM",
            "14:00:00": "2:00 PM",
            "15:00:00": "3:00 PM",
        };

        const timeSlots = Object.values(timeFormatMap);

        // Helper function to format date as YYYY-MM-DD
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Process the fetched data
        const results = tables.map(table => {
            const tableReservations = reservations.filter(res => res.table_id === table.id);
            const availability = [];

            for (let i = 0; i < 14; i++) {
                const currentDate = new Date(today);
                currentDate.setDate(today.getDate() + i);
                const formattedDate = formatDate(currentDate);
                const dateReservations = tableReservations.filter(res => formatDate(new Date(res.date)) === formattedDate);

                const times = {};
                timeSlots.forEach(slot => {
                    times[slot] = !dateReservations.some(res => timeFormatMap[res.time_slot] === slot);
                });

                availability.push({
                    date: formattedDate,
                    times: times
                });
            }

            return {
                id: table.id,
                capacity: table.capacity,
                availability: availability
            };
        });

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