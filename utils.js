const fs = require('fs');
require('dotenv').config();

const logError = (error) => {
  const errorMessage = `${new Date().toISOString()} - ${error.message}\n`;
  fs.appendFileSync('error.log', errorMessage);
  console.error(error);
};

const validateInput = (input, schema) => {
  const { error } = schema.validate(input);
  if (error) {
    throw new Error(`Invalid input: ${error.details[0].message}`);
  }
};

const getDayOfWeek = (dateString) => {
  const date = new Date(dateString);
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return daysOfWeek[date.getUTCDay()];
};

const readJsonFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return { bookings: [] };
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const writeJsonFile = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

module.exports = {
  logError,
  validateInput,
  getDayOfWeek,
  readJsonFile,
  writeJsonFile
};
