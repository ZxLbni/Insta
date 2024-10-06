require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const instagramUrlDirect = require('instagram-url-direct');
const sharp = require('sharp');
const express = require('express');

const app = express();
const port = 3000;

// Set up Express server
app.get('/', (req, res) => {
    res.send('Hello, Bot is running!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Replace with your Telegram Bot API token
const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true }); // Set polling to true

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;

    if (!messageText) {
        console.log('Received empty message');
        return;
    }

    if (messageText.toLowerCase() === '/start') {
        bot.sendPhoto(
            chatId,
            'https://i.ibb.co/0J2f0nx/51bdaf417eee.jpg',
            {
                caption: '🌼 Welcome to Instagram Downloader \nSend me an Instagram video or image link to download it.\n🦋 Join the update channel:',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'Join Update Channel',
                                url: 'https://t.me/NOOBPrivate',
                            },
                        ],
                    ],
                },
            }
        );
        return;
    }

    // Check if message contains a valid Instagram post URL
    if (messageText.includes('instagram.com')) {
        try {
            console.log('Received Instagram URL:', messageText);

            // Inform user that the file is being processed with a sticker
            const stickerId = 'CAACAgQAAxkBAAO2ZwJITRgbx83i0Foe10wYyz1JtH0AAxQAApbdYVB5j1jTu0nf2DYE','CAACAgQAAxkBAAPWZwJO0wrKUSvqcKW3pD28lVLGXO8AAoMNAAKinwhQ_A-ubWmlVgQ2BA',''; // Replace with your sticker file ID
            const stickerMessage = await bot.sendSticker(chatId, stickerId);
            const stickerMessageId = stickerMessage.message_id;

            // Extract direct URLs (both images and videos) from Instagram post
            const directUrls = await instagramUrlDirect(messageText);
            console.log('Direct URLs:', directUrls);

            if (!directUrls || !directUrls.url_list || directUrls.url_list.length === 0) {
                throw new Error('No direct URLs found');
            }

            // Iterate through each URL and handle based on type (image or video)
            for (const url of directUrls.url_list) {
                const response = await axios({
                    url: url,
                    method: 'GET',
                    responseType: 'arraybuffer',
                });

                if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png')) {
                    // Handle image download and convert to JPG
                    const imageBuffer = await sharp(response.data)
                        .jpeg()
                        .toBuffer();

                    console.log('Image converted to JPG successfully:', url);

                    // Send the image file with a caption
                    await bot.sendPhoto(chatId, imageBuffer, {
                        caption: 'Download from Instra Bot:',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: 'Join Update Channel',
                                        url: 'https://t.me/NOOBPrivate',
                                    },
                                ],
                            ],
                        },
                    });

                    console.log('Image and caption sent successfully:', url);
                } else {
                    // Handle video download
                    console.log('Video downloaded successfully:', url);

                    // Send the video file with a button
                    await bot.sendVideo(chatId, response.data, {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: 'Join Update Channel',
                                        url: 'https://t.me/NOOBPrivate',
                                    },
                                ],
                            ],
                        },
                    });

                    console.log('Video and button sent successfully:', url);
                }
            }

            // Delete the sticker message after sending the video or image
            await bot.deleteMessage(chatId, stickerMessageId);
        } catch (error) {
            console.error('Error processing media:', error);
            await bot.sendMessage(
                chatId,
                "We're currently experiencing technical issues, we'll resolve this as soon as possible. Thank you for your understanding!"
            );
        }
        return;
    }

    // No response for other messages
});
