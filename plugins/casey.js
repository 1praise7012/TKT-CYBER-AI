import config from '../config.cjs';
import axios from 'axios';

const casey = async (m, Matrix) => {
  try {
    const prefix = config.PREFIX;
    const body = m.body || '';
    const cmd = body.startsWith(prefix) ? body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    
    // Only process tafadza command
    if (cmd !== 'tafadzwa') return;

    const text = body.slice(prefix.length + cmd.length).trim();

    // Check if user provided a question/message
    if (!text) {
      const buttonMessage = {
        text: `*TKT-CYBER AI*\n\nPlease provide a message or question for Casey AI to respond to.\n\nUsage: ${prefix}casey Hello, how are you?`,
        footer: "TKT-CYBER-AI  Powered by TKT-TECH🇿🇼",
        buttons: [
          { buttonId: `${prefix}aimenu`, buttonText: { displayText: "AI MENU" }, type: 1 },
          { buttonId: `${prefix}menu`, buttonText: { displayText: "MAIN MENU" }, type: 1 }
        ],
        headerType: 1
      };
      return await Matrix.sendMessage(m.from, buttonMessage, { quoted: m });
    }

    // Check for custom responses before calling API
    const customResponse = getCustomResponse(text, prefix);
    if (customResponse) {
      return await Matrix.sendMessage(m.from, customResponse, { quoted: m });
    }

    // Continue with API calls for other queries
    let response;
    let apiUsed = 'primary';

    try {
      // Try primary API first
      const primaryResponse = await axios.get(`https://api.giftedtech.co.ke/api/ai/geminiaipro?apikey=gifted&q=${encodeURIComponent(text)}`, {
        timeout: 30000
      });

      if (primaryResponse.data && primaryResponse.data.success && primaryResponse.data.result) {
        response = primaryResponse.data.result;
      } else {
        throw new Error('Primary API response invalid');
      }
    } catch (primaryError) {
      console.log('Primary API failed, trying fallback...', primaryError.message);
      
      try {
        // Try fallback API
        const fallbackResponse = await axios.get(`https://izumiiiiiiii.dpdns.org/ai/geminiai?messages=${encodeURIComponent(text)}`, {
          timeout: 30000
        });

        if (fallbackResponse.data && fallbackResponse.data.status && fallbackResponse.data.result) {
          response = fallbackResponse.data.result;
          apiUsed = 'fallback';
        } else {
          throw new Error('Fallback API response invalid');
        }
      } catch (fallbackError) {
        console.error('Both APIs failed:', fallbackError.message);
        
        const errorButtons = {
          text: '❌ *TKT-CYBER-AI is currently unavailable*\n\nBoth AI services are experiencing issues. Please try again later.',
          footer: "TKT-CYBER-TECH- Technical Issues",
          buttons: [
            { buttonId: `${prefix}aimenu`, buttonText: { displayText: "AI MENU" }, type: 1 },
            { buttonId: `${prefix}bowner`, buttonText: { displayText: "CONTACT OWNER" }, type: 1 }
          ],
          headerType: 1
        };
        
        return await Matrix.sendMessage(m.from, errorButtons, { quoted: m });
      }
    }

    // Clean up the response
    response = response.trim();

    // Send the AI response with buttons
    const aiResponse = {
      text: `${response}`,
      footer: `TKT-CYBER-AI - Powered by ${apiUsed === 'primary' ? 'TKT-TECH🇿🇼' : 'DEV TAFADZWA-TKT'}`,
      buttons: [
        { buttonId: `${prefix}aimenu`, buttonText: { displayText: "AI MENU" }, type: 1 },
        { buttonId: `${prefix}menu`, buttonText: { displayText: "MAIN MENU" }, type: 1 },
        { buttonId: `${prefix}owner`, buttonText: { displayText: "INFO" }, type: 1 }
      ],
      headerType: 1
    };

    await Matrix.sendMessage(m.from, aiResponse, { quoted: m });
      
  } catch (error) {
    console.error('Error in casey command:', error);
    
    const errorButtons = {
      text: '❌ *An error occurred with TKT-CYBER AI*\n\nPlease try again later or contact the owner for support.',
      footer: "TKT-CYBER AI - Error",
      buttons: [
        { buttonId: `${prefix}aimenu`, buttonText: { displayText: "AI MENU" }, type: 1 },
        { buttonId: `${prefix}owner`, buttonText: { displayText: "CONTACT OWNER" }, type: 1 }
      ],
      headerType: 1
    };
    
    await Matrix.sendMessage(m.from, errorButtons, { quoted: m });
  }
};

// Function to handle custom responses
const getCustomResponse = (text, prefix) => {
  const lowerText = text.toLowerCase();
  
  // Check for owner/developer related queries
  if (lowerText.includes('owner') || lowerText.includes('developer') || lowerText.includes('creator') || 
      lowerText.includes('who made you') || lowerText.includes('who created you') || 
      lowerText.includes('who developed you') || lowerText.includes('who built you')) {
    
    return {
      text: `*👨‍💻 MEET THE DEVELOPERS*\n\n🇿🇼 *Primary Developer:* DEV Tafadzwa-TKT-Tech\n• Location: ZIMBABWE\n• Specialization: AI Integration & Bot Development\n• Role: Lead Developer & Project Owner\n\n🤖 *Technical Partner:* TKT-TECH🇿🇼 & TECH-DEVS-INC\n• Specialization: Backend Systems & API Management\n• Role: Technical Support & Infrastructure\n\n*About Our Team:*\nTKT-CYBER AI is the result of a collaborative effort between TKT-TECH and TECH-DEVS-INC. Together, we bring you cutting-edge AI technology with reliable bot functionality, ensuring you get the best AI experience possible.\n\n*Proudly Made in ZIMBABWE* 🇿🇼`,
      footer: "TKT-TECH🇿🇼 x TECH-DEVS-INC - ZIMBABWEAN Co-operation",
      buttons: [
        { buttonId: `${prefix}menu`, buttonText: { displayText: "MAIN MENU" }, type: 1 },
        { buttonId: `${prefix}aimenu`, buttonText: { displayText: "AI MENU" }, type: 1 },
        { buttonId: `${prefix}owner`, buttonText: { displayText: "GET SUPPORT" }, type: 1 }
      ],
      headerType: 1
    };
  }
  
  // Check for creation date/when made queries
  if (lowerText.includes('when were you made') || lowerText.includes('when were you created') || 
      lowerText.includes('when were you developed') || lowerText.includes('creation date') || 
      lowerText.includes('when did you start') || lowerText.includes('how old are you') ||
      lowerText.includes('when were you built') || lowerText.includes('release date')) {
    
    return {
      text: `*📅 TKT-CYBER-AI TIMELINE*\n\n🚀 *Development Started:* December 2023\n🎯 *First Release:* June 2025\n🔄 *Current Version:* 2.0 (October 2025)\n\n*Development Journey:*\n• *Phase 1:* Core AI integration and basic functionality\n• *Phase 2:* Enhanced response system and multi-API support\n• *Phase 3:* Advanced customization and user experience improvements\n\n*What's Next:*\nWe're constantly working on updates to make TKT-CYBER-AI smarter, faster, and more helpful. Stay tuned for exciting new features!\n\n*Age:* Just a few months old, but getting smarter every day! 🧠✨`,
      footer: "TKT-CYBER AI - Born in Zimbabwe🇿🇼 , Growing Worldwide",
      buttons: [
        { buttonId: `${prefix}menu`, buttonText: { displayText: "MAIN MENU" }, type: 1 },
        { buttonId: `${prefix}aimenu`, buttonText: { displayText: "AI MENU" }, type: 1 },
        { buttonId: `${prefix}bowner`, buttonText: { displayText: "MEET DEVS OF ME" }, type: 1 }
      ],
      headerType: 1
    };
  }

  // Check for AI name queries
  if (lowerText.includes('what is your name') || lowerText.includes('what\'s your name') || 
      lowerText.includes('tell me your name') || lowerText.includes('your name') || 
      lowerText.includes('name?') || lowerText.includes('called?')) {
    
    return {
      text: `*🏷️ MY NAME*\n\n👋 Hello! My name is *TKT-CYBER-AI*\n\n*About My Name:*\n• Full Name: TKT-TECH AI\n• Short Name: Casey\n• You can call me: Tafadzwa, TKT-CYBER-AI, or just AI\n\n*Name Origin:*\nI'm named after my primary developer *TKT-Tech*, combining the personal touch of my creator with the intelligence of artificial intelligence technology.\n\n*Made in Zimbabwe* 🇿🇼 *by TKT-TECH🇿🇼*`,
      footer: "TKT-CYBER AI - That's Me! 😊",
      buttons: [
        { buttonId: `${prefix}aimenu`, buttonText: { displayText: "AI MENU" }, type: 1 },
        { buttonId: `${prefix}bowner`, buttonText: { displayText: "MEET MY DEVS" }, type: 1 },
        { buttonId: `${prefix}menu`, buttonText: { displayText: "MAIN MENU" }, type: 1 }
      ],
      headerType: 1
    };
  }

  // Check for general info about TKT-CYBER-AI
  if (lowerText.includes('what are you') || lowerText.includes('tell me about yourself') || 
      lowerText.includes('who are you') || lowerText.includes('about casey')) {
    
    return {
      text: `👋 Hi! I'm *TKT-CYBER-AI*, your intelligent WhatsApp assistant developed by TKT-TECH in partnership with TECH-DEVS-INC.\n\n*What I Can Do:*\n• Answer questions on any topic\n• Help with problem-solving\n• Provide information and explanations\n• Assist with creative tasks\n• Engage in meaningful conversations\n\n*My Features:*\n✅ Advanced AI technology\n✅ Multi-language support\n✅ Fast response times\n✅ Reliable dual-API system\n✅ User-friendly interface\n\n*My Identity:*\n• Name: TKT-CYBER-AI\n• Origin: Zimbabwe 🇿🇼\n• Purpose: Making AI accessible and helpful\n\n*Proudly Zimbabwe:* 🇿🇼\nBuilt with passion in Zimbabwe, serving users worldwide with cutting-edge AI technology.\n\nHow can I assist you today?`,
      footer: "TKT-CYBER-AI - Your Intelligent WhatsApp Companion",
      buttons: [
        { buttonId: `${prefix}aimenu`, buttonText: { displayText: "AI MENU" }, type: 1 },
        { buttonId: `${prefix}bowner`, buttonText: { displayText: "MEET DEVS" }, type: 1 },
        { buttonId: `${prefix}menu`, buttonText: { displayText: "MAIN MENU" }, type: 1 }
      ],
      headerType: 1
    };
  }

  // Return null if no custom response matches
  return null;
};

// Handle owner command response
const handleOwnerResponse = (m, Matrix) => {
  const prefix = config.PREFIX;
  const body = m.body || '';
  const cmd = body.startsWith(prefix) ? body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  
  if (cmd === 'bowner') {
    const ownerInfo = {
      text: `*👨‍💻 DEVELOPMENT TEAM*\n\n🇿🇼 *Lead Developer:* TKT-TECH\n• Primary Owner & Creator\n• Location: Zimbabwe\n• Expertise: AI Integration, Bot Development\n• Vision: Making AI accessible to everyone\n\n🤖 *Technical Partner:* TKT-TECH\n• Backend Systems Specialist\n• API Management & Infrastructure\n• Ensures reliable service delivery\n\n*Our Collaboration:*\nThis powerful partnership combines TECH-DEVS-INC's innovative vision with TKT-TECH's technical expertise, delivering you a world-class AI experience right here from Zimbabwe.\n\n*Contact & Support:*\nFor technical support, feature requests, or collaboration inquiries, reach out through the support channels.\n\n*Made with ❤️ in Zimbabwe* 🇿🇼`,
      footer: "TKT-TECH🇿🇼 x TECH-DEVS-INC - Zimbabwean Innovation",
      buttons: [
        { buttonId: `${prefix}menu`, buttonText: { displayText: "MAIN MENU" }, type: 1 },
        { buttonId: `${prefix}owner`, buttonText: { displayText: "GET SUPPORT" }, type: 1 }
      ],
      headerType: 1
    };
    
    return Matrix.sendMessage(m.from, ownerInfo, { quoted: m });
  }
};

// Export both functions
export default casey;
export { handleOwnerResponse };
