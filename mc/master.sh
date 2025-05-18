#!/bin/bash

# Log klasörü kontrolü
mkdir -p logs

echo "🚀 Scriptler başlatılıyor..."

# Scriptleri başlat ve PID’lerini al
bash com.sh > logs/com.log 2>&1 & 
PID1=$!
echo "✅ com.sh COMMIT başlatıldı (PID: $PID1)"

bash start.sh > logs/baslat.log 2>&1 &
PID2=$!
echo "✅ start.sh MC başlatıldı (PID: $PID2)"

bash serveo.sh tcp 25565 3541 > logs/serveo.log 2>&1 &
PID3=$!
echo "✅ serveo.sh başlatıldı (PID: $PID3)"

# Tüm scriptler bitene kadar bekle
wait $PID1
echo "🛑 com.sh tamamlandı"

wait $PID2
echo "🛑 baslat.sh tamamlandı"

wait $PID3
echo "🛑 serveo.sh tamamlandı"

echo "🎉 Tüm scriptler bitti!"
