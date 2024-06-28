const { bot } = require('./botInstance');
const { session } = require('telegraf');
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

function getDayOfWeek(dateString) {
  const date = new Date(dateString);
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return daysOfWeek[date.getUTCDay()];
}

// Middleware for sessions and scenes
bot.use(session());
bot.use(stage.middleware());

// Handling the /start command
bot.start((ctx) => {
  console.log('Handling /start command');
  ctx.scene.enter("selectDateScene");
});

// Admin panel
bot.command('admin', adminPanel);

// Handling button clicks in the admin panel
bot.action('admin_add', (ctx) => {
  console.log('Handling admin_add action');
  handleAdminAdd(ctx);
});

bot.action('admin_remove', (ctx) => {
  console.log('Handling admin_remove action');
  handleAdminRemove(ctx);
});

bot.action('admin_delete_booking', (ctx) => {
  console.log('Handling admin_delete_booking action');
  handleAdminDeleteBooking(ctx);
});

// Handling button clicks to remove an admin
bot.action(/remove_admin_(\d+)/, async (ctx) => {
  const userId = Number(ctx.match[1]);
  console.log(`Removing admin with ID: ${userId}`);
  const result = removeAdminById(userId);
  await ctx.reply(result);
});

// Command to add an admin by user ID
bot.command('addadmin', async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('You do not have permission to perform this command.');
  }
  const args = ctx.message.text.split(' ');
  if (args.length !== 2) {
    return ctx.reply('Usage: /addadmin <User ID>. For example: /addadmin 123456789');
  }
  const [_, userId] = args;
  console.log(`Adding admin with ID: ${userId}`);
  const result = await addAdminById(Number(userId), ctx); // Передаем ctx в функцию и добавляем await
  await ctx.reply(result);
});

// Command to remove an admin by user ID
bot.command('removeadmin', async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('You do not have permission to perform this command.');
  }
  const args = ctx.message.text.split(' ');
  if (args.length !== 2) {
    return ctx.reply('Usage: /removeadmin <User ID>. For example: /removeadmin 123456789');
  }
  const [_, userId] = args;
  console.log(`Removing admin with ID: ${userId}`);
  const result = removeAdminById(Number(userId));
  await ctx.reply(result);
});

// Command to delete a booking through a scene
bot.command('delete', async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('You do not have permission to perform this command.');
  }
  await ctx.scene.enter("deleteBookingScene");
});

// Command to request a list of all bookings
bot.command('list', async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
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
});

// Handling the callback for "book_again"
bot.action('book_again', (ctx) => {
  ctx.scene.enter("selectDateScene");
});

// Setting commands for the menu
bot.telegram.setMyCommands([
  { command: 'start', description: 'Start working with the bot' },
  { command: 'admin', description: 'Open the admin panel' },
  { command: 'addadmin', description: 'Add an admin (admins only)' },
  { command: 'removeadmin', description: 'Remove an admin (admins only)' },
  { command: 'delete', description: 'Delete a booking (admins only)' },
  { command: 'list', description: 'List all bookings (admins only)' }
]);

// Launching the bot
bot.launch();
console.log('The bot is running.');
