
require("./site.js");
let bot,
    miningActive = !1,
    isRunning = !1;
const botConfig = { host: "oneydir.aternos.me", port: 25565, username: "turkey", version: "1.20.1" },
    chestLocation = new Vec3(187, 64, -293),
    valuableBlocks = ["diamond_ore", "gold_ore", "iron_ore", "emerald_ore", "copper_ore", "redstone_ore", "lapis_ore", "coal_ore"],
    reconnectBot = () => {
        bot && bot.quit(),
            setTimeout(() => {
                createBot();
            }, 5e3);
    };
function createBot() {
    (bot = mineflayer.createBot(botConfig)),
        bot.loadPlugin(pathfinder),
        bot.once("spawn", () => {
            console.log("Bot oyuna giriş yaptı!");
            const e = new Movements(bot);
            (e.canDig = !0), (e.allowSprinting = !0), (e.allowParkour = !0), (e.canDig = !0), bot.pathfinder.setMovements(e), bot.on("chat", handleChat);
        }),
        bot.on("error", (e) => {
            console.error("Bot Error:", e), reconnectBot();
        }),
        bot.on("kicked", (e) => {
            console.log("Bot kicked:", e), reconnectBot();
        }),
        bot.on("end", () => {
            console.log("Bot bağlantısı kesildi"), reconnectBot();
        });
}
function handleChat(e, t) {
    if (e === bot.username) return;
    const o = t.toLowerCase().split(" ");
    if ("bot" === o[0])
        switch (o[1]) {
            case "gel":
                comeToPlayer(e);
                break;
            case "ağaç":
                const t = parseInt(o[2]) || 1;
                cutTrees(t);
                break;
            case "maden":
                startMining();
                break;
            case "sandık":
                goToChestAndDeposit();
                break;
            case "uyu":
                sleep();
                break;
            case "durum":
                reportStatus();
                break;
            case "dur":
                stopCurrentOperations();
                break;
            default:
                bot.chat("Geçerli komutlar: gel, ağaç [sayı], maden, sandık, uyu, durum, dur");
        }
}
async function comeToPlayer(e) {
    const t = bot.players[e];
    if (!t || !t.entity) return void bot.chat("Seni göremiyorum!");
    bot.chat("Sana geliyorum!");
    const o = t.entity.position;
    bot.pathfinder.setGoal(new GoalNear(o.x, o.y, o.z, 2));
}
function findItem(e) {
    return bot.inventory.items().find((t) => t.name.includes(e));
}
async function cutTrees(e) {
    if (isRunning) return void bot.chat("Zaten bir işlem yapıyorum!");
    (isRunning = !0), bot.chat(`${e} ağaç kesmeye başlıyorum...`);
    const t = findItem("axe");
    if (!t) return bot.chat("Envanterimde balta bulamadım!"), void (isRunning = !1);
    let o = 0;
    for (; o < e && isRunning; ) {
        const a = findLogs(30);
        if (!a || 0 === a.length) {
            bot.chat("Yakında ağaç bulamadım!");
            break;
        }
        const i = a[0];
        bot.chat(`Ağaç buldum: ${i.position.toString()}`);
        try {
            await bot.pathfinder.goto(new GoalBlock(i.position.x, i.position.y, i.position.z + 1)), await bot.equip(t, "hand"), await harvestTree(i), o++, bot.chat(`${o} ağaç kesildi. ${e - o} tane daha kesebilirim.`);
        } catch (e) {
            if ((bot.chat(`Ağaç kesme hatası: ${e.message}`), console.error("Ağaç kesme hatası:", e), e.message.includes("GoalChanged"))) continue;
            (e.message.includes("path") || e.message.includes("goal")) && tryPlacingBlock(i.position);
        }
    }
    bot.chat("Ağaç kesme işlemi tamamlandı!"), (isRunning = !1);
}
async function harvestTree(e) {
    const t = [],
        o = new Set();
    for (t.push(e), i = 0; i < t.length; i++) {
        const e = t[i],
            a = e.position,
            n = `${a.x},${a.y},${a.z}`;
        if (!o.has(n))
            for (o.add(n), r = -1; r <= 1; r++)
                for (s = 0; s <= 1; s++)
                    for (c = -1; c <= 1; c++) {
                        const i = bot.blockAt(a.offset(r, s, c));
                        if (!i) continue;
                        const e = `${i.position.x},${i.position.y},${i.position.z}`;
                        o.has(e) || ((i.name.includes("log") || i.name.includes("wood")) && t.push(i));
                    }
    }
    t.sort((e, t) => e.position.y - t.position.y);
    for (const e of t)
        try {
            await bot.dig(e), await bot.waitForTicks(2);
        } catch (t) {
            console.error("Blok kesme hatası:", t);
        }
}
function findLogs(e) {
    const t = Object.values(bot.findBlocks({ matching: (e) => e.name.includes("log") || e.name.includes("wood"), maxDistance: e, count: 10 }));
    return 0 === t.length
        ? null
        : t
              .map((e) => bot.blockAt(e))
              .sort((e, t) => {
                  return bot.entity.position.distanceTo(e.position) - bot.entity.position.distanceTo(t.position);
              });
}
async function tryPlacingBlock(e) {
    const t = [
        { x: 1, y: 0, z: 0 },
        { x: -1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 0, z: -1 },
    ];
    for (const o of t) {
        const t = e.offset(o.x, o.y, o.z),
            a = t.offset(o.x, o.y, o.z);
        try {
            await bot.pathfinder.goto(new GoalBlock(a.x, a.y, a.z));
            const e = bot.inventory.items().filter((e) => e.name.includes("dirt") || e.name.includes("cobblestone") || e.name.includes("stone"));
            if (0 === e.length) return bot.chat("Blok koymak için uygun malzeme bulamadım!"), !1;
            await bot.equip(e[0], "hand");
            const i = bot.blockAt(t.offset(-o.x, -o.y, -o.z));
            return await bot.placeBlock(i, new Vec3(o.x, o.y, o.z)), bot.chat("Ulaşmak için blok koydum"), !0;
        } catch (e) {
            console.error("Blok koyma hatası:", e);
        }
    }
    return bot.chat("Blok koymaya uygun pozisyon bulamadım!"), !1;
}
async function startMining() {
    if (isRunning) return void bot.chat("Zaten bir işlem yapıyorum!");
    if (miningActive) return void bot.chat("Madencilik zaten devam ediyor.");
    (miningActive = !0), (isRunning = !0);
    const e = findItem("pickaxe");
    if (!e) return bot.chat("Envanterimde kazma bulamadım!"), (miningActive = !1), void (isRunning = !1);
    bot.chat("Madencilik yapmaya başlıyorum...");
    const t = bot.entity.position.floored();
    try {
        await bot.equip(e, "hand");
        for (let o = -5; o >= -60 && miningActive; o--)
            for (let a = -10; a <= 10 && miningActive; a++)
                for (let i = -10; i <= 10 && miningActive; i++) {
                    if (!miningActive) return;
                    const n = bot.blockAt(t.offset(a, o, i));
                    if (!n) continue;
                    if (valuableBlocks.some((e) => n.name.includes(e))) {
                        bot.chat(`${n.name} buldum!`), await bot.pathfinder.goto(new GoalNear(n.position.x, n.position.y, n.position.z, 2)), await bot.equip(e, "hand"), await bot.dig(n);
                        let t = [n],
                            o = new Set();
                        for (; t.length > 0; ) {
                            const a = t.pop();
                            o.add(a.position.toString());
                            for (let i = -1; i <= 1; i++)
                                for (let r = -1; r <= 1; r++)
                                    for (let s = -1; s <= 1; s++)
                                        if (0 !== i || 0 !== r || 0 !== s) {
                                            const c = bot.blockAt(a.position.offset(i, r, s));
                                            c &&
                                                valuableBlocks.some((e) => c.name.includes(e)) &&
                                                !o.has(c.position.toString()) &&
                                                (bot.chat(`${c.name} yanındaki maden!`), await bot.pathfinder.goto(new GoalNear(c.position.x, c.position.y, c.position.z, 2)), await bot.equip(e, "hand"), await bot.dig(c), t.push(c));
                                        }
                        }
                    }
                }
        bot.chat("Madencilik tamamlandı!");
    } catch (e) {
        bot.chat(`Madencilik hatası: ${e.message}`), console.error("Madencilik hatası:", e);
    } finally {
        (miningActive = !1), (isRunning = !1);
    }
}
function stopCurrentOperations() {
    (miningActive = !1), (isRunning = !1), bot.pathfinder.setGoal(null), bot.chat("Tüm işlemler durduruldu.");
}
async function goToChestAndDeposit() {
    if (isRunning) return void bot.chat("Zaten bir işlem yapıyorum, lütfen bekleyin!");
    (isRunning = !0), bot.chat("Sandığa gidiyorum...");
    try {
        await bot.pathfinder.goto(new GoalNear(chestLocation.x, chestLocation.y, chestLocation.z, 2));
        const e = bot.findBlock({ matching: (e) => e.name.includes("chest"), maxDistance: 3 });
        if (!e) return bot.chat("Yakında sandık bulamadım!"), void (isRunning = !1);
        const t = await bot.openChest(e),
            o = bot.inventory
                .items()
                .filter(
                    (e) =>
                        (e.name.includes("log") ||
                            e.name.includes("wood") ||
                            e.name.includes("ore") ||
                            e.name.includes("diamond") ||
                            e.name.includes("gold") ||
                            e.name.includes("iron") ||
                            e.name.includes("coal") ||
                            e.name.includes("redstone") ||
                            e.name.includes("lapis") ||
                            e.name.includes("emerald") ||
                            e.name.includes("copper")) &&
                        !e.name.includes("axe") &&
                        !e.name.includes("pickaxe")
                );
        for (const e of o) {
            if (!isRunning) return bot.chat("İşlem durduruldu!"), void (await t.close());
            await t.deposit(e.type, null, e.count), await bot.waitForTicks(2);
        }
        await t.close(), bot.chat("Eşyaları sandığa bıraktım!");
    } catch (e) {
        bot.chat(`Sandık hatası: ${e.message}`), console.error("Sandık hatası:", e);
    }
    isRunning = !1;
}
function sleep() {
    bot.chat("16 saniye sonra tekrar gireceğim, iyi geceler!"),
        setTimeout(() => {
            bot.quit("Uyku modu");
        }, 1e3);
}
function reportStatus() {
    const e = bot.health || 0,
        t = bot.food || 0,
        o = bot.inventory.items().length,
        a = bot.entity.position;
    bot.chat(`Durum: Can: ${e}, Açlık: ${t}, Eşya sayısı: ${o}, Konum: ${a.toString()}`);
}
createBot();
