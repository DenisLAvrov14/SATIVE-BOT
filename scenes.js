const { Scenes, Markup } = require('telegraf');
const {
  generateDateButtons,
  generateTimeButtons,
  deleteBooking,
  loadBookings,
  saveBookings,
  generateBookingButtons
} = require('./bookings');
const { notifyMainAdmin } = require('./notifications'); // Import the notifyMainAdmin function

function getDayOfWeek(dateString) {
  const date = new Date(dateString);
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return daysOfWeek[date.getUTCDay()];
}

// Create a scene for selecting the booking time
const selectTimeScene = new Scenes.BaseScene("selectTimeScene");
selectTimeScene.enter(async (ctx) => {
  const selectedDate = ctx.session.selectedDate;
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

    const fullName = ctx.from.first_name; // User's first name from context
    const username = ctx.from.username ? `@${ctx.from.username}` : fullName; // User's username or first name if username is not set
    const newBooking = {
      date: selectedDate,
      time: selectedTime,
      user: fullName,
      username: ctx.from.username // Add username
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

    await notifyMainAdmin(newBooking); // Notify the main admin
    ctx.scene.leave();
  }
});

// Create a scene for selecting the booking date
const selectDateScene = new Scenes.BaseScene("selectDateScene");
selectDateScene.enter(async (ctx) => {
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
  } else if (response === "select_date") {
    await ctx.reply("Please select a date for your massage session", {
      reply_markup: {
        inline_keyboard: generateDateButtons(),
      },
    });
  } else if (response.startsWith("date_")) {
    const selectedDate = response.split("_")[1];
    ctx.session.selectedDate = selectedDate;
    return ctx.scene.enter("selectTimeScene");
  } else if (response === "book_again") {
    return ctx.scene.enter("selectDateScene");
  }
});

// Create a scene for deleting a booking
const deleteBookingScene = new Scenes.BaseScene("deleteBookingScene");
deleteBookingScene.enter(async (ctx) => {
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
    ctx.scene.leave();
  }
});

// Create a scene manager
const stage = new Scenes.Stage([
  selectDateScene,
  selectTimeScene,
  deleteBookingScene,
]);

module.exports = stage;
