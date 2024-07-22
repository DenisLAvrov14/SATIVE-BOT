const axios = require('axios');
const { readJsonFile, writeJsonFile } = require('./utils');

const jsonFilePath = './bookings.json';

// Function to send data to Google Sheets
async function sendDataToGoogleSheets(data) {
  const webhookUrl = 'https://script.google.com/macros/s/AKfycbzZ7icfKMY8GuaHkV_C1HhuvEl_OLirm-8MGYYDGmC89yV6E_pRJ9nlClrAcLotrl8kuw/exec'; // Замените на ваш URL
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
