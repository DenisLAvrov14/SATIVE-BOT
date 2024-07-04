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

function getDayOfWeek(dateString) {
  const date = new Date(dateString);
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return daysOfWeek[date.getUTCDay()];
}

const selectTimeScene = new Scenes.BaseScene("selectTimeScene");
selectTimeScene.enter(async (ctx) => {
  const selectedDate = ctx.session.selectedDate;
  console.log(`Entering selectTimeScene - selectedDate: ${selectedDate}`);
  await ctx.reply(`You have selected the date: ${selectedDate}. Now choose a time:`, {
    reply_markup: {
      inline_keyboard: generateTimeButtons(selectedDate),
    },
  });
});
selectTimeScene.on("callback_query", async (ctx) => {
  const response = ctx.callbackQuery.data;
  console.log('Time selected:', response);
  if (response.startsWith("time_")) {
    const [_, selectedDate, selectedTime] = response.split("_");
    ctx.session.selectedTime = selectedTime;

    const fullName = ctx.from.first_name;
    const username = ctx.from.username ? `@${ctx.from.username}` : fullName;
    const newBooking = {
      date: selectedDate,
      time: selectedTime,
      user: fullName,
      username: ctx.from.username
    };
    
    const bookings = loadBookings();
    bookings.push(newBooking);
    saveBookings(bookings);

    const dayOfWeek = getDayOfWeek(selectedDate);

    await ctx.reply(`Booking for ${selectedDate} (${dayOfWeek}) at ${selectedTime} created, ${username}.`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Book again", callback_data: "book_again" }]
        ]
      }
    });

    await notifyMainAdmin(newBooking);
    await ctx.answerCbQuery('Action handled: time selection');
    ctx.scene.leave();
  }
});

const selectDateScene = new Scenes.BaseScene("selectDateScene");
selectDateScene.enter(async (ctx) => {
  console.log('Entering selectDateScene');
  await ctx.reply("Welcome! Please select an option:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Booking Rules", callback_data: "show_booking_rules" }],
        [{ text: "Select Date", callback_data: "select_date" }]
      ]
    }
  });
});
selectDateScene.on("callback_query", async (ctx) => {
  const response = ctx.callbackQuery.data;
  console.log('Date selected:', response);
  if (response === "show_booking_rules") {
    await ctx.reply(
      "Booking Rules:\n\n" +
      "1. Slots of one and a half hours can be booked, occupying two slots in the schedule, but costing as one and a half.\n" +
      "2. Strictly book according to slots.\n" +
      "3. The second consecutive slot with the same client is half the price.\n" +
      "4. For non-hourly slot bookings, please contact the admin."
    );
    await ctx.answerCbQuery('Action handled: show_booking_rules');
  } else if (response === "select_date") {
    await ctx.reply("Please select a date for your massage session", {
      reply_markup: {
        inline_keyboard: generateDateButtons(),
      },
    });
    await ctx.answerCbQuery('Action handled: select_date');
  } else if (response.startsWith("date_")) {
    const selectedDate = response.split("_")[1];
    ctx.session.selectedDate = selectedDate;
    await ctx.answerCbQuery('Action handled: date selection');
    return ctx.scene.enter("selectTimeScene");
  } else if (response === "book_again") {
    await ctx.answerCbQuery('Action handled: book_again');
    return ctx.scene.enter("selectDateScene");
  }
});

const deleteBookingScene = new Scenes.BaseScene("deleteBookingScene");
deleteBookingScene.enter(async (ctx) => {
  console.log('Entering deleteBookingScene');
  await ctx.reply("Select a booking to delete:", {
    reply_markup: {
      inline_keyboard: generateBookingButtons(),
    },
  });
});
deleteBookingScene.on("callback_query", async (ctx) => {
  const response = ctx.callbackQuery.data;
  console.log('Booking selected for deletion:', response);
  if (response.startsWith("delete_")) {
    const [_, selectedDate, selectedTime] = response.split("_");
    deleteBooking(selectedDate, selectedTime);

    await ctx.reply(`Booking for ${selectedDate} at ${selectedTime} deleted.`);
    await ctx.answerCbQuery('Action handled: booking deletion');
    ctx.scene.leave();
  }
});

const stage = new Scenes.Stage([
  selectDateScene,
  selectTimeScene,
  deleteBookingScene,
]);

stage.use((ctx, next) => {
  console.log(`Scene Middleware - from ID: ${ctx.from ? ctx.from.id : 'N/A'}`);
  console.log('Scene state:', ctx.scene.state);
  return next();
});

module.exports = stage;
