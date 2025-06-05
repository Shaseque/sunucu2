#!/bin/bash
echo "Starting PaperMC Server with Optimized Flags..."

# RAM miktarını kontrol et
TOTAL_RAM=$(free -g | awk '/^Mem:/{print $2}')
echo "Total System RAM: ${TOTAL_RAM}GB"

java \
  -server \
  -Xms4G -Xmx12G \
  -XX:+UseG1GC \
  -XX:+ParallelRefProcEnabled \
  -XX:MaxGCPauseMillis=200 \
  -XX:+UnlockExperimentalVMOptions \
  -XX:+DisableExplicitGC \
  -XX:+AlwaysPreTouch \
  -XX:G1NewSizePercent=30 \
  -XX:G1MaxNewSizePercent=40 \
  -XX:G1HeapRegionSize=8M \
  -XX:G1ReservePercent=20 \
  -XX:G1HeapWastePercent=5 \
  -XX:G1MixedGCCountTarget=4 \
  -XX:InitiatingHeapOccupancyPercent=15 \
  -XX:G1MixedGCLiveThresholdPercent=90 \
  -XX:G1RSetUpdatingPauseTimePercent=5 \
  -XX:SurvivorRatio=32 \
  -XX:+PerfDisableSharedMem \
  -XX:MaxTenuringThreshold=1 \
  -XX:+UseStringDeduplication \
  -XX:+UseFastUnorderedTimeStamps \
  -XX:+OptimizeStringConcat \
  -XX:+UseCompressedOops \
  -XX:+UseCompressedClassPointers \
  -XX:+UseLargePages \
  -XX:LargePageSizeInBytes=2M \
  -XX:+UnlockDiagnosticVMOptions \
  -XX:+LogVMOutput \
  -XX:+UseTransparentHugePages \
  -Dfile.encoding=UTF-8 \
  -Duser.timezone=Europe/Istanbul \
  -Djava.security.egd=file:/dev/urandom \
  -Dusing.aikars.flags=true \
  -Dcom.mojang.eula.agree=true \
  -Dpaper.playerconnection.keepalive=30 \
  -Dpaper.use-display-name-in-quit-message=true \
  -jar 31311.jar nogui

echo "Server stopped. Exit code: $?"