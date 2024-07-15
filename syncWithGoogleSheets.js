const fs = require('fs');
const axios = require('axios');

// Path to your JSON file
const jsonFilePath = './bookings.json';

// Function to read JSON file
function readJsonFile() {
  return JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
}

// Function to write to JSON file
function writeJsonFile(data) {
  fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2), 'utf8');
}

// Function to send data to Google Sheets
function sendDataToGoogleSheets(data) {
  const webhookUrl = 'https://script.google.com/macros/s/AKfycbwclEVXoZUJrxJk8Sz-WUEEIJT2QVAA-OgydLv4XSfJVLY-ZKE1ihDV0Z8U0TXQyX8J7g/exec'; // Замените на ваш URL
  axios.post(webhookUrl, { bookings: data })
    .then(response => {
      console.log('Data sent successfully:', response.data);
    })
    .catch(error => {
      console.error('Error sending data:', error);
    });
}

// Function to add a booking
function addBooking(booking) {
  const data = readJsonFile();
  data.bookings.push(booking);
  writeJsonFile(data);
  sendDataToGoogleSheets(data.bookings);
}

// Function to remove a booking
function removeBooking(username) {
  let data = readJsonFile();
  data.bookings = data.bookings.filter(booking => booking.username !== username);
  writeJsonFile(data);
  sendDataToGoogleSheets(data.bookings);
}

module.exports = {
  addBooking,
  removeBooking
};
