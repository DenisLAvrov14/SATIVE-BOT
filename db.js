const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function saveBooking(booking) {
  const { user_id, username, booking_date, status, time } = booking;
  const client = await pool.connect();
  console.log('Attempting to save booking:', booking); // Log the booking data
  try {
    await client.query('BEGIN');
    const queryText = 'INSERT INTO bookings(user_id, username, booking_date, status, time) VALUES($1, $2, $3, $4, $5)';
    await client.query(queryText, [user_id, username, booking_date, status, time]);
    await client.query('COMMIT');
    console.log('Booking saved successfully'); // Log success
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error saving booking:', e); // Log the error
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { saveBooking };
