const { query } = require('./db');
const { getDayOfWeek } = require('./utils');

async function loadBookings() {
    const result = await query('SELECT * FROM bookings');
    return result.rows;
}

async function saveBooking(booking) {
    const { date, time, username, user } = booking;
    await query('INSERT INTO bookings (date, time, username, user) VALUES ($1, $2, $3, $4)', [date, time, username, user]);
}

async function deleteBooking(date, time) {
    await query('DELETE FROM bookings WHERE date = $1 AND time = $2', [date, time]);
}

async function removeBooking(username) {
    await query('DELETE FROM bookings WHERE username = $1', [username]);
}

async function generateDateButtons() {
    const bookings = await loadBookings();
    const availableDates = [];
    const today = new Date();

    for (let i = 0; i < 14; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        const dateString = date.toISOString().split("T")[0];
        const dayOfWeek = getDayOfWeek(dateString);

        const bookedTimes = bookings.filter((b) => b.date === dateString).map((b) => b.time);

        const allTimes = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
                          "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", 
                          "22:00"];
        const availableTimes = allTimes.filter((time) => !bookedTimes.includes(time));

        if (availableTimes.length > 0) {
            availableDates.push([{ text: `${dateString} (${dayOfWeek})`, callback_data: `date_${dateString}` }]);
        }
    }
    return availableDates;
}

async function generateTimeButtons(date) {
    const bookings = await loadBookings();
    const bookedTimes = bookings.filter((b) => b.date === date).map((b) => b.time);

    const times = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
                   "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", 
                   "22:00"];

    const currentDate = new Date().toISOString().split("T")[0];
    const currentTime = new Date().getHours() + ':' + String(new Date().getMinutes()).padStart(2, '0');

    const availableTimes = times.filter(time => {
        if (date === currentDate && time <= currentTime) {
            return false;
        }
        return !bookedTimes.includes(time);
    });

    const buttons = availableTimes.map((time) => [{ text: time, callback_data: `time_${date}_${time}` }]);
    return buttons;
}

async function generateBookingButtons() {
    const bookings = await loadBookings();
    const today = new Date().toISOString().split("T")[0];
    const filteredBookings = bookings.filter(b => b.date >= today);
    const buttons = filteredBookings.map(b => {
        const dayOfWeek = getDayOfWeek(b.date);
        return [{ text: `${b.date} (${dayOfWeek}) ${b.time} (${b.username ? `@${b.username}` : b.user})`, callback_data: `delete_${b.date}_${b.time}` }];
    });
    return buttons;
}

module.exports = {
    loadBookings,
    saveBooking,
    deleteBooking,
    removeBooking,
    generateDateButtons,
    generateTimeButtons,
    generateBookingButtons
};
