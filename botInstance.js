require('dotenv').config();
const { Telegraf } = require('telegraf');

const botToken = process.env.BOT_TOKEN;
const mainAdminId = Number(process.env.MAIN_ADMIN_ID);

if (!botToken || !mainAdminId) {
  throw new Error("BOT_TOKEN or MAIN_ADMIN_ID is not defined in the environment variables.");
}

const bot = new Telegraf(botToken);

module.exports = {
  bot,
  mainAdminId
};
