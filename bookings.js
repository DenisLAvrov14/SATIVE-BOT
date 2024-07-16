const { Telegraf, Scenes, session } = require('telegraf');
const fs = require('fs');
const path = require('path');

const bookingsFilePath = path.join(__dirname, 'bookings.json');

// Функции для работы с файлами бронирования
function loadBookings() {
  if (!fs.existsSync(bookingsFilePath)) {
    return [];
  }
  const data = fs.readFileSync(bookingsFilePath, 'utf8');
  return JSON.parse(data).bookings || [];
}

function saveBookings(bookings) {
  fs.writeFileSync(bookingsFilePath, JSON.stringify({ bookings }, null, 2));
}

function deleteBooking(date, time) {
  let bookings = loadBookings();
  bookings = bookings.filter(b => !(b.date === date && b.time === time));
  saveBookings(bookings);
}

// Вспомогательные функции
function getDayOfWeek(dateString) {
  const date = new Date(dateString);
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return daysOfWeek[date.getUTCDay()];
}

function generateDateButtons() {
  const bookings = loadBookings();
  const availableDates = [];
  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    const dateString = date.toISOString().split("T")[0];
    const dayOfWeek = getDayOfWeek(dateString);

    const bookedTimes = bookings
      .filter((b) => b.date === dateString)
      .map((b) => b.time);

    const allTimes = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
                      "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", 
                      "22:00"];
    const availableTimes = allTimes.filter(
      (time) => !bookedTimes.includes(time)
    );

    if (availableTimes.length > 0) {
      availableDates.push([
        { text: `${dateString} (${dayOfWeek})`, callback_data: `date_${dateString}` },
      ]);
    }
  }
  return availableDates;
}

function generateTimeButtons(date) {
  const bookings = loadBookings();
  const bookedTimes = bookings
    .filter((b) => b.date === date)
    .map((b) => b.time);

  const times = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
                 "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", 
                 "22:00"];

  const currentDate = new Date().toISOString().split("T")[0];
  const currentTime = new Date().getHours() + ':' + String(new Date().getMinutes()).padStart(2, '0');

  const availableTimes = times.filter(time => {
    if (date === currentDate && time <= currentTime) {
      return false;
    }
    return !bookedTimes.includes(time);
  });

  const buttons = availableTimes.map((time) => [{ text: time, callback_data: `time_${date}_${time}` }]);
  return buttons;
}

function generateBookingButtons() {
  const bookings = loadBookings();
  const today = new Date().toISOString().split("T")[0];
  const filteredBookings = bookings.filter(b => b.date >= today);
  const buttons = filteredBookings.map(b => {
    const dayOfWeek = getDayOfWeek(b.date);
    return [
      { text: `${b.date} (${dayOfWeek}) ${b.time} (${b.username ? `@${b.username}` : b.user})`, callback_data: `delete_${b.date}_${b.time}` }
    ];
  });
  return buttons;
}

const bot = new Telegraf(process.env.BOT_TOKEN);

const stage = new Scenes.Stage();

// Сцена выбора даты
const selectDateScene = new Scenes.BaseScene('selectDateScene');
selectDateScene.enter((ctx) => {
  ctx.reply('Please select a date:', {
    reply_markup: {
      inline_keyboard: generateDateButtons(),
    },
  });
});
selectDateScene.on('callback_query', (ctx) => {
  const response = ctx.callbackQuery.data;
  if (response.startsWith('date_')) {
    const selectedDate = response.split('_')[1];
    ctx.session.selectedDate = selectedDate;
    ctx.scene.enter('selectTimeScene');
  }
});

// Сцена выбора времени
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
    const bookings = loadBookings();
    if (bookings.some(b => b.date === selectedDate && b.time === selectedTime)) {
      await ctx.reply('This time slot is already booked. Please choose another time.');
      await ctx.answerCbQuery();
      return;
    }
    ctx.session.selectedTime = selectedTime;

    const fullName = ctx.from.first_name;
    const username = ctx.from.username ? `@${ctx.from.username}` : fullName;
    const newBooking = {
      date: selectedDate,
      time: selectedTime,
      user: fullName,
      username: ctx.from.username,
    };

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

stage.register(selectDateScene);
stage.register(selectTimeScene);

bot.use(session());
bot.use(stage.middleware());

bot.command('start', (ctx) => {
  ctx.scene.enter('selectDateScene');
});

bot.launch();
