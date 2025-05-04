const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalBlock = goals.GoalBlock;
const GoalNear = goals.GoalNear;
const Vec3 = require('vec3');
require("./site.js")
// Bot ayarları


const botConfig = {
  host: 'oneydir.aternos.me',
  port: 25565,
  username: 'turkey',
  version: '1.20.1'
};

// Sandık koordinatı
const chestLocation = new Vec3(187, 64, -293);

// Bot oluşturma
let bot = mineflayer.createBot(botConfig);

// Pathfinder eklentisi
bot.loadPlugin(pathfinder);

// Bot giriş yaptığında çalışacak kod
bot.once('spawn', () => {
  console.log('Bot oyuna giriş yaptı!');
  
  // Hareket ayarları
  const defaultMove = new Movements(bot);
  defaultMove.canDig = true;
  defaultMove.allowSprinting = true;
  bot.pathfinder.setMovements(defaultMove);
  
  // Mesajları dinle
  bot.on('chat', handleChat);
});

// Bot'a gelen hata mesajları
bot.on('error', (err) => {
  console.error('Bot Error:', err);
  bot.quit();  // Bot'u durduruyor
  setTimeout(() => {
    bot = mineflayer.createBot(botConfig);
    bot.loadPlugin(pathfinder);
    bot.on('chat', handleChat);  // 5 saniye sonra tekrar bağlan
  }, 5000);
});

bot.on('kicked', (reason) => {
  console.log('Bot kicked:', reason);
  bot.quit();  // Bot'u durduruyor
  setTimeout(() => {
    bot = mineflayer.createBot(botConfig);
    bot.loadPlugin(pathfinder);
    bot.on('chat', handleChat);  // 5 saniye sonra tekrar bağlan
  }, 5000);
});

bot.on('end', () => {
  console.log('Bot bağlantısı kesildi');
  setTimeout(() => {
    bot = mineflayer.createBot(botConfig);
    bot.loadPlugin(pathfinder);
    bot.on('chat', handleChat);  // 5 saniye sonra tekrar bağlan
  }, 5000);
});


// Chat mesajlarını işle
function handleChat(username, message) {
  // Kendi mesajlarımızı görmezden gel
  if (username === bot.username) return;
  
  const command = message.toLowerCase().split(' ');
  
  // Komutları kontrol et
  if (command[0] === 'bot') {
    switch(command[1]) {
      case 'gel':
        comeToPlayer(username);
        break;
      case 'ağaç':
        const count = parseInt(command[2]) || 1;
        cutTrees(count);
        break;
      case 'maden':
        startMining();
        break;
      case 'sandık':
        goToChestAndDeposit();
        break;
      case 'uyu':
        sleep();
        break;
      case 'durum':
        reportStatus();
        break;
      case 'dur':
        stopMining();  // Madenciliği durdurma komutu
        break;
      default:
        bot.chat('Geçerli komutlar: gel, ağaç [sayı], maden, sandık, uyu, durum, duraklat');
    }
  }
}


// Oyuncuya gel
async function comeToPlayer(username) {
  const player = bot.players[username];
  
  if (!player || !player.entity) {
    bot.chat('Seni göremiyorum!');
    return;
  }
  
  bot.chat('Sana geliyorum!');
  
  const playerPosition = player.entity.position;
  bot.pathfinder.setGoal(new GoalNear(playerPosition.x, playerPosition.y, playerPosition.z, 2));
}

// Ağaç kesme fonksiyonu
async function cutTrees(count) {
  bot.chat(`${count} ağaç kesmeye başlıyorum...`);
  
  // Baltayı kontrol et
  const axe = findAxe();
  if (!axe) {
    bot.chat('Envanterimde balta bulamadım!');
    return;
  }
  
  let treesCut = 0;
  
  while (treesCut < count) {
    // En yakın ağaç kütüğünü bul
    const logs = findLogs(30);
    
    if (!logs || logs.length === 0) {
      bot.chat('Yakında ağaç bulamadım!');
      break;
    }
    
    // En yakın ağaca git
    const log = logs[0];
    bot.chat(`Ağaç buldum: ${log.position.toString()}`);
    
    try {
      // Ağaca yaklaş
      const goal = new GoalBlock(log.position.x, log.position.y, log.position.z + 1);
      await bot.pathfinder.goto(goal);
      
      // Baltayı seç
      await bot.equip(axe, 'hand');
      
      // Ağacı kes
      await harvestTree(log);
      
      treesCut++;
      bot.chat(`${treesCut} ağaç kesildi. ${count - treesCut} tane daha kesebilirim.`);
      
    } catch (err) {
      bot.chat(`Ağaç kesme hatası: ${err.message}`);
      console.error('Ağaç kesme hatası:', err);
      
      // Eğer GoalChanged hatası alınırsa, yolu yeniden dene
      if (err.message.includes('GoalChanged')) {
        bot.chat('Yol hedefi değişti, tekrar deniyorum...');
        continue; // Hedefi tekrar dene
      }
      
      // Eğer yolu ulaşılamaz ise blok koy
      if (err.message.includes('path') || err.message.includes('goal')) {
        tryPlacingBlock(log.position);
      }
    }
  }
  
  bot.chat('Ağaç kesme işlemi tamamlandı!');
}


// Tüm ağacı kes
async function harvestTree(log) {
  const treeBlocks = [];
  const checkedBlocks = new Set();
  
  // Başlangıç kütüğünü ekle
  treeBlocks.push(log);
  
  // Ağacın tüm bloklarını bul (kütük ve yapraklar)
  for (let i = 0; i < treeBlocks.length; i++) {
    const block = treeBlocks[i];
    const blockPos = block.position;
    const posKey = `${blockPos.x},${blockPos.y},${blockPos.z}`;
    
    if (checkedBlocks.has(posKey)) continue;
    checkedBlocks.add(posKey);
    
    // Etraftaki ahşap ve yaprakları kontrol et
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = 0; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const neighbor = bot.blockAt(blockPos.offset(dx, dy, dz));
          if (!neighbor) continue;
          
          const neighborKey = `${neighbor.position.x},${neighbor.position.y},${neighbor.position.z}`;
          if (checkedBlocks.has(neighborKey)) continue;
          
          // Ahşap veya yaprak ise ekle
          if (neighbor.name.includes('log') || neighbor.name.includes('wood')) {
            treeBlocks.push(neighbor);
          }
        }
      }
    }
  }
  
  // Önce kütükleri kes, aşağıdan yukarıya doğru
  treeBlocks.sort((a, b) => a.position.y - b.position.y);
  
  for (const block of treeBlocks) {
    try {
      await bot.dig(block);
      await bot.waitForTicks(5); // Biraz bekle
    } catch (err) {
      console.error('Blok kesme hatası:', err);
    }
  }
}

// Çevredeki ağaç kütüklerini bul
function findLogs(radius) {
  const logs = Object.values(bot.findBlocks({
    matching: block => {
      return block.name.includes('log') || block.name.includes('wood');
    },
    maxDistance: radius,
    count: 10
  }));
  
  if (logs.length === 0) return null;
  
  // Blok nesnelerini al ve mesafeye göre sırala
  const logBlocks = logs.map(pos => bot.blockAt(pos))
    .sort((a, b) => {
      const distA = bot.entity.position.distanceTo(a.position);
      const distB = bot.entity.position.distanceTo(b.position);
      return distA - distB;
    });
  
  return logBlocks;
}

// Envanterde balta bul
function findAxe() {
  return bot.inventory.items().find(item => 
    item.name.includes('axe')
  );
}

// Envanterde kazma bul
function findPickaxe() {
  return bot.inventory.items().find(item => 
    item.name.includes('pickaxe')
  );
}

// Ulaşılamayan yerlere blok koyma
async function tryPlacingBlock(targetPos) {
  // Etrafında durabileceğimiz bir yer bul
  const offsets = [
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: -1 }
  ];
  
  for (const offset of offsets) {
    const placePos = targetPos.offset(offset.x, offset.y, offset.z);
    const standPos = placePos.offset(offset.x, offset.y, offset.z);
    
    try {
      // Durabileceğimiz yere git
      await bot.pathfinder.goto(new GoalBlock(standPos.x, standPos.y, standPos.z));
      
      // Blok bulma
      const blocks = bot.inventory.items().filter(item => 
        item.name.includes('dirt') || 
        item.name.includes('cobblestone') || 
        item.name.includes('stone')
      );
      
      if (blocks.length === 0) {
        bot.chat('Blok koymak için uygun malzeme bulamadım!');
        return;
      }
      
      // Blok seç
      await bot.equip(blocks[0], 'hand');
      
      // Blok koy
      const blockRef = bot.blockAt(placePos.offset(-offset.x, -offset.y, -offset.z));
      await bot.placeBlock(blockRef, new Vec3(offset.x, offset.y, offset.z));
      bot.chat('Ulaşmak için blok koydum');
      
      return true;
    } catch (err) {
      console.error('Blok koyma hatası:', err);
    }
  }
  
  bot.chat('Blok koymaya uygun pozisyon bulamadım!');
  return false;
}

// Madencilik yapma
let miningActive = false;  // Madenciliğin aktif olup olmadığını kontrol etmek için

async function startMining() {
  if (miningActive) {
    bot.chat('Madencilik zaten devam ediyor.');
    return;
  }

  miningActive = true;
  
  const pickaxe = findPickaxe();
  if (!pickaxe) {
    bot.chat('Envanterimde kazma bulamadım!');
    miningActive = false;
    return;
  }

  bot.chat('Madencilik yapmaya başlıyorum...');
  
  const playerPos = bot.entity.position.floored();
  
  // Daha geniş bir madencilik alanı ve daha derin bir madencilik
  const valuableBlocks = ['diamond_ore', 'gold_ore', 'iron_ore',  'emerald_ore'];
  
  try {
    // Kazma seç
    await bot.equip(pickaxe, 'hand');
    
    
    // Derinlere in ve değerli madenleri ara
    for (let y = -5; y >= -50; y--) {  // Daha derin bir madencilik
      for (let x = -10; x <= 10; x++) {  // Daha geniş bir alan
        for (let z = -10; z <= 10; z++) {  // Daha geniş bir alan
          if (!miningActive) return;  // Madencilik durdurulmuşsa işlemi sonlandır

          const block = bot.blockAt(playerPos.offset(x, y, z));
          if (!block) continue;

          if (valuableBlocks.some(name => block.name.includes(name))) {
            bot.chat(`${block.name} buldum!`);
            await bot.pathfinder.goto(new GoalNear(block.position.x, block.position.y, block.position.z, 2));
            await bot.equip(pickaxe, 'hand');
            await bot.dig(block);
            
            // Yeni madenler bulana kadar çevresindeki madenleri kaz
            let stack = [block];
            let visited = new Set();

            while (stack.length > 0) {
              const currentBlock = stack.pop();
              visited.add(currentBlock.position.toString());  // Ziyaret edilen bloğu işaretle

              // Yanındaki madenleri kontrol et
              for (let offsetX = -1; offsetX <= 1; offsetX++) {
                for (let offsetY = -1; offsetY <= 1; offsetY++) {
                  for (let offsetZ = -1; offsetZ <= 1; offsetZ++) {
                    if (offsetX === 0 && offsetY === 0 && offsetZ === 0) continue;  // Aynı bloğu tekrar kazma

                    const adjacentBlock = bot.blockAt(currentBlock.position.offset(offsetX, offsetY, offsetZ));
                    if (adjacentBlock && valuableBlocks.some(name => adjacentBlock.name.includes(name)) && !visited.has(adjacentBlock.position.toString())) {
                      bot.chat(`${adjacentBlock.name} yanındaki maden!`);
                      await bot.pathfinder.goto(new GoalNear(adjacentBlock.position.x, adjacentBlock.position.y, adjacentBlock.position.z, 2));
                      await bot.dig(adjacentBlock);
                      stack.push(adjacentBlock);  // Yeni bulunan madenleri sıraya ekle
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    bot.chat('Madencilik tamamlandı!');
  } catch (err) {
    bot.chat(`Madencilik hatası: ${err.message}`);
    console.error('Madencilik hatası:', err);
  } finally {
    miningActive = false;
  }
}



// Madenciliği durdurma fonksiyonu
function stopMining() {
  if (!miningActive) {
    bot.chat('Madencilik zaten durdurulmuş durumda.');
    return;
  }

  miningActive = false;
  bot.chat('Madencilik durduruldu.');
}


let isRunnin = false;

// Sandığa git ve eşyaları bırak
async function goToChestAndDeposit() {
  if (isRunnin) {
    bot.chat('Zaten bir işlem yapıyorum, lütfen bekleyin!');
    return;
  }

  isRunnin = true;
  bot.chat('Sandığa gidiyorum...');
  
  try {
    // Sandığa git
    await bot.pathfinder.goto(new GoalNear(chestLocation.x, chestLocation.y, chestLocation.z, 2));
    
    // Sandığı bul
    const chest = bot.findBlock({
      matching: block => block.name.includes('chest'),
      maxDistance: 3
    });
    
    if (!chest) {
      bot.chat('Yakında sandık bulamadım!');
      isRunnin = false;
      return;
    }
    
    // Sandığı aç
    const chestWindow = await bot.openChest(chest);
    
    // Odun ve madenleri bırak
    const itemsToDrop = bot.inventory.items().filter(item => 
      (item.name.includes('log') || 
       item.name.includes('wood') ||
       item.name.includes('ore') ||
       item.name.includes('diamond') ||
       item.name.includes('gold') ||
       item.name.includes('iron') ||
       item.name.includes('coal') ||
       item.name.includes('redstone') ||
       item.name.includes('lapis') ||
       item.name.includes('emerald') ||
       item.name.includes('copper')) &&
      !item.name.includes('axe') && // Baltaları dışla
      !item.name.includes('pickaxe') // Kazmaları dışla
    );
    
    for (const item of itemsToDrop) {
      if (!isRunnin) {
        bot.chat('İşlem durduruldu!');
        await chestWindow.close();
        return;
      }
      await chestWindow.deposit(item.type, null, item.count);
      await bot.waitForTicks(5);
    }
    
    // Sandığı kapat
    await chestWindow.close();
    bot.chat('Eşyaları sandığa bıraktım!');
  } catch (err) {
    bot.chat(`Sandık hatası: ${err.message}`);
    console.error('Sandık hatası:', err);
  }

  isRunnin = false;
}

// Durma komutunu al
bot.on('chat', (username, message) => {
  if (message.toLowerCase() === 'dur' && username === bot.username) {
    isRunnin = false;
    bot.chat('İşlem durduruldu!');
  }
});


// Uyuma fonksiyonu
function sleep() {
  bot.chat('16 saniye sonra tekrar gireceğim, iyi geceler!');
  
  setTimeout(() => {
    bot.quit('Uyku modu');
    
    // 16 saniye sonra tekrar bağlan
    
  }, 1000);
}

// Bot durumunu raporla
function reportStatus() {
  const health = bot.health || 0;
  const food = bot.food || 0;
  const items = bot.inventory.items().length;
  const position = bot.entity.position;
  
  bot.chat(`Durum: Can: ${health}, Açlık: ${food}, Eşya sayısı: ${items}, Konum: ${position.toString()}`);
}