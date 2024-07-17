const { Scenes, Markup } = require('telegraf');
const {
  generateDateButtons,
  generateTimeButtons,
  deleteBooking,
  loadBookings,
  saveBookings,
  generateBookingButtons
} = require('./bookings');
const { notifyMainAdmin } = require('./notifications');
const { getDayOfWeek } = require('./utils');

// Time selection scene
const selectTimeScene = new Scenes.BaseScene('selectTimeScene');
selectTimeScene.enter(async (ctx) => {
  const selectedDate = ctx.session.selectedDate;
  await ctx.reply(`You have selected the date: ${selectedDate}. Now choose a time:`, {
    reply_markup: {
      inline_keyboard: generateTimeButtons(selectedDate),
    },
  });
});
selectTimeScene.on('callback_query', async (ctx) => {
  const response = ctx.callbackQuery.data;
  if (response.startsWith('time_')) {
    const [_, selectedDate, selectedTime] = response.split('_');
    ctx.session.selectedTime = selectedTime;

    const fullName = ctx.from.first_name;
    const username = ctx.from.username ? `@${ctx.from.username}` : fullName;
    const newBooking = {
      date: selectedDate,
      time: selectedTime,
      user: fullName,
      username: ctx.from.username,
    };

    const bookings = loadBookings();
    const existingBooking = bookings.find(booking => booking.date === selectedDate && booking.time === selectedTime);
    if (existingBooking) {
      await ctx.reply(`Sorry, the slot on ${selectedDate} at ${selectedTime} is already booked by ${existingBooking.user}. Please select another time.`);
      await ctx.answerCbQuery();
      return;
    }

    bookings.push(newBooking);
    saveBookings(bookings);

    const dayOfWeek = getDayOfWeek(selectedDate);

    await ctx.reply(`Booking for ${selectedDate} (${dayOfWeek}) at ${selectedTime} created, ${username}.`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Book Again', callback_data: 'book_again' }],
        ],
      },
    });

    await notifyMainAdmin(newBooking);
    await ctx.answerCbQuery();
    await ctx.scene.leave();
  }
});

// Date selection scene
const selectDateScene = new Scenes.BaseScene('selectDateScene');
selectDateScene.enter(async (ctx) => {
  await ctx.reply('Welcome! Please select an option:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Booking Rules', callback_data: 'show_booking_rules' }],
        [{ text: 'Select Date', callback_data: 'select_date' }],
        [{ text: 'Manage My Bookings', callback_data: 'manage_my_bookings' }],
      ],
    },
  });
});
selectDateScene.on('callback_query', async (ctx) => {
  const response = ctx.callbackQuery.data;
  if (response === 'show_booking_rules') {
    await ctx.reply(
      'Booking Rules:\n\n' +
        '1. Slots of one and a half hours can be booked, occupying two slots in the schedule, but costing as one and a half.\n' +
        '2. Strictly book according to slots.\n' +
        '3. The second consecutive slot with the same client is half the price.\n' +
        '4. For non-hourly slot bookings, please contact the admin.'
    );
    await ctx.answerCbQuery();
  } else if (response === 'select_date') {
    await ctx.reply('Please select a date for your massage session', {
      reply_markup: {
        inline_keyboard: generateDateButtons(),
      },
    });
    await ctx.answerCbQuery();
  } else if (response === 'manage_my_bookings') {
    await ctx.answerCbQuery();
    return ctx.scene.enter('manageBookingsScene');
  } else if (response.startsWith('date_')) {
    const selectedDate = response.split('_')[1];
    ctx.session.selectedDate = selectedDate;
    await ctx.answerCbQuery();
    return ctx.scene.enter('selectTimeScene');
  } else if (response === 'book_again') {
    await ctx.answerCbQuery();
    return ctx.scene.enter('selectDateScene');
  }
});

// Booking deletion scene
const deleteBookingScene = new Scenes.BaseScene('deleteBookingScene');
deleteBookingScene.enter(async (ctx) => {
  await ctx.reply('Select a booking to delete:', {
    reply_markup: {
      inline_keyboard: generateBookingButtons(),
    },
  });
});
deleteBookingScene.on('callback_query', async (ctx) => {
  const response = ctx.callbackQuery.data;
  console.log('Callback query received:', response);  // Логирование ответа

  if (response.startsWith('delete_')) {
    const [_, selectedDate, selectedTime] = response.split('_');
    console.log('Deleting booking for:', selectedDate, selectedTime);  // Логирование удаляемого бронирования
    deleteBooking(selectedDate, selectedTime);

    await ctx.reply(`Booking for ${selectedDate} at ${selectedTime} deleted.`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Book Another', callback_data: 'book_again' }],
          [{ text: 'Return to Booking Management', callback_data: 'return_to_manage_bookings' }],
        ],
      },
    });
    await ctx.answerCbQuery();
  } else if (response === 'book_again') {
    console.log('Handling book_again action');  // Логирование обработки действия
    await ctx.answerCbQuery();
    await ctx.scene.leave();
    return ctx.scene.enter('selectDateScene');
  } else if (response === 'return_to_manage_bookings') {
    console.log('Handling return_to_manage_bookings action');  // Логирование обработки действия
    await ctx.answerCbQuery();
    await ctx.scene.leave();
    return ctx.scene.enter('manageBookingsScene');
  }
});

// Manage bookings scene
const manageBookingsScene = new Scenes.BaseScene('manageBookingsScene');

manageBookingsScene.enter(async (ctx) => {
  await ctx.reply('Manage My Bookings', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'View My Bookings', callback_data: 'view_my_bookings' }],
        [{ text: 'Delete My Bookings', callback_data: 'delete_my_bookings' }],
      ],
    },
  });
});

manageBookingsScene.on('callback_query', async (ctx) => {
  const response = ctx.callbackQuery.data;
  if (response === 'view_my_bookings') {
    const bookings = loadBookings().filter((b) => b.username === ctx.from.username);
    if (bookings.length === 0) {
      await ctx.reply('You have no bookings.');
    } else {
      let replyText = 'Your bookings:\n\n';
      bookings.forEach((booking) => {
        const dayOfWeek = getDayOfWeek(booking.date);
        replyText += `Date: ${booking.date} (${dayOfWeek})\nTime: ${booking.time}\n\n`;
      });
      await ctx.reply(replyText);
    }
    await ctx.reply('What would you like to do next?', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Make a New Booking', callback_data: 'make_new_booking' }],
          [{ text: 'Return to Booking Management', callback_data: 'return_to_manage_bookings' }],
        ],
      },
    });
    await ctx.answerCbQuery();
  } else if (response === 'delete_my_bookings') {
    const bookings = loadBookings().filter((b) => b.username === ctx.from.username);
    if (bookings.length === 0) {
      await ctx.reply('You have no bookings to delete.');
      await ctx.answerCbQuery();
      await ctx.scene.leave();
    } else {
      const buttons = bookings.map((booking) => {
        const dayOfWeek = getDayOfWeek(booking.date);
        return [{ text: `Delete booking on ${booking.date} at ${booking.time}`, callback_data: `delete_${booking.date}_${booking.time}` }];
      });
      await ctx.reply('Select a booking to delete:', {
        reply_markup: {
          inline_keyboard: buttons,
        },
      });
      await ctx.answerCbQuery();
    }
  } else if (response.startsWith('delete_')) {
    const [_, selectedDate, selectedTime] = response.split('_');
    deleteBooking(selectedDate, selectedTime);
    removeBooking(ctx.from.username); // Добавьте эту строку для синхронизации с Google Sheets
    await ctx.reply(`Booking on ${selectedDate} at ${selectedTime} deleted.`);
    await ctx.reply('What would you like to do next?', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Make a New Booking', callback_data: 'make_new_booking' }],
          [{ text: 'Return to Booking Management', callback_data: 'return_to_manage_bookings' }],
        ],
      },
    });
    await ctx.answerCbQuery();
    await ctx.scene.leave();
  } else if (response === 'make_new_booking') {
    await ctx.answerCbQuery();
    await ctx.scene.leave();
    await ctx.scene.enter('selectDateScene');
  } else if (response === 'return_to_manage_bookings') {
    await ctx.answerCbQuery();
    await ctx.scene.reenter();
  }
});

// Add all scenes to stage
const stage = new Scenes.Stage([
  selectDateScene,
  selectTimeScene,
  deleteBookingScene,
  manageBookingsScene, // Adding new scene here
]);

stage.use((ctx, next) => {
  console.log(`Scene Middleware - from ID: ${ctx.from ? ctx.from.id : 'N/A'}`);
  console.log('Scene state:', ctx.scene.state);
  return next();
});

module.exports = stage;
