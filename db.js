const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  client.connect();
  
  client.query('SELECT table_schema,table_name FROM information_schema.tables;', (err, res) => {
    if (err) throw err;
    for (let row of res.rows) {
      console.log(JSON.stringify(row));
    }
    client.end();
  });

async function loadBookings() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM bookings WHERE booking_date >= CURRENT_DATE');
    return result.rows;
  } catch (err) {
    console.error('Error loading bookings:', err);
  } finally {
    client.release();
  }
}

module.exports = { loadBookings };
