const fs = require('fs');
const path = require('path');
const { bot } = require('./botInstance'); // Импортируем объект bot для отправки сообщений

const adminsFilePath = path.join(__dirname, 'admins.json');

function loadAdmins() {
  if (fs.existsSync(adminsFilePath)) {
    const data = fs.readFileSync(adminsFilePath);
    return JSON.parse(data).admins;
  }
  return [];
}

function saveAdmins(admins) {
  try {
    fs.writeFileSync(adminsFilePath, JSON.stringify({ admins }, null, 2));
    console.log('Admins saved successfully.');
  } catch (error) {
    console.error('Error saving admins:', error);
  }
}

async function addAdminById(userId, ctx) {
  const admins = loadAdmins();
  if (!admins.some(admin => admin.id === userId)) {
    try {
      const user = await bot.telegram.getChat(userId);
      const userName = user.username ? `@${user.username}` : user.first_name;
      admins.push({ id: userId, name: userName });
      saveAdmins(admins);
      ctx.reply(`User ${userName} has been added as an administrator.`);

      // Отправляем уведомление новому администратору
      bot.telegram.sendMessage(userId, 'You have been appointed as an administrator. Use the admin panel command to access administrative functions.');

      return `User ${userName} has been added as an administrator.`;
    } catch (error) {
      console.error('Error adding admin:', error);
      ctx.reply('Failed to add admin. Please make sure the user ID is correct.');
    }
  } else {
    return `User with ID ${userId} is already an administrator.`;
  }
}

function removeAdminById(userId) {
  let admins = loadAdmins();
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
  addAdminById,
  removeAdminById,
  loadAdmins
};
