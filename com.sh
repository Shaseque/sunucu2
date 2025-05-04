#!/bin/bash

# Türkiye saati: UTC+3
TR_DATE=$(date -u -d '+3 hours' '+%d.%m.%Y %H:%M:%S')

while true; do
  if [[ -n $(git status --porcelain) ]]; then
    git add .
    git commit -m "🔄 Otomatik commit: $TR_DATE"
    git pull origin main --rebase
    git push origin main
    echo "✅ [$TR_DATE] Değişiklikler commitlendi ve pushlandı."
  else
    echo "💤 [$TR_DATE] Hiçbir değişiklik yok, commit atılmadı."
  fi

  # 4 dakika bekle
  sleep 240
done
