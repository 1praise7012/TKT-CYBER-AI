import fetch from 'node-fetch';
import ytSearch from 'yt-search';
import fs from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys';

// Fix for ES modules import
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to import config with proper error handling
let config;
try {
  // For ES modules, you might need to use import.meta.url
  const configPath = join(__dirname, '..', 'config.cjs');
  config = (await import(configPath)).default;
} catch (error) {
  console.error('Config loading error:', error.message);
  // Fallback to empty config
  config = { Prefix: '.', PREFIX: '.' };
}

function toFancyFont(text) {
  const fontMap = {
    'a': 'ᴀ',
    'b': 'ʙ',
    'c': 'ᴄ',
    'd': 'ᴅ',
    'e': 'ᴇ',
    'f': 'ғ',
    'g': 'ɢ',
    'h': 'ʜ',
    'i': 'ɪ',
    'j': 'ᴊ',
    'k': 'ᴋ',
    'l': 'ʟ',
    'm': 'ᴍ',
    'n': 'ɴ',
    'o': 'ᴏ',
    'p': 'ᴘ',
    'q': 'ǫ',
    'r': 'ʀ',
    's': 's',
    't': 'ᴛ',
    'u': 'ᴜ',
    'v': 'ᴠ',
    'w': 'ᴡ',
    'x': 'x',
    'y': 'ʏ',
    'z': 'ᴢ'
  };
  
  return text.toLowerCase().split('').map(char => fontMap[char] || char).join('');
}

const streamPipeline = promisify(pipeline);
const tmpDir = os.tmpdir();

// Function to get YouTube thumbnail URL
function getYouTubeThumbnail(videoId, quality = 'hqdefault') {
  const qualities = {
    'default': 'default.jpg',
    'mqdefault': 'mqdefault.jpg',
    'hqdefault': 'hqdefault.jpg',
    'sddefault': 'sddefault.jpg',
    'maxresdefault': 'maxresdefault.jpg'
  };
  
  return `https://i.ytimg.com/vi/${videoId}/${qualities[quality] || qualities['hqdefault']}`;
}

// Function to extract YouTube video ID from URL
function extractYouTubeId(url) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : false;
}

// Custom reaction function
async function sendCustomReaction(client, message, reaction) {
  try {
    // Get the message key of the quoted message or the original message
    const key = message.quoted ? message.quoted.key : message.key;
    
    // Send reaction to the message
    await client.sendMessage(key.remoteJid, {
      react: {
        text: reaction,
        key: key
      }
    });
  } catch (error) {
    console.error("Error sending reaction:", error.message);
  }
}

const video = async (message, client) => {
  try {
    const prefix = config.Prefix || config.PREFIX || '.';
    const body = message.body || '';
    const command = body.startsWith(prefix) ? body.slice(prefix.length).split(" ")[0].toLowerCase() : '';
    const args = body.slice(prefix.length + command.length).trim().split(" ");
    
    // Send a custom reaction when the video command is detected
    if (command === "video") {
      // Send a loading reaction
      await sendCustomReaction(client, message, "⏳");
      
      if (args.length === 0 || !args.join(" ")) {
        // Send error reaction
        await sendCustomReaction(client, message, "❌");
        return await client.sendMessage(message.from, {
          text: toFancyFont("Please provide a video name or keywords to search"),
          mentions: [message.sender]
        }, { quoted: message });
      }
      
      const query = args.join(" ");
      
      const searchResults = await ytSearch(query);
      
      if (!searchResults.videos || searchResults.videos.length === 0) {
        // Send error reaction
        await sendCustomReaction(client, message, "❌");
        return await client.sendMessage(message.from, {
          text: toFancyFont('No videos found for') + " \"" + query + "\"",
          mentions: [message.sender]
        }, { quoted: message });
      }
      
      // Send a searching reaction
      await sendCustomReaction(client, message, "🔍");
      
      const video = searchResults.videos[0];
      const fileName = video.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_').substring(0, 100);
      const filePath = tmpDir + '/' + fileName + ".mp4";
      
      let apiResponse;
      
      try {
        const apiUrl = "https://api.giftedtech.co.ke/api/download/ytmp4?url=" + encodeURIComponent(video.url);
        apiResponse = await fetch(apiUrl);
        
        if (!apiResponse.ok) {
          throw new Error("API responded with status: " + apiResponse.status);
        }
        
        const apiData = await apiResponse.json();
        
        if (!apiData.status || !apiData.result?.download_url) {
          throw new Error("API response missing download URL or failed");
        }
        
        // Extract YouTube video ID from URL
        const videoId = extractYouTubeId(video.url) || video.videoId;
        
        // Get YouTube thumbnail URL
        const thumbnailUrl = getYouTubeThumbnail(videoId, 'maxresdefault');
        
        // Format duration correctly
        const minutes = Math.floor(video.duration.seconds / 60);
        const seconds = video.duration.seconds % 60;
        const formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Create the video info display
        const videoInfo = `
 ━❍ *VIDEO*❍━
🎬 *Title:* ${video.title}

👤 *Channel:* ${video.author.name}
⏱️ *Duration:* ${formattedDuration}
📅 *Published:* ${video.ago}
👁️ *Views:* ${video.views.toLocaleString()}
📥 *Format:* MP4
        `.trim();
        
        // Create buttons with Menu and Join Channel options
        const buttons = [
          {
            buttonId: prefix + 'menu',
            buttonText: { displayText: "📋 Menu" },
            type: 1
          },
          {
            buttonId: prefix + 'join channel',
            buttonText: { displayText: "📢 Join Channel" },
            type: 1
          }
        ];
        
        // Download thumbnail image
        let imageBuffer = null;
        try {
          const imageResponse = await fetch(thumbnailUrl);
          if (imageResponse.ok) {
            const arrayBuffer = await imageResponse.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
          }
        } catch (imageError) {
          console.error("Failed to download thumbnail:", imageError.message);
        }
        
        // Send message with image if available, otherwise text only
        if (imageBuffer) {
          const imageMessage = {
            image: imageBuffer,
            caption: videoInfo,
            buttons: buttons,
            mentions: [message.sender]
          };
          
          await client.sendMessage(message.from, imageMessage, { quoted: message });
        } else {
          const buttonMessage = {
            text: videoInfo,
            buttons: buttons,
            mentions: [message.sender]
          };
          
          await client.sendMessage(message.from, buttonMessage, { quoted: message });
        }
        
        // Send a downloading reaction
        await sendCustomReaction(client, message, "⬇️");
        
        const videoResponse = await fetch(apiData.result.download_url);
        
        if (!videoResponse.ok) {
          throw new Error("Failed to download video: " + videoResponse.status);
        }
        
        const fileStream = fs.createWriteStream(filePath);
        await streamPipeline(videoResponse.body, fileStream);
        
      } catch (apiError) {
        console.error("API error:", apiError.message);
        // Send error reaction
        await sendCustomReaction(client, message, "❌");
        
        return await client.sendMessage(message.from, {
          text: "*ᴛᴋᴛ-ᴄʏʙᴇʀ-ᴀɪ* " + toFancyFont("couldn't process your request. Please try again later"),
          mentions: [message.sender]
        }, { quoted: message });
      }
      
      try {
        // Send video file
        const videoData = fs.readFileSync(filePath);
        
        // Send success reaction before sending video
        await sendCustomReaction(client, message, "✅");
        
        await client.sendMessage(message.from, { 
          video: videoData, 
          mimetype: 'video/mp4',
          caption: video.title,
          fileName: fileName + ".mp4"
        }, { quoted: message });
        
        // Clean up temp file
        setTimeout(() => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log("Deleted temp file: " + filePath);
            }
          } catch (cleanupError) {
            console.error("Error during file cleanup:", cleanupError);
          }
        }, 5000);
        
      } catch (sendError) {
        console.error("Failed to send video:", sendError.message);
        // Send error reaction
        await sendCustomReaction(client, message, "❌");
        
        return await client.sendMessage(message.from, {
          text: "*𝐓𝐊𝐓-𝐂𝐘𝐁𝐄𝐑-𝐓𝐄𝐂𝐇* " + toFancyFont("failed to send video file"),
          mentions: [message.sender]
        }, { quoted: message });
      }
    }
  } catch (error) {
    console.error("❌ video error: " + error.message);
    // Send error reaction
    await sendCustomReaction(client, message, "❌");
    
    await client.sendMessage(message.from, {
      text: "*𝐓𝐊𝐓-𝐂𝐘𝐁𝐄𝐑-𝐓𝐄𝐂𝐇* " + toFancyFont("encountered an error. Please try again"),
      mentions: [message.sender]
    }, { quoted: message });
  }
};

export default video;
