require('dotenv').config();
const { Telegraf, Scenes } = require('telegraf');
const LocalSession = require('telegraf-session-local');
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

bot.start(async (ctx) => {
  console.log('Handling /start command');
  const isAdminUser = isAdmin(ctx.from.id);
  ctx.session.isAdmin = isAdminUser;
  console.log(`User ${ctx.from.id} is admin: ${isAdminUser}`);
  await ctx.scene.enter("selectDateScene");
});

bot.command('admin', async (ctx) => {
  console.log('Handling /admin command');
  if (ctx.session.isAdmin) {
    await ctx.scene.leave(); // Завершаем текущую сцену
    await adminPanel(ctx);
  } else {
    await ctx.reply('You do not have permission to perform this command.');
  }
});

bot.action('admin_add', async (ctx) => {
  console.log('Handling admin_add action');
  try {
    await ctx.scene.leave(); // Завершаем текущую сцену
    if (ctx.session.isAdmin) {
      await handleAdminAdd(ctx);
    } else {
      await ctx.reply('You do not have permission to perform this command.');
    }
    await ctx.answerCbQuery('admin_add action handled');
  } catch (error) {
    console.error('Error in admin_add action:', error);
  }
});

bot.action('admin_remove', async (ctx) => {
  console.log('Handling admin_remove action');
  try {
    await ctx.scene.leave(); // Завершаем текущую сцену
    if (ctx.session.isAdmin) {
      await handleAdminRemove(ctx);
    } else {
      await ctx.reply('You do not have permission to perform this command.');
    }
    await ctx.answerCbQuery('admin_remove action handled');
  } catch (error) {
    console.error('Error in admin_remove action:', error);
  }
});

bot.action('admin_delete_booking', async (ctx) => {
  console.log('Handling admin_delete_booking action');
  try {
    await ctx.scene.leave(); // Завершаем текущую сцену
    if (ctx.session.isAdmin) {
      await handleAdminDeleteBooking(ctx);
    } else {
      await ctx.reply('You do not have permission to perform this command.');
    }
    await ctx.answerCbQuery('admin_delete_booking action handled');
  } catch (error) {
    console.error('Error in admin_delete_booking action:', error);
  }
});

bot.action(/remove_admin_(\d+)/, async (ctx) => {
  console.log(`Handling remove_admin action`);
  const userId = Number(ctx.match[1]);
  try {
    await ctx.scene.leave(); // Завершаем текущую сцену
    if (ctx.session.isAdmin) {
      const result = removeAdminById(userId);
      await ctx.reply(result);
    } else {
      await ctx.reply('You do not have permission to perform this command.');
    }
    await ctx.answerCbQuery('remove_admin action handled');
  } catch (error) {
    console.error('Error in remove_admin action:', error);
  }
});

bot.command('addadmin', async (ctx) => {
  console.log(`Command /addadmin called by user ${ctx.from.id}`);
  try {
    await ctx.scene.leave(); // Завершаем текущую сцену
    if (!ctx.session.isAdmin) {
      return ctx.reply('You do not have permission to perform this command.');
    }
    const args = ctx.message.text.split(' ');
    if (args.length !== 2) {
      return ctx.reply('Usage: /addadmin <User ID>. For example: /addadmin 123456789');
    }
    const [_, userId] = args;
    const result = await addAdminById(Number(userId), ctx);
    await ctx.reply(result);
  } catch (error) {
    console.error('Error in addadmin command:', error);
  }
});

bot.command('removeadmin', async (ctx) => {
  console.log(`Command /removeadmin called by user ${ctx.from.id}`);
  try {
    await ctx.scene.leave(); // Завершаем текущую сцену
    if (!ctx.session.isAdmin) {
      return ctx.reply('You do not have permission to perform this command.');
    }
    const args = ctx.message.text.split(' ');
    if (args.length !== 2) {
      return ctx.reply('Usage: /removeadmin <User ID>. For example: /removeadmin 123456789');
    }
    const [_, userId] = args;
    const result = removeAdminById(Number(userId));
    await ctx.reply(result);
  } catch (error) {
    console.error('Error in removeadmin command:', error);
  }
});

bot.command('delete', async (ctx) => {
  console.log(`Command /delete called by user ${ctx.from.id}`);
  try {
    await ctx.scene.leave(); // Завершаем текущую сцену
    if (!ctx.session.isAdmin) {
      return ctx.reply('You do not have permission to perform this command.');
    }
    await ctx.scene.enter("deleteBookingScene");
  } catch (error) {
    console.error('Error in delete command:', error);
  }
});

bot.command('list', async (ctx) => {
  console.log(`Command /list called by user ${ctx.from.id}`);
  try {
    await ctx.scene.leave(); // Завершаем текущую сцену
    if (!ctx.session.isAdmin) {
      return ctx.reply('You do not have permission to perform this command.');
    }
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
  } catch (error) {
    console.error('Error in list command:', error);
  }
});

bot.command('book', async (ctx) => {
  console.log('Handling /book command');
  try {
    await ctx.scene.leave(); // Завершаем текущую сцену
    await ctx.scene.enter("selectDateScene");
  } catch (error) {
    console.error('Error in book command:', error);
  }
});

bot.action('book_again', async (ctx) => {
  console.log('Handling book_again action');
  try {
    await ctx.scene.leave(); // Завершаем текущую сцену
    await ctx.scene.enter("selectDateScene");
    await ctx.answerCbQuery();
  } catch (error) {
    console.error('Error in book_again action:', error);
  }
});

bot.telegram.setMyCommands([
  { command: 'start', description: 'Start working with the bot' },
  { command: 'book', description: 'Book a session' },
  { command: 'list', description: 'List all bookings (admins only)' },
  { command: 'admin', description: 'Open the admin panel' }
]);

bot.launch();
console.log('The bot is running.');
