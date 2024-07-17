const { bot, mainAdminId } = require('./botInstance');
const { getDayOfWeek } = require('./utils');

async function notifyMainAdmin(booking) {
  const dayOfWeek = getDayOfWeek(booking.date);
  const userLink = booking.username ? `[${booking.username}](https://t.me/${booking.username})` : booking.user;
  const message = `New booking:\n\nDate: ${booking.date} (${dayOfWeek})\nTime: ${booking.time}\nUser: ${userLink}`;
  await bot.telegram.sendMessage(mainAdminId, message, { parse_mode: 'Markdown', disable_web_page_preview: true });
}

module.exports = {
  notifyMainAdmin
};
