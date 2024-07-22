require('dotenv').config();
const { Telegraf, Scenes } = require('telegraf');
const LocalSession = require('telegraf-session-local');
const express = require('express'); // Добавлено
const stage = require('./scenes');
const {
  isAdmin,
  adminPanel,
  handleAdminAdd,
  handleAdminRemove,
  handleAdminDeleteBooking
} = require('./admin');
const { addAdminById, removeAdminById } = require('./adminUtils');
const { loadBookings, deleteBooking } = require('./bookings');
const { bot, mainAdminId } = require('./botInstance');
const { addBooking, removeBooking } = require('./syncWithGoogleSheets');

console.log('Starting bot...');
console.log('Main Admin ID:', mainAdminId);

const localSession = new LocalSession({
  database: 'session_db.json'
});

bot.use(localSession.middleware());

bot.use((ctx, next) => {
  console.log(`Session Middleware - from ID: ${ctx.from ? ctx.from.id : 'N/A'}`);
  console.log('Session state:', ctx.session);
  return next();
});

bot.use(stage.middleware());

function getDayOfWeek(dateString) {
  const date = new Date(dateString);
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return daysOfWeek[date.getUTCDay()];
}

// Централизованная функция для обработки команд администратора
async function handleAdminCommand(ctx, adminAction) {
  try {
    await ctx.answerCbQuery();
    await ctx.scene.leave();
    if (ctx.session.isAdmin) {
      await adminAction(ctx);
    } else {
      await ctx.reply('You do not have permission to perform this command.');
    }
  } catch (error) {
    console.error('Error in admin command:', error);
  }
}

bot.start(async (ctx) => {
  console.log('Handling /start command');
  ctx.session.isAdmin = isAdmin(ctx.from.id);
  console.log(`User ${ctx.from.id} is admin: ${ctx.session.isAdmin}`);
  await ctx.scene.enter('selectDateScene');
});

bot.command('admin', async (ctx) => {
  console.log('Handling /admin command');
  if (ctx.session.isAdmin) {
    await ctx.scene.leave();
    await adminPanel(ctx);
  } else {
    await ctx.reply('You do not have permission to perform this command.');
  }
});

bot.action('manage_my_bookings', async (ctx) => {
  console.log('Handling manage_my_bookings action');
  await ctx.answerCbQuery();
  await ctx.scene.enter('manageBookingsScene');
});

bot.action('admin_add', async (ctx) => {
  console.log('Handling admin_add action');
  await handleAdminCommand(ctx, handleAdminAdd);
});

bot.action('admin_remove', async (ctx) => {
  console.log('Handling admin_remove action');
  await handleAdminCommand(ctx, handleAdminRemove);
});

bot.action('admin_delete_booking', async (ctx) => {
  console.log('Handling admin_delete_booking action');
  await handleAdminCommand(ctx, handleAdminDeleteBooking);
});

bot.action(/remove_admin_(\d+)/, async (ctx) => {
  console.log(`Handling remove_admin action`);
  const userId = Number(ctx.match[1]);
  await handleAdminCommand(ctx, async () => {
    const result = removeAdminById(userId);
    await ctx.reply(result);
  });
});

bot.command('addadmin', async (ctx) => {
  console.log(`Command /addadmin called by user ${ctx.from.id}`);
  await handleAdminCommand(ctx, async () => {
    const args = ctx.message.text.split(' ');
    if (args.length !== 2) {
      return ctx.reply('Usage: /addadmin <User ID>. For example: /addadmin 123456789');
    }
    const [_, userId] = args;
    const result = await addAdminById(Number(userId), ctx);
    await ctx.reply(result);
  });
});

bot.command('removeadmin', async (ctx) => {
  console.log(`Command /removeadmin called by user ${ctx.from.id}`);
  await handleAdminCommand(ctx, async () => {
    const args = ctx.message.text.split(' ');
    if (args.length !== 2) {
      return ctx.reply('Usage: /removeadmin <User ID>. For example: /removeadmin 123456789');
    }
    const [_, userId] = args;
    const result = removeAdminById(Number(userId));
    await ctx.reply(result);
  });
});

bot.command('delete', async (ctx) => {
  console.log(`Command /delete called by user ${ctx.from.id}`);
  await handleAdminCommand(ctx, async () => {
    await ctx.scene.enter('deleteBookingScene');
  });
});

bot.command('list', async (ctx) => {
  console.log(`Command /list called by user ${ctx.from.id}`);
  await handleAdminCommand(ctx, async () => {
    const bookings = loadBookings();
    if (bookings.length === 0) {
      return ctx.reply('No bookings.');
    }
    const sortedBookings = bookings.sort((a, b) => new Date(a.date) - new Date(b.date));
    let response = 'List of all bookings:\n\n';
    sortedBookings.forEach((booking) => {
      const dayOfWeek = getDayOfWeek(booking.date);
      const userLink = booking.username ? `[${booking.username}](https://t.me/${booking.username})` : booking.user;
      response += `Date: ${booking.date} (${dayOfWeek})\nTime: ${booking.time}\nUser: ${userLink}\n\n`;
    });
    await ctx.replyWithMarkdown(response, { disable_web_page_preview: true });
  });
});

bot.command('book', async (ctx) => {
  console.log('Handling /book command');
  try {
    await ctx.scene.leave();
    await ctx.scene.enter('selectDateScene');
  } catch (error) {
    console.error('Error in book command:', error);
  }
});

bot.action('book_again', async (ctx) => {
  console.log('Handling book_again action');
  try {
    await ctx.answerCbQuery();
    await ctx.scene.leave();
    await ctx.scene.enter('selectDateScene');
  } catch (error) {
    console.error('Error in book_again action:', error);
  }
});

bot.action('return_to_manage_bookings', async (ctx) => {
  console.log('Handling return_to_manage_bookings action');
  try {
    await ctx.answerCbQuery();
    await ctx.scene.leave();
    await ctx.scene.enter('manageBookingsScene');
  } catch (error) {
    console.error('Error in return_to_manage_bookings action:', error);
  }
});

bot.telegram.setMyCommands([
  { command: 'start', description: 'Start working with the bot' },
  { command: 'book', description: 'Book a session' },
  { command: 'list', description: 'List all bookings (admins only)' },
  { command: 'admin', description: 'Open the admin panel' }
]);

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbzZ7icfKMY8GuaHkV_C1HhuvEl_OLirm-8MGYYDGmC89yV6E_pRJ9nlClrAcLotrl8kuw/exec';

// Установите webhook
app.use(bot.webhookCallback('/secret-path'));
bot.telegram.setWebhook(WEBHOOK_URL);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

console.log('The bot is running.');
