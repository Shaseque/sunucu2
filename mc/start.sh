#!/bin/bash

echo "Starting PaperMC Server with Codespaces Optimized Flags..."

# RAM ve CPU bilgilerini kontrol et
TOTAL_RAM=$(free -g | awk '/^Mem:/{print $2}')
CPU_CORES=$(nproc)
echo "Total System RAM: ${TOTAL_RAM}GB"
echo "Available CPU Cores: ${CPU_CORES}"

# Codespaces için optimize edilmiş ayarlar
java \
    -server \
    -Xms2G -Xmx13G \
    -XX:+UseG1GC \
    -XX:+ParallelRefProcEnabled \
    -XX:MaxGCPauseMillis=100 \
    -XX:+UnlockExperimentalVMOptions \
    -XX:+DisableExplicitGC \
    -XX:+AlwaysPreTouch \
    -XX:G1NewSizePercent=25 \
    -XX:G1MaxNewSizePercent=35 \
    -XX:G1HeapRegionSize=16M \
    -XX:G1ReservePercent=15 \
    -XX:G1HeapWastePercent=5 \
    -XX:G1MixedGCCountTarget=3 \
    -XX:InitiatingHeapOccupancyPercent=20 \
    -XX:G1MixedGCLiveThresholdPercent=85 \
    -XX:G1RSetUpdatingPauseTimePercent=5 \
    -XX:SurvivorRatio=16 \
    -XX:+PerfDisableSharedMem \
    -XX:MaxTenuringThreshold=2 \
    -XX:+UseStringDeduplication \
    -XX:+UseFastUnorderedTimeStamps \
    -XX:+OptimizeStringConcat \
    -XX:+UseCompressedOops \
    -XX:+UseCompressedClassPointers \
    -XX:ParallelGCThreads=4 \
    -XX:ConcGCThreads=2 \
    -XX:G1ConcRefinementThreads=4 \
    -XX:+UnlockDiagnosticVMOptions \
    -XX:+LogVMOutput \
    -Dfile.encoding=UTF-8 \
    -Duser.timezone=Europe/Istanbul \
    -Djava.security.egd=file:/dev/urandom \
    -Dusing.aikars.flags=true \
    -Dcom.mojang.eula.agree=true \
    -Dpaper.playerconnection.keepalive=30 \
    -Dpaper.use-display-name-in-quit-message=true \
    -Dpaper.watchdog-timeout=120 \
    -Dpaper.async-chunks.enable=true \
    -Dpaper.use-optimized-ticklist=true \
    -jar 31311.jar nogui

echo "Server stopped. Exit code: $?"