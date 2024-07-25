const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
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
