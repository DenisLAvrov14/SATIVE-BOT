require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const mainAdminId = Number(process.env.MAIN_ADMIN_ID);

module.exports = {
  bot,
  mainAdminId
};
