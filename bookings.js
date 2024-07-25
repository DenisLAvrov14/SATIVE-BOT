const db = require('./db');

const loadBookings = async () => {
    const result = await db.query('SELECT * FROM bookings WHERE booking_date >= CURRENT_DATE');
    return result.rows;
};

const loadPastBookings = async () => {
    const result = await db.query('SELECT * FROM bookings WHERE booking_date < CURRENT_DATE');
    return result.rows;
};

const saveBooking = async (booking) => {
    const { user_id, username, booking_date, status, time } = booking;
    const query = `
        INSERT INTO bookings (user_id, username, booking_date, status, time)
        VALUES ($1, $2, $3, $4, $5)
    `;
    await db.query(query, [user_id, username, booking_date, status, time]);
};

const deleteBooking = async (booking_id) => {
    await db.query('DELETE FROM bookings WHERE id = $1', [booking_id]);
};

const generateDateButtons = async () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const formattedDate = date.toISOString().split('T')[0];
        dates.push([
            {
                text: formattedDate,
                callback_data: `date_${formattedDate}`
            }
        ]);
    }
    return dates;
};

const generateTimeButtons = async (selectedDate) => {
    const times = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
    const buttons = times.map(time => [{
        text: time,
        callback_data: `time_${selectedDate}_${time}`
    }]);
    return buttons;
};

const generateBookingButtons = async () => {
    const bookings = await loadBookings();
    return bookings.map(booking => [
        {
            text: `${booking.booking_date} ${booking.time} - ${booking.username || booking.user_id}`,
            callback_data: `delete_${booking.id}`
        }
    ]);
};

module.exports = {
    loadBookings,
    loadPastBookings,
    saveBooking,
    deleteBooking,
    generateDateButtons,
    generateTimeButtons,
    generateBookingButtons
};
