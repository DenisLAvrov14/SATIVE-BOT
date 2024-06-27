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

// Middleware for sessions and scenes
bot.use(session());
bot.use(stage.middleware());

function getDayOfWeek(dateString) {
  const date = new Date(dateString);
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return daysOfWeek[date.getUTCDay()];
}

// Handling the /start command
bot.start((ctx) => {
  ctx.scene.enter("selectDateScene");
});

// Admin panel
bot.command('admin', adminPanel);

// Handling button clicks in the admin panel
bot.action('admin_add', handleAdminAdd);
bot.action('admin_remove', handleAdminRemove);
bot.action('admin_delete_booking', handleAdminDeleteBooking);

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
  const result = addAdminById(Number(userId));
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
  let response = 'List of all bookings:\n\n';
  bookings.forEach((booking) => {
    const dayOfWeek = getDayOfWeek(booking.date);
    const userLink = booking.username ? `[${booking.username}](https://t.me/${booking.username})` : booking.user;
    response += `Date: ${booking.date} (${dayOfWeek})\nTime: ${booking.time}\nUser: ${userLink}\n\n`;
  });
  await ctx.replyWithMarkdown(response, { disable_web_page_preview: true });
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
