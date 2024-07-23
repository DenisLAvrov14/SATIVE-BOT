const axios = require('axios');
const { loadBookings, saveBooking, deleteBooking, removeBooking } = require('./bookings');

async function sendDataToGoogleSheets(data) {
    const webhookUrl = 'https://script.google.com/macros/s/AKfycbzZ7icfKMY8GuaHkV_C1HhuvEl_OLirm-8MGYYDGmC89yV6E_pRJ9nlClrAcLotrl8kuw/exec';
    try {
        const response = await axios.post(webhookUrl, { bookings: data });
        console.log('Data sent successfully:', response.data);
    } catch (error) {
        console.error('Error sending data:', error);
    }
}

async function addBooking(booking) {
    await saveBooking(booking);
    const data = await loadBookings();
    sendDataToGoogleSheets(data);
}

async function removeBookingByUsername(username) {
    await removeBooking(username);
    const data = await loadBookings();
    sendDataToGoogleSheets(data);
}

module.exports = {
    addBooking,
    removeBookingByUsername
};
