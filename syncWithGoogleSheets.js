const axios = require('axios');
const { readJsonFile, writeJsonFile } = require('./utils');

const jsonFilePath = './bookings.json';

// Function to send data to Google Sheets
async function sendDataToGoogleSheets(data) {
  const webhookUrl = 'https://script.google.com/macros/s/YOUR_WEBHOOK_URL/exec'; // Замените на ваш URL
  try {
    const response = await axios.post(webhookUrl, { bookings: data });
    console.log('Data sent successfully:', response.data);
  } catch (error) {
    console.error('Error sending data:', error);
  }
}

// Function to add a booking
function addBooking(booking) {
  const data = readJsonFile(jsonFilePath);
  data.bookings.push(booking);
  writeJsonFile(jsonFilePath, data);
  sendDataToGoogleSheets(data.bookings);
}

// Function to remove a booking
function removeBooking(username) {
  const data = readJsonFile(jsonFilePath);
  data.bookings = data.bookings.filter(booking => booking.username !== username);
  writeJsonFile(jsonFilePath, data);
  sendDataToGoogleSheets(data.bookings);
}

module.exports = {
  addBooking,
  removeBooking
};
