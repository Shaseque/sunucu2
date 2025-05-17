const mineflayer = require('mineflayer');
const readline = require('readline');
const { SocksClient } = require('socks');

// Default configuration
const defaultConfig = {
  serverHost: 'serveo.net',
  serverPort: 3541,
  botUsername: 'mertali',
  mcVersion: '1.20.1',
  password: '312312',
  useProxy: false,
  proxyHost: '',
  proxyPort: 0
};

let config = { ...defaultConfig };
let hareketActive = false;
let hareketInterval = null;
let direction = true;
let bot = null;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function displayMenu() {
  console.log('\n=== Minecraft Bot Configuration ===');
  console.log('1. Use default settings');
  console.log('2. Customize settings');
  console.log('3. Use proxy');
  console.log('4. Exit');
  
  rl.question('Select an option (1-4): ', (answer) => {
    switch(answer) {
      case '1':
        connectBot(false);
        break;
      case '2':
        customizeSettings();
        break;
      case '3':
        setupProxy();
        break;
      case '4':
        console.log('Exiting program...');
        rl.close();
        process.exit(0);
        break;
      default:
        console.log('Invalid option. Please try again.');
        displayMenu();
    }
  });
}

function customizeSettings() {
  rl.question(`Server address (default: ${defaultConfig.serverHost}): `, (serverHost) => {
    config.serverHost = serverHost.trim() || defaultConfig.serverHost;
    
    rl.question(`Server port (default: ${defaultConfig.serverPort}): `, (serverPort) => {
      config.serverPort = parseInt(serverPort) || defaultConfig.serverPort;
      
      rl.question(`Bot username (default: ${defaultConfig.botUsername}): `, (username) => {
        config.botUsername = username.trim() || defaultConfig.botUsername;
        
        rl.question(`Minecraft version (default: ${defaultConfig.mcVersion}): `, (version) => {
          config.mcVersion = version.trim() || defaultConfig.mcVersion;
          
          rl.question(`Password (default: ${defaultConfig.password}): `, (password) => {
            config.password = password.trim() || defaultConfig.password;
            
            console.log('\nConfiguration summary:');
            console.log(`Server: ${config.serverHost}:${config.serverPort}`);
            console.log(`Username: ${config.botUsername}`);
            console.log(`Version: ${config.mcVersion}`);
            
            rl.question('Connect now? (y/n): ', (confirm) => {
              if (confirm.toLowerCase() === 'y') {
                connectBot(false);
              } else {
                displayMenu();
              }
            });
          });
        });
      });
    });
  });
}

function setupProxy() {
  config.useProxy = true;
  
  rl.question('Proxy host: ', (proxyHost) => {
    config.proxyHost = proxyHost.trim();
    
    rl.question('Proxy port: ', (proxyPort) => {
      config.proxyPort = parseInt(proxyPort);
      
      if (!config.proxyHost || !config.proxyPort) {
        console.log('Invalid proxy settings. Please try again.');
        setupProxy();
        return;
      }
      
      customizeSettings();
    });
  });
}

function connectBot(reconnect) {
  if (reconnect && bot) {
    bot.end();
    bot = null;
  }

  console.log(`\nConnecting to ${config.serverHost}:${config.serverPort} as ${config.botUsername}...`);
  
  const connectWithBot = (socket = null) => {
    const botOptions = {
  username: config.botUsername,
  host: config.serverHost,
  port: config.serverPort,
  version: '1.20.1',  // İşte burada sürümü belirtirsin
  auth: 'offline'     // Offline modda giriş için
};

    
    if (socket) {
      botOptions.socket = socket;
    }
    
    try {
      console.log('Creating bot with options:', JSON.stringify(botOptions));
      bot = mineflayer.createBot(botOptions);
      setupBotEvents();
    } catch (err) {
      console.error('Error creating bot:', err);
      displayMenu();
    }
  };
  
  if (config.useProxy && config.proxyHost && config.proxyPort) {
    console.log(`Using proxy: ${config.proxyHost}:${config.proxyPort}`);
    
    SocksClient.createConnection({
      proxy: { host: config.proxyHost, port: config.proxyPort, type: 5 },
      command: 'connect',
      destination: { host: config.serverHost, port: config.serverPort }
    }).then(({ socket }) => {
      console.log('✅ Proxy connection successful, starting bot...');
      connectWithBot(socket);
    }).catch(err => {
      console.error('❌ Proxy connection failed:', err);
      displayMenu();
    });
  } else {
    connectWithBot();
  }
}

function setupBotEvents() {
  // Add error handling for the bot spawn event
bot.once('spawn', () => {
    console.log('Bot connected to the game!');
    console.log('Will login in 2 seconds...');

    setTimeout(() => {
      bot.chat(`/login ${config.password}`);
      console.log(`Login command sent: "/login ${config.password}"`);

      console.log('Will try compass interaction in 16 seconds...');
      setTimeout(() => {
        console.log('Attempting compass interaction now...');
        compassInteraction();
      }, 16000);
    }, 2000);
  });

  bot.on('message', (message) => {
    const msg = message.toString().trim();
    console.log(`[Chat] ${msg}`);
    if (msg.includes('lobi 1') || msg.includes('lobi1') ||
        msg.includes('lobi 2') || msg.includes('lobi2') ||
        msg.includes('lobi 3') || msg.includes('lobi3')) {
      handleLobbyChange();
    }
  });

  // Add window update event
  bot.on('windowOpen', (window) => {
    console.log(`Window opened: ${window.title || 'Untitled'} - Type: ${window.type}`);
    console.log(`Window contains ${window.slots.filter(s => s != null).length} items`);
  });
  
  bot.on('windowClose', () => {
    console.log('Window closed');
  });

  bot.on('error', (err) => console.error('Connection error:', err));
  
  bot.on('kicked', (reason) => {
    console.log('Kicked from server:', reason);
    if (hareketInterval) clearInterval(hareketInterval);
    promptReconnect();
  });
  
  bot.on('end', () => {
    console.log('Server connection closed.');
    if (hareketInterval) clearInterval(hareketInterval);
    promptReconnect();
  });

  promptInput();
}

function promptReconnect() {
  rl.question('Do you want to reconnect? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      connectBot(true);
    } else {
      displayMenu();
    }
  });
}

function compassInteraction() {
  try {
    if (!bot) {
      console.log('Bot is not connected!');
      return;
    }

    if (!bot.inventory) {
      console.log('Inventory not available yet, waiting...');
      setTimeout(compassInteraction, 2000);
      return;
    }

    console.log('Starting compass interaction...');
    
    // Find the compass item in inventory
    const compass = bot.inventory.items().find(item => item && item.name && item.name.includes('compass'));
    if (!compass) {
      console.log('Compass not found in inventory!');
      return;
    }

    bot.equip(compass, 'hand')
      .then(() => {
        console.log('Compass equipped, right-clicking...');
        bot.activateItem();

        setTimeout(() => {
          console.log('Checking for window...');
          if (bot.currentWindow) {
            console.log('Window found! Searching for chainmail chestplate...');
            const chainArmorSlot = bot.currentWindow.slots.findIndex(
              item => item && item.name && item.name.includes('chainmail_chestplate')
            );
            
            if (chainArmorSlot !== -1) {
              console.log(`Found chainmail at slot ${chainArmorSlot}, clicking...`);
              bot.clickWindow(chainArmorSlot, 0, 0)
                .then(() => console.log('Chainmail chestplate selected'))
                .catch(err => console.error('Error clicking window:', err));

              setTimeout(() => {
                const goldSword = bot.inventory.items().find(item => item && item.name && item.name.includes('golden_sword'));
                if (goldSword) {
                  bot.equip(goldSword, 'hand')
                    .then(() => console.log('Golden sword equipped'))
                    .catch(err => console.error('Failed to equip golden sword:', err));
                } else {
                  console.log('Golden sword not found!');
                }
              }, 3000);
            } else {
              console.log('Chainmail chestplate not found in the window!');
              console.log('Available slots:', bot.currentWindow.slots
                .filter(s => s && s.name)
                .map(s => s.name)
                .join(', '));
            }
          } else {
            console.log('No window is open after activating compass!');
          }
        }, 1000);
      })
      .catch(err => console.error('Failed to equip compass:', err));
  } catch (err) {
    console.error('Error in compass interaction:', err);
  }
}

function handleLobbyChange() {
  console.log('Lobby change detected! Performing compass interaction...');
  compassInteraction();
}

function promptInput() {
  rl.question('', (input) => {
    if (input.trim() !== '') handleCommand(input);
    promptInput();
  });
}

function handleCommand(input) {
  try {
    if (!bot) {
      console.log('Bot is not connected!');
      return;
    }

    if (input.startsWith('bot ')) {
      const botCommand = input.substring(4).toLowerCase();
      if (botCommand === 'hareket aktif') startMovement();
      else if (botCommand === 'hareket kapat') stopMovement();
      else if (botCommand === 'pusula') compassInteraction();
      else if (botCommand === 'durum') {
        console.log(`Bot status: ${bot.player ? 'Active' : 'Not connected'}`);
        console.log(`Movement status: ${hareketActive ? 'Active' : 'Inactive'}`);
      }
      else if (botCommand === 'disconnect') {
        bot.end();
        bot = null;
        displayMenu();
      }
      else if (botCommand === 'menu') {
        displayMenu();
      }
      else console.log('Unknown bot command.');
    } else {
      bot.chat(input);
    }
  } catch (err) {
    console.error('Error processing command:', err);
  }
}

function startMovement() {
  if (!bot) {
    console.log('Bot is not connected!');
    return;
  }
  
  if (!hareketActive) {
    hareketActive = true;
    console.log('Bot movement started! Will move forward/backward every 4 seconds.');
    hareketInterval = setInterval(() => {
      if (!bot || !bot.entity) {
        console.log('Bot disconnected, stopping movement');
        stopMovement();
        return;
      }
      
      if (direction) {
        bot.setControlState('forward', true);
        bot.setControlState('back', false);
      } else {
        bot.setControlState('forward', false);
        bot.setControlState('back', true);
      }
      setTimeout(() => {
        if (bot && bot.entity) {
          bot.setControlState('forward', false);
          bot.setControlState('back', false);
        }
        direction = !direction;
      }, 2000);
    }, 4000);
  } else console.log('Bot movement is already active!');
}

function stopMovement() {
  if (!bot) {
    console.log('Bot is not connected!');
    return;
  }
  
  if (hareketActive) {
    hareketActive = false;
    console.log('Bot movement stopped.');
    
    if (hareketInterval) {
      clearInterval(hareketInterval);
      hareketInterval = null;
    }
    
    if (bot && bot.entity) {
      bot.setControlState('forward', false);
      bot.setControlState('back', false);
    }
  } else console.log('Bot movement is already inactive!');
}

// Display help on startup
console.log('\n===== Minecraft Bot Commands =====');
console.log('bot hareket aktif - Start automatic movement');
console.log('bot hareket kapat - Stop automatic movement');
console.log('bot pusula - Perform compass interaction');
console.log('bot durum - Show bot status');
console.log('bot disconnect - Disconnect and return to menu');
console.log('bot menu - Show configuration menu');
console.log('Any other text will be sent as chat message');
console.log('================================\n');

// Start with the menu
displayMenu();