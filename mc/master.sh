#!/bin/bash

mkdir -p logs

rm -f /tmp/mc_input.fifo
mkfifo /tmp/mc_input.fifo

echo "🚀 Scriptler başlatılıyor..."

bash com.sh > logs/com.log 2>&1 &
PID1=$!
echo "✅ com.sh COMMIT başlatıldı (PID: $PID1)"

playit > logs/playit.log 2>&1 &
PID2=$!
echo "✅ playit başlatıldı (PID: $PID2)"

echo "🌀 Scriptler arka planda çalışıyor. Bu terminali kapatabilirsin."

exit 0

