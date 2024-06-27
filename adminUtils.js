const fs = require('fs');
const path = require('path');
const adminsFilePath = path.join(__dirname, 'admins.json');

function loadAdmins() {
  if (fs.existsSync(adminsFilePath)) {
    const data = fs.readFileSync(adminsFilePath);
    return JSON.parse(data).admins;
  }
  return [];
}

function saveAdmins(admins) {
  fs.writeFileSync(adminsFilePath, JSON.stringify({ admins }, null, 2));
}

function addAdminById(userId) {
  const admins = loadAdmins();
  if (!admins.includes(userId)) {
    admins.push(userId);
    saveAdmins(admins);
    return `User with ID ${userId} has been added as an administrator.`;
  } else {
    return `User with ID ${userId} is already an administrator.`;
  }
}

function removeAdminById(userId) {
  let admins = loadAdmins();
  const index = admins.indexOf(userId);
  if (index > -1) {
    admins.splice(index, 1);
    saveAdmins(admins);
    return `User with ID ${userId} has been removed from administrators.`;
  } else {
    return `User with ID ${userId} is not an administrator.`;
  }
}

module.exports = {
  addAdminById,
  removeAdminById,
  loadAdmins
};
