const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: true
});

client.connect(err => {
  if (err) {
    console.error('Connection error', err.stack);
  } else {
    console.log('Connected to database');
  }
});

async function loadBookings() {
  try {
    const result = await client.query('SELECT * FROM bookings WHERE booking_date >= CURRENT_DATE');
    console.log('Bookings loaded:', result.rows);
    return result.rows;
  } catch (err) {
    console.error('Error loading bookings:', err);
  }
}

module.exports = { loadBookings };
