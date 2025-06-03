#!/bin/bash

mkdir -p logs

# FIFO gerekiyorsa yine kur, belki başka servis kullanıyordur
rm -f /tmp/mc_input.fifo
mkfifo /tmp/mc_input.fifo

echo "🚀 Scriptler başlatılıyor..."

# Arka plan servislerini başlat
bash com.sh > logs/com.log 2>&1 & 
PID1=$!
echo "✅ com.sh COMMIT başlatıldı (PID: $PID1)"

bash pagekite.py 25565 minecraft:hadiplaymc.pagekite.me  > logs/serveo.log 2>&1 &
PID2=$!
echo "✅ serveo.sh başlatıldı (PID: $PID2)"

echo "🌀 Scriptler arka planda çalışıyor. Bu terminali kapatabilirsin."

# Scripti sonlandır
exit 0
