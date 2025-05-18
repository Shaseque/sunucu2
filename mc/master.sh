#!/bin/bash

mkdir -p logs

echo "🚀 Scriptler başlatılıyor..."

# PID'leri saklayalım
bash com.sh > logs/com.log 2>&1 & 
PID1=$!
echo "✅ com.sh COMMIT başlatıldı (PID: $PID1)"

bash start.sh > logs/baslat.log 2>&1 &
PID2=$!
echo "✅ start.sh MC başlatıldı (PID: $PID2)"

bash serveo.sh tcp 25565 3541 > logs/serveo.log 2>&1 &
PID3=$!
echo "✅ serveo.sh başlatıldı (PID: $PID3)"

# CTRL+C'yi yakala
trap 'echo "🧨 CTRL+C yakalandı! Düzgünce kapatılıyor..."

# com.sh ve serveo.sh direkt öldür
kill $PID1 2>/dev/null
kill $PID3 2>/dev/null
echo "🔪 com.sh ve serveo.sh öldürüldü"

# Oyunculara mesaj gönder
echo "say [SERVER] Sunucu 20 saniye içinde kapanacak. Veriler kaydediliyor!" > /tmp/mc_input.fifo
sleep 2

# Tüm oyuncuları at
echo "kick @a Sunucu kapanıyor. 20 saniye içinde tekrar giriş yapmayın." > /tmp/mc_input.fifo
echo "👢 Oyuncular atıldı"

# save-all gönder
echo "save-all" > /tmp/mc_input.fifo
echo "📝 save-all gönderildi, 20 sn bekleniyor..."
sleep 20

# stop komutu gönder
echo "stop" > /tmp/mc_input.fifo
echo "🛑 stop komutu gönderildi, MC kapanıyor..."

wait $PID2
echo "✅ Minecraft kapandı"

exit 0
' SIGINT

# Minecraft için input FIFO dosyası hazırla
rm -f /tmp/mc_input.fifo
mkfifo /tmp/mc_input.fifo

# Bekle
wait $PID1
echo "🛑 com.sh tamamlandı"

wait $PID2
echo "🛑 baslat.sh tamamlandı"

wait $PID3
echo "🛑 serveo.sh tamamlandı"

echo "🎉 Tüm scriptler bitti!"
