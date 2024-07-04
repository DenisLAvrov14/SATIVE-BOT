const { Markup } = require('telegraf');
const { addAdminById, removeAdminById, loadAdmins } = require('./adminUtils');

const mainAdminId = Number(process.env.MAIN_ADMIN_ID);

function isAdmin(userId) {
  const admins = loadAdmins();
  console.log(`Loaded admins: ${JSON.stringify(admins)}`);
  console.log(`Checking if user ${userId} is admin or main admin ${mainAdminId}`);
  const isAdmin = userId === mainAdminId || admins.some(admin => admin.id === userId);
  console.log(`isAdmin result for user ${userId}: ${isAdmin}`);
  return isAdmin;
}

async function adminPanel(ctx) {
  console.log(`Admin panel requested by user ${ctx.from.id}`);
  if (!ctx.session.isAdmin) {
    return ctx.reply('You do not have permission to perform this command.');
  }
  console.log('User is admin, displaying admin panel');
  await ctx.reply('Admin Panel', Markup.inlineKeyboard([
    [Markup.button.callback('Add Admin', 'admin_add')],
    [Markup.button.callback('Remove Admin', 'admin_remove')],
    [Markup.button.callback('Delete Booking', 'admin_delete_booking')],
  ]));
}

async function handleAdminAdd(ctx) {
  console.log('Entering handleAdminAdd');
  try {
    console.log('Scene state before leave:', ctx.scene.state);
    await ctx.scene.leave();  // Exit the current scene
    console.log('Scene state after leave:', ctx.scene.state);
    console.log(`Callback data: ${ctx.callbackQuery.data}`);
    console.log(`User ID: ${ctx.from.id}`);
    if (!ctx.session.isAdmin) {
      console.log('User is not admin, cannot add admin');
      await ctx.answerCbQuery('You do not have permission to perform this command.');
      return ctx.reply('You do not have permission to perform this command.');
    }
    console.log('Left the scene, now replying with add admin instructions');
    await ctx.reply(`Чтобы добавить админа, используйте команду /addadmin <User ID>. 
    Вы можете узнать user ID с помощью бота https://t.me/username_to_id_bot. Пример: /addadmin 123456789`);
    await ctx.answerCbQuery('Action handled: admin_add');
    console.log('admin_add action completed');
  } catch (error) {
    console.error('Error in handleAdminAdd:', error);
  }
}

async function handleAdminRemove(ctx) {
  console.log('Entering handleAdminRemove');
  try {
    console.log('Scene state before leave:', ctx.scene.state);
    await ctx.scene.leave();  // Exit the current scene
    console.log('Scene state after leave:', ctx.scene.state);
    console.log(`Callback data: ${ctx.callbackQuery.data}`);
    console.log(`User ID: ${ctx.from.id}`);
    if (!ctx.session.isAdmin) {
      console.log('User is not admin, cannot remove admin');
      await ctx.answerCbQuery('You do not have permission to perform this command.');
      return ctx.reply('You do not have permission to perform this command.');
    }
    console.log('Left the scene, now displaying admin removal buttons');
  
    const admins = loadAdmins().filter(admin => admin.id !== mainAdminId);
    const buttons = admins.map(admin => [Markup.button.callback(`Remove ${admin.name}`, `remove_admin_${admin.id}`)]);
    console.log('Displaying admin removal buttons:', buttons);
    await ctx.reply('Select an admin to remove:', Markup.inlineKeyboard(buttons));
    await ctx.answerCbQuery('Action handled: admin_remove');
    console.log('admin_remove action completed');
  } catch (error) {
    console.error('Error in handleAdminRemove:', error);
  }
}

async function handleAdminDeleteBooking(ctx) {
  console.log('Entering handleAdminDeleteBooking');
  try {
    console.log('Scene state before leave:', ctx.scene.state);
    await ctx.scene.leave();  // Exit the current scene
    console.log('Scene state after leave:', ctx.scene.state);
    console.log(`Callback data: ${ctx.callbackQuery.data}`);
    console.log(`User ID: ${ctx.from.id}`);
    if (!ctx.session.isAdmin) {
      console.log('User is not admin, cannot delete booking');
      await ctx.answerCbQuery('You do not have permission to perform this command.');
      return ctx.reply('You do not have permission to perform this command.');
    }
    console.log('Left the scene, now entering deleteBookingScene');
    await ctx.scene.enter("deleteBookingScene");
    await ctx.answerCbQuery('Action handled: admin_delete_booking');
    console.log('admin_delete_booking action completed');
  } catch (error) {
    console.error('Error in handleAdminDeleteBooking:', error);
  }
}

module.exports = {
  isAdmin,
  adminPanel,
  handleAdminAdd,
  handleAdminRemove,
  handleAdminDeleteBooking
};
