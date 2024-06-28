const { Markup } = require('telegraf');
const { addAdminById, removeAdminById, loadAdmins } = require('./adminUtils');

const mainAdminId = 144824294; // Замените на ваш ID

function isAdmin(userId) {
  const admins = loadAdmins();
  return admins.some(admin => admin.id === userId);
}

async function adminPanel(ctx) {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('You do not have permission to perform this command.');
  }
  await ctx.reply('Admin Panel', Markup.inlineKeyboard([
    [Markup.button.callback('Add Admin', 'admin_add')],
    [Markup.button.callback('Remove Admin', 'admin_remove')],
    [Markup.button.callback('Delete Booking', 'admin_delete_booking')],
  ]));
}

async function handleAdminAdd(ctx) {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('You do not have permission to perform this command.');
  }
  await ctx.reply(`To add an admin, use the command /addadmin <User ID>. 
  You can find out the user ID using the bot https://t.me/username_to_id_bot. Example: /addadmin 123456789`);
}

async function handleAdminRemove(ctx) {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('You do not have permission to perform this command.');
  }

  const admins = loadAdmins().filter(admin => admin.id !== mainAdminId);
  const buttons = admins.map(admin => [Markup.button.callback(`Remove ${admin.name}`, `remove_admin_${admin.id}`)]);
  console.log('Displaying admin removal buttons:', buttons);
  await ctx.reply('Select an admin to remove:', Markup.inlineKeyboard(buttons));
}

async function handleAdminDeleteBooking(ctx) {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('You do not have permission to perform this command.');
  }
  await ctx.scene.enter("deleteBookingScene");
}

module.exports = {
  isAdmin,
  adminPanel,
  handleAdminAdd,
  handleAdminRemove,
  handleAdminDeleteBooking
};
