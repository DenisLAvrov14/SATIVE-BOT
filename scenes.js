const { Scenes } = require('telegraf');
const { generateDateButtons, generateTimeButtons, saveBooking, deleteBooking, generateBookingButtons, loadBookings } = require('./bookings');
const { notifyMainAdmin } = require('./notifications');

const formatDateString = (dateString) => {
    const date = new Date(dateString);
    return date.toDateString(); // Example: "Fri Jul 26 2024"
};

const selectDateScene = new Scenes.BaseScene('selectDateScene');

selectDateScene.enter(async (ctx) => {
    await ctx.reply('Welcome! Please choose an option:', {
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
            '1. Slots for one and a half hours can be booked by occupying two slots in the schedule, but the cost will be for one and a half.\n' +
            '2. Strictly book by the slots.\n' +
            '3. The second consecutive slot with the same client is half price.\n' +
            '4. For non-hourly slot bookings, contact the administrator.'
        );
        await ctx.answerCbQuery();
    } else if (response === 'select_date') {
        await ctx.reply('Please select a date for your massage session', {
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
    }
});

const selectTimeScene = new Scenes.BaseScene('selectTimeScene');

selectTimeScene.enter(async (ctx) => {
    const selectedDate = ctx.session.selectedDate;
    await ctx.reply(`You have selected the date: ${formatDateString(selectedDate)}. Now, please choose a time:`, {
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

        const newBooking = {
            user_id: ctx.from.id,
            username: ctx.from.username,
            booking_date: selectedDate,
            status: 'pending',
            time: selectedTime
        };

        const bookings = await loadBookings();
        const existingBooking = bookings.find(booking => booking.booking_date === selectedDate && booking.time === selectedTime);
        if (existingBooking) {
            await ctx.reply(`Sorry, the slot on ${formatDateString(selectedDate)} at ${selectedTime} is already booked by ${existingBooking.username || existingBooking.user_id}. Please select another time.`);
            await ctx.answerCbQuery();
            return;
        }

        await saveBooking(newBooking);
        await ctx.reply(`Booking on ${formatDateString(selectedDate)} at ${selectedTime} has been created.`, {
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

const deleteBookingScene = new Scenes.BaseScene('deleteBookingScene');

deleteBookingScene.enter(async (ctx) => {
    await ctx.reply('Select a booking to delete:', {
        reply_markup: {
            inline_keyboard: await generateBookingButtons(),
        },
    });
});

deleteBookingScene.on('callback_query', async (ctx) => {
    const response = ctx.callbackQuery.data;
    if (response.startsWith('delete_')) {
        const bookingId = response.split('_')[1];
        await deleteBooking(bookingId);
        await ctx.reply('Booking has been deleted.', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Book Again', callback_data: 'book_again' }],
                    [{ text: 'Return to Manage Bookings', callback_data: 'return_to_manage_bookings' }],
                ],
            },
        });
        await ctx.answerCbQuery();
    }
});

const manageBookingsScene = new Scenes.BaseScene('manageBookingsScene');

manageBookingsScene.enter(async (ctx) => {
    await ctx.reply('Manage my bookings', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'View my bookings', callback_data: 'view_my_bookings' }],
                [{ text: 'Delete my bookings', callback_data: 'delete_my_bookings' }],
            ],
        },
    });
});

manageBookingsScene.on('callback_query', async (ctx) => {
    const response = ctx.callbackQuery.data;
    if (response === 'view_my_bookings') {
        const bookings = (await loadBookings()).filter((b) => b.username === ctx.from.username);
        if (bookings.length === 0) {
            await ctx.reply('You have no bookings.');
        } else {
            let replyText = 'Your bookings:\n\n';
            bookings.forEach((booking) => {
                replyText += `Date: ${formatDateString(booking.booking_date)}\nTime: ${booking.time}\n\n`;
            });
            await ctx.reply(replyText);
        }
        await ctx.reply('What would you like to do next?', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Make a new booking', callback_data: 'make_new_booking' }],
                    [{ text: 'Return to manage bookings', callback_data: 'return_to_manage_bookings' }],
                ],
            },
        });
        await ctx.answerCbQuery();
    } else if (response === 'delete_my_bookings') {
        const bookings = (await loadBookings()).filter((b) => b.username === ctx.from.username);
        if (bookings.length === 0) {
            await ctx.reply('You have no bookings to delete.');
            await ctx.answerCbQuery();
            await ctx.scene.leave();
        } else {
            const buttons = bookings.map((booking) => {
                return [{ text: `Delete booking on ${formatDateString(booking.booking_date)} at ${booking.time}`, callback_data: `delete_${booking.id}` }];
            });
            await ctx.reply('Select a booking to delete:', {
                reply_markup: {
                    inline_keyboard: buttons,
                },
            });
            await ctx.answerCbQuery();
        }
    } else if (response.startsWith('delete_')) {
        const bookingId = response.split('_')[1];
        await deleteBooking(bookingId);
        await ctx.reply('Booking has been deleted.', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Make a new booking', callback_data: 'make_new_booking' }],
                    [{ text: 'Return to manage bookings', callback_data: 'return_to_manage_bookings' }],
                ],
            },
        });
        await ctx.answerCbQuery();
    } else if (response === 'make_new_booking') {
        await ctx.answerCbQuery();
        await ctx.scene.leave();
        await ctx.scene.enter('selectDateScene');
    } else if (response === 'return_to_manage_bookings') {
        await ctx.answerCbQuery();
        await ctx.scene.reenter();
    }
});

const stage = new Scenes.Stage([selectDateScene, selectTimeScene, deleteBookingScene, manageBookingsScene]);

stage.use((ctx, next) => {
    console.log(`Scene Middleware - from ID: ${ctx.from ? ctx.from.id : 'N/A'}`);
    console.log('Scene state:', ctx.scene.state);
    return next();
});

module.exports = stage;
