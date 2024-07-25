const { Markup } = require('telegraf');
const { addAdminById, removeAdminById, loadAdmins } = require('./adminUtils');
const { loadBookings, loadPastBookings } = require('./bookings');

const mainAdminId = Number(process.env.MAIN_ADMIN_ID);

function isAdmin(userId) {
  const admins = loadAdmins();
  return userId === mainAdminId || admins.some(admin => admin.id === userId);
}

async function adminPanel(ctx) {
  if (!ctx.session.isAdmin) {
    return ctx.reply('You do not have permission to perform this command.');
  }
  await ctx.reply('Admin Panel', Markup.inlineKeyboard([
    [Markup.button.callback('Add Admin', 'admin_add')],
    [Markup.button.callback('Remove Admin', 'admin_remove')],
    [Markup.button.callback('Delete Booking', 'admin_delete_booking')],
    [Markup.button.callback('View Current Bookings', 'view_current_bookings')],
    [Markup.button.callback('View Past Bookings', 'view_past_bookings')]
  ]));
}

async function handleAdminAdd(ctx) {
  try {
    await ctx.scene.leave();
    if (!ctx.session.isAdmin) {
      await ctx.answerCbQuery('You do not have permission to perform this command.');
      return ctx.reply('You do not have permission to perform this command.');
    }
    await ctx.reply(`Чтобы добавить админа, используйте команду /addadmin <User ID>. 
    Вы можете узнать user ID с помощью бота https://t.me/username_to_id_bot. Пример: /addadmin 123456789`);
    await ctx.answerCbQuery('Action handled: admin_add');
  } catch (error) {
    console.error('Error in handleAdminAdd:', error);
  }
}

async function handleAdminRemove(ctx) {
  try {
    await ctx.scene.leave();
    if (!ctx.session.isAdmin) {
      await ctx.answerCbQuery('You do not have permission to perform this command.');
      return ctx.reply('You do not have permission to perform this command.');
    }
    const admins = loadAdmins().filter(admin => admin.id !== mainAdminId);
    const buttons = admins.map(admin => [Markup.button.callback(`Remove ${admin.name}`, `remove_admin_${admin.id}`)]);
    await ctx.reply('Select an admin to remove:', Markup.inlineKeyboard(buttons));
    await ctx.answerCbQuery('Action handled: admin_remove');
  } catch (error) {
    console.error('Error in handleAdminRemove:', error);
  }
}

async function handleAdminDeleteBooking(ctx) {
  try {
    await ctx.scene.leave();
    if (!ctx.session.isAdmin) {
      await ctx.answerCbQuery('You do not have permission to perform this command.');
      return ctx.reply('You do not have permission to perform this command.');
    }
    await ctx.scene.enter("deleteBookingScene");
    await ctx.answerCbQuery('Action handled: admin_delete_booking');
  } catch (error) {
    console.error('Error in handleAdminDeleteBooking:', error);
  }
}

async function handleViewCurrentBookings(ctx) {
  const bookings = await loadBookings(ctx.from.id);
  let message = 'Current Bookings:\n\n';

  for (const booking of bookings) {
      const date = new Date(booking.booking_date);
      const usernameLink = `@${booking.username}`;
      message += `Date: ${date.toDateString().slice(0, 10)} ${date.getFullYear()}\nTime: ${booking.time}\nMember: [${usernameLink}]\n\n`;
  }

  await ctx.replyWithMarkdown(message.trim());
}

async function handleViewPastBookings(ctx) {
  const bookings = await loadPastBookings(ctx.from.id);
  let message = 'Past Bookings:\n\n';

  for (const booking of bookings) {
      const date = new Date(booking.booking_date);
      const usernameLink = `@${booking.username}`;
      message += `Date: ${date.toDateString().slice(0, 10)} ${date.getFullYear()}\nTime: ${booking.time}\nMember:[ ${usernameLink}]\n\n`;
  }

  await ctx.replyWithMarkdown(message.trim());
}

module.exports = {
  isAdmin,
  adminPanel,
  handleAdminAdd,
  handleAdminRemove,
  handleAdminDeleteBooking,
  handleViewCurrentBookings,
  handleViewPastBookings
};
