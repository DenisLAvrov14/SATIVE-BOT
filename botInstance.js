require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const mainAdminId = 144824294; // ID главного администратора

module.exports = {
  bot,
  mainAdminId
};
