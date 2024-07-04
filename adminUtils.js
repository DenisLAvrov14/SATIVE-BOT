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

async function addAdminById(userId, ctx) {
  const admins = loadAdmins();
  if (!admins.some(admin => admin.id === userId)) {
    const userInfo = await ctx.telegram.getChat(userId);
    const adminInfo = { id: userId, name: userInfo.username || userInfo.first_name };
    admins.push(adminInfo);
    saveAdmins(admins);
    await ctx.telegram.sendMessage(userId, 'You have been granted admin privileges. Use the admin panel command to access admin features.');
    return `User @${adminInfo.name} has been added as an administrator.`;
  } else {
    return `User with ID ${userId} is already an administrator.`;
  }
}

function removeAdminById(userId) {
  const admins = loadAdmins();
  const index = admins.findIndex(admin => admin.id === userId);
  if (index > -1) {
    admins.splice(index, 1);
    saveAdmins(admins);
    return `User with ID ${userId} has been removed from administrators.`;
  } else {
    return `User with ID ${userId} is not an administrator.`;
  }
}

module.exports = {
  loadAdmins,
  saveAdmins,
  addAdminById,
  removeAdminById
};
