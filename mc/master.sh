#!/bin/bash

# Log klasörü kontrolü
mkdir -p logs

echo "🚀 Scriptler başlatılıyor..."

# Scriptleri başlat ve PID’lerini al
bash com.sh > logs/com.log 2>&1 & 
PID1=$!
echo "✅ com.sh başlatıldı (PID: $PID1)"

bash baslat.sh > logs/baslat.log 2>&1 &
PID2=$!
echo "✅ baslat.sh başlatıldı (PID: $PID2)"

bash serveo.sh > logs/serveo.log 2>&1 &
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
