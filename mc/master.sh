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

cloudflared tunnel run --token eyJhIjoiNTdiZjg3Y2NhOWUwYmY4MDBmMDZlMmNlNmVjZjExYjMiLCJ0IjoiMzczZTM3MTctMzM0OC00ZWMwLTk0ZTUtOTU2NGU5NGMzMmJhIiwicyI6Ill6QTRNVEJqT1dJdFpHRXpZaTAwTURsbExXRmxOR1V0TURneE5qVmtNVE00TXpWaiJ9 > logs/cloudflared.log 2>&1 &
PID3=$!
echo "✅ cloudflared başlatıldı (PID: $PID3)"

echo "🌀 Tüm scriptler arka planda çalışıyor. Bu terminali kapatabilirsin."

exit 0

