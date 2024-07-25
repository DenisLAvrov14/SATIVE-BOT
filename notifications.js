const { Telegraf } = require('telegraf');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const mainAdminId = process.env.MAIN_ADMIN_ID;

const notifyMainAdmin = async (booking) => {
    const message = `New booking:\n\nDate: ${booking.booking_date}\nTime: ${booking.time}\nUser: [${booking.username}](https://t.me/${booking.username})`;
    await bot.telegram.sendMessage(mainAdminId, message, { parse_mode: 'Markdown' });
};

module.exports = {
    notifyMainAdmin
};
