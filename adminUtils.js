const fs = require('fs');
const path = require('path');

const adminsFilePath = path.join(__dirname, 'admins.json');

function loadAdmins() {
  if (!fs.existsSync(adminsFilePath)) {
    return [];
  }
  const data = fs.readFileSync(adminsFilePath, 'utf8');
  return JSON.parse(data).admins;
}

function saveAdmins(admins) {
  fs.writeFileSync(adminsFilePath, JSON.stringify({ admins }, null, 2), 'utf8');
}

async function addAdminById(userId, ctx) {
  const admins = loadAdmins();
  if (admins.some(admin => admin.id === userId)) {
    return `User with ID ${userId} is already an administrator.`;
  }
  
  const userInfo = await ctx.telegram.getChat(userId);
  const adminInfo = { id: userId, name: userInfo.username || userInfo.first_name };
  admins.push(adminInfo);
  saveAdmins(admins);
  await ctx.telegram.sendMessage(userId, 'You have been granted admin privileges. Use the admin panel command to access admin features.');
  return `User @${adminInfo.name} has been added as an administrator.`;
}

function removeAdminById(userId) {
  const admins = loadAdmins();
  const index = admins.findIndex(admin => admin.id === userId);
  if (index === -1) {
    return `User with ID ${userId} is not an administrator.`;
  }
  
  admins.splice(index, 1);
  saveAdmins(admins);
  return `User with ID ${userId} has been removed from administrators.`;
}

module.exports = {
  loadAdmins,
  saveAdmins,
  addAdminById,
  removeAdminById
};
