const fs = require('fs');
const bookingsFilePath = "./bookings.json";

function loadBookings() {
  if (fs.existsSync(bookingsFilePath)) {
    const data = fs.readFileSync(bookingsFilePath);
    return JSON.parse(data).bookings;
  }
  return [];
}

function saveBookings(bookings) {
  fs.writeFileSync(bookingsFilePath, JSON.stringify({ bookings }, null, 2));
}

function deleteBooking(date, time) {
  let bookings = loadBookings();
  bookings = bookings.filter(b => !(b.date === date && b.time === time));
  saveBookings(bookings);
}

function getDayOfWeek(dateString) {
  const date = new Date(dateString);
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return daysOfWeek[date.getUTCDay()];
}

function generateDateButtons() {
  const bookings = loadBookings();
  const availableDates = [];
  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    const dateString = date.toISOString().split("T")[0];
    const dayOfWeek = getDayOfWeek(dateString);

    const bookedTimes = bookings
      .filter((b) => b.date === dateString)
      .map((b) => b.time);
    
    const allTimes = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
                      "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", 
                      "22:00"];
    const availableTimes = allTimes.filter(
      (time) => !bookedTimes.includes(time)
    );

    if (availableTimes.length > 0) {
      availableDates.push([
        { text: `${dateString} (${dayOfWeek})`, callback_data: `date_${dateString}` },
      ]);
    }
  }
  return availableDates;
}

function generateTimeButtons(date) {
  const bookings = loadBookings();
  const bookedTimes = bookings
    .filter((b) => b.date === date)
    .map((b) => b.time);

  const times = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
                 "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", 
                 "22:00"];
  
  const currentDate = new Date().toISOString().split("T")[0];
  const currentTime = new Date().getHours() + ':' + String(new Date().getMinutes()).padStart(2, '0');

  const availableTimes = times.filter(time => {
    // Exclude booked times and past times for the current date
    if (date === currentDate && time <= currentTime) {
      return false;
    }
    return !bookedTimes.includes(time);
  });

  const buttons = availableTimes.map((time) => [{ text: time, callback_data: `time_${date}_${time}` }]);
  return buttons;
}

function generateBookingButtons() {
  const bookings = loadBookings();
  const today = new Date().toISOString().split("T")[0];
  const filteredBookings = bookings.filter(b => b.date >= today);
  const buttons = filteredBookings.map(b => {
    const dayOfWeek = getDayOfWeek(b.date);
    return [
      { text: `${b.date} (${dayOfWeek}) ${b.time} (${b.username ? `@${b.username}` : b.user})`, callback_data: `delete_${b.date}_${b.time}` }
    ];
  });
  return buttons;
}

module.exports = {
  loadBookings,
  saveBookings,
  deleteBooking,
  generateDateButtons,
  generateTimeButtons,
  generateBookingButtons
};
