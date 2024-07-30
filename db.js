const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
});

pool.connect(err => {
  if (err) {
    console.error('Connection error', err.stack);
  } else {
    console.log('Connected to database');
  }
});

async function loadBookings() {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM bookings WHERE booking_date >= CURRENT_DATE');
      console.log('Bookings loaded:', result.rows);
      return result.rows;
    } catch (err) {
      console.error('Error loading bookings:', err);
    } finally {
      client.release();
    }
  }
  
  module.exports = { loadBookings };
