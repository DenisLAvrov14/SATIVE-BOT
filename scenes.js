const { Scenes, Markup } = require('telegraf');
const {
  generateDateButtons,
  generateTimeButtons,
  deleteBooking,
  loadBookings,
  saveBooking, // Используем эту функцию для сохранения бронирований
  generateBookingButtons,
  removeBooking 
} = require('./bookings');
const { notifyMainAdmin } = require('./notifications');
const { getDayOfWeek } = require('./utils');

// Сцена выбора времени
const selectTimeScene = new Scenes.BaseScene('selectTimeScene');
selectTimeScene.enter(async (ctx) => {
  const selectedDate = ctx.session.selectedDate;
  await ctx.reply(`Вы выбрали дату: ${selectedDate}. Теперь выберите время:`, {
    reply_markup: {
      inline_keyboard: await generateTimeButtons(selectedDate),
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

    const bookings = await loadBookings();
    const existingBooking = bookings.find(booking => booking.date === selectedDate && booking.time === selectedTime);
    if (existingBooking) {
      await ctx.reply(`Извините, слот на ${selectedDate} в ${selectedTime} уже занят ${existingBooking.user}. Пожалуйста, выберите другое время.`);
      await ctx.answerCbQuery();
      return;
    }

    await saveBooking(newBooking); // Сохраняем бронирование

    const dayOfWeek = getDayOfWeek(selectedDate);

    await ctx.reply(`Бронирование на ${selectedDate} (${dayOfWeek}) в ${selectedTime} создано, ${username}.`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Забронировать снова', callback_data: 'book_again' }],
        ],
      },
    });

    await notifyMainAdmin(newBooking);
    await ctx.answerCbQuery();
    await ctx.scene.leave();
  }
});

// Сцена выбора даты
const selectDateScene = new Scenes.BaseScene('selectDateScene');
selectDateScene.enter(async (ctx) => {
  await ctx.reply('Добро пожаловать! Пожалуйста, выберите опцию:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Правила бронирования', callback_data: 'show_booking_rules' }],
        [{ text: 'Выбрать дату', callback_data: 'select_date' }],
        [{ text: 'Управлять моими бронированиями', callback_data: 'manage_my_bookings' }],
      ],
    },
  });
});
selectDateScene.on('callback_query', async (ctx) => {
  const response = ctx.callbackQuery.data;
  if (response === 'show_booking_rules') {
    await ctx.reply(
      'Правила бронирования:\n\n' +
        '1. Слоты на полтора часа можно бронировать, занимая два слота в расписании, но стоимость будет как за полтора.\n' +
        '2. Строго бронировать по слотам.\n' +
        '3. Второй последовательный слот с тем же клиентом стоит в полцены.\n' +
        '4. Для бронирования не по часовым слотам, свяжитесь с администратором.'
    );
    await ctx.answerCbQuery();
  } else if (response === 'select_date') {
    await ctx.reply('Пожалуйста, выберите дату для сеанса массажа', {
      reply_markup: {
        inline_keyboard: await generateDateButtons(),
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

// Сцена удаления бронирования
const deleteBookingScene = new Scenes.BaseScene('deleteBookingScene');
deleteBookingScene.enter(async (ctx) => {
  await ctx.reply('Выберите бронирование для удаления:', {
    reply_markup: {
      inline_keyboard: await generateBookingButtons(),
    },
  });
});
deleteBookingScene.on('callback_query', async (ctx) => {
  const response = ctx.callbackQuery.data;
  console.log('Callback query received:', response);

  if (response.startsWith('delete_')) {
    const [_, selectedDate, selectedTime] = response.split('_');
    console.log('Deleting booking for:', selectedDate, selectedTime);
    await deleteBooking(selectedDate, selectedTime);
    await removeBooking(ctx.from.username); // Синхронизация с Google Sheets

    await ctx.reply(`Бронирование на ${selectedDate} в ${selectedTime} удалено.`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Забронировать снова', callback_data: 'book_again' }],
          [{ text: 'Вернуться к управлению бронированиями', callback_data: 'return_to_manage_bookings' }],
        ],
      },
    });
    await ctx.answerCbQuery();
  } else if (response === 'book_again') {
    console.log('Handling book_again action');
    await ctx.answerCbQuery();
    await ctx.scene.leave();
    return ctx.scene.enter('selectDateScene');
  } else if (response === 'return_to_manage_bookings') {
    console.log('Handling return_to_manage_bookings action');
    await ctx.answerCbQuery();
    await ctx.scene.leave();
    return ctx.scene.enter('manageBookingsScene');
  }
});

// Сцена управления бронированиями
const manageBookingsScene = new Scenes.BaseScene('manageBookingsScene');

manageBookingsScene.enter(async (ctx) => {
  await ctx.reply('Управление моими бронированиями', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Просмотреть мои бронирования', callback_data: 'view_my_bookings' }],
        [{ text: 'Удалить мои бронирования', callback_data: 'delete_my_bookings' }],
      ],
    },
  });
});

manageBookingsScene.on('callback_query', async (ctx) => {
  const response = ctx.callbackQuery.data;
  if (response === 'view_my_bookings') {
    const bookings = (await loadBookings()).filter((b) => b.username === ctx.from.username);
    if (bookings.length === 0) {
      await ctx.reply('У вас нет бронирований.');
    } else {
      let replyText = 'Ваши бронирования:\n\n';
      bookings.forEach((booking) => {
        const dayOfWeek = getDayOfWeek(booking.date);
        replyText += `Дата: ${booking.date} (${dayOfWeek})\nВремя: ${booking.time}\n\n`;
      });
      await ctx.reply(replyText);
    }
    await ctx.reply('Что бы вы хотели сделать дальше?', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Сделать новое бронирование', callback_data: 'make_new_booking' }],
          [{ text: 'Вернуться к управлению бронированиями', callback_data: 'return_to_manage_bookings' }],
        ],
      },
    });
    await ctx.answerCbQuery();
  } else if (response === 'delete_my_bookings') {
    const bookings = (await loadBookings()).filter((b) => b.username === ctx.from.username);
    if (bookings.length === 0) {
      await ctx.reply('У вас нет бронирований для удаления.');
      await ctx.answerCbQuery();
      await ctx.scene.leave();
    } else {
      const buttons = bookings.map((booking) => {
        const dayOfWeek = getDayOfWeek(booking.date);
        return [{ text: `Удалить бронирование на ${booking.date} в ${booking.time}`, callback_data: `delete_${booking.date}_${booking.time}` }];
      });
      await ctx.reply('Выберите бронирование для удаления:', {
        reply_markup: {
          inline_keyboard: buttons,
        },
      });
      await ctx.answerCbQuery();
    }
  } else if (response.startsWith('delete_')) {
    const [_, selectedDate, selectedTime] = response.split('_');
    await deleteBooking(selectedDate, selectedTime);
    await removeBooking(ctx.from.username); // Синхронизация с Google Sheets
    await ctx.reply(`Бронирование на ${selectedDate} в ${selectedTime} удалено.`);
    await ctx.reply('Что бы вы хотели сделать дальше?', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Сделать новое бронирование', callback_data: 'make_new_booking' }],
          [{ text: 'Вернуться к управлению бронированиями', callback_data: 'return_to_manage_bookings' }],
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

// Добавляем все сцены на stage
const stage = new Scenes.Stage([
  selectDateScene,
  selectTimeScene,
  deleteBookingScene,
  manageBookingsScene,
]);

stage.use((ctx, next) => {
  console.log(`Scene Middleware - from ID: ${ctx.from ? ctx.from.id : 'N/A'}`);
  console.log('Scene state:', ctx.scene.state);
  return next();
});

module.exports = stage;
