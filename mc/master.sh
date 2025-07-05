#!/bin/bash

mkdir -p logs

rm -f /tmp/mc_input.fifo
mkfifo /tmp/mc_input.fifo

echo "🚀 Scriptler başlatılıyor..."

bash com.sh > logs/com.log 2>&1 & 
PID1=$!
echo "✅ com.sh COMMIT başlatıldı (PID: $PID1)"

#cloudflared tunnel run --token eyJhIjoiNTdiZjg3Y2NhOWUwYmY4MDBmMDZlMmNlNmVjZjExYjMiLCJ0IjoiMzczZTM3MTctMzM0OC00ZWMwLTk0ZTUtOTU2NGU5NGMzMmJhIiwicyI6IllXWmtNell4TnpVdFptVXlOaTAwTUdJekxUaGlOekl0TnpJek1tUTJPV0ZoTVRKaCJ9 > logs/serveo.log 2>&1 & 
#PID2=$!
#echo "✅ DOMAIN başlatıldı (PID: $PID2)"

echo "🌀 Scriptler arka planda çalışıyor. Bu terminali kapatabilirsin."

exit 0
