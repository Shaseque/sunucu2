#!/bin/bash
echo "Starting PaperMC Server with Optimized Flags..."

# RAM ve CPU miktarını kontrol et
TOTAL_RAM=$(free -g | awk '/^Mem:/{print $2}')
CPU_CORES=$(nproc)
echo "Total System RAM: ${TOTAL_RAM}GB"
echo "CPU Cores: ${CPU_CORES}"



java \
  -server \
  -Xms10G -Xmx11G \
  -XX:+UseG1GC \
  -XX:+ParallelRefProcEnabled \
  -XX:MaxGCPauseMillis=130 \
  -XX:+UnlockExperimentalVMOptions \
  -XX:+DisableExplicitGC \
  -XX:+AlwaysPreTouch \
  -XX:G1NewSizePercent=28 \
  -XX:G1MaxNewSizePercent=35 \
  -XX:G1HeapRegionSize=16M \
  -XX:G1ReservePercent=15 \
  -XX:G1HeapWastePercent=5 \
  -XX:G1MixedGCCountTarget=3 \
  -XX:InitiatingHeapOccupancyPercent=10 \
  -XX:G1MixedGCLiveThresholdPercent=85 \
  -XX:G1RSetUpdatingPauseTimePercent=3 \
  -XX:SurvivorRatio=32 \
  -XX:+PerfDisableSharedMem \
  -XX:MaxTenuringThreshold=1 \
  -XX:+UseStringDeduplication \
  -XX:+UseFastUnorderedTimeStamps \
  -XX:+OptimizeStringConcat \
  -XX:+UseCompressedOops \
  -XX:+UseCompressedClassPointers \
  -XX:ActiveProcessorCount=4 \
  -XX:ConcGCThreads=2 \
  -XX:ParallelGCThreads=4 \
  -XX:+UseLargePages \
  -XX:LargePageSizeInBytes=2M \
  -XX:+UnlockDiagnosticVMOptions \
  -XX:NativeMemoryTracking=summary \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath="$HEAP_DUMP_PATH" \
  -XX:ErrorFile=./hs_err_pid%p.log \
  -XX:+CrashOnOutOfMemoryError \
  -XX:+FlightRecorder \
  -XX:StartFlightRecording=duration=60s,filename=./server-startup.jfr \
  -XX:+UseTransparentHugePages \
  -XX:+UseThreadPriorities \
  -XX:ThreadPriorityPolicy=42 \
  -XX:+TieredCompilation \
  -XX:TieredStopAtLevel=4 \
  -XX:+UseCodeCacheFlushing \
  -XX:ReservedCodeCacheSize=256M \
  -XX:InitialCodeCacheSize=64M \
  -XX:NonNMethodCodeHeapSize=16M \
  -XX:ProfiledCodeHeapSize=192M \
  -XX:NonProfiledCodeHeapSize=48M \
  -XX:+SegmentedCodeCache \
  -XX:+UseInlineCaches \
  -XX:InlineSmallCode=2000 \
  -XX:MaxInlineLevel=15 \
  -XX:FreqInlineSize=450 \
  -XX:+AggressiveOpts \
  -XX:+UseFMA \
  -XX:+UseAES \
  -XX:+UseAESIntrinsics \
  -XX:+UseSHA \
  -XX:+UseSHA1Intrinsics \
  -XX:+UseSHA256Intrinsics \
  -XX:+UseSHA512Intrinsics \
  -XX:+UseAdler32Intrinsics \
  -XX:+UseCRC32Intrinsics \
  -XX:+UseCRC32CIntrinsics \
  -Dfile.encoding=UTF-8 \
  -Duser.timezone=Europe/Istanbul \
  -Djava.security.egd=file:/dev/urandom \
  -Dusing.aikars.flags=true \
  -Dcom.mojang.eula.agree=true \
  -Dpaper.playerconnection.keepalive=30 \
  -Dpaper.use-display-name-in-quit-message=true \
  -Dpaper.disable-method-profiler=true \
  -Dpaper.disable-snooper=true \
  -Dnet.minecraft.server.level.progress=false \
  -Dcom.mojang.authlib.GameProfile.useUUID=true \
  -Djava.net.preferIPv4Stack=true \
  -Djava.awt.headless=true \
  -Dlog4j2.formatMsgNoLookups=true \
  -Dlog4j.configurationFile=log4j2.xml \
  -Dterminal.jline=false \
  -Dterminal.ansi=true \
  -Djline.terminal=jline.UnsupportedTerminal \
  -jar 31311.jar nogui

EXIT_CODE=$?
echo "Server stopped. Exit code: $EXIT_CODE"

# JFR dosyalarını temizle
find . -name "*.jfr" -mtime +7 -delete 2>/dev/null || true

# Heap dump'ları temizle (7 günden eski)
find "$HEAP_DUMP_PATH" -name "*.hprof" -mtime +7 -delete 2>/dev/null || true

# Crash log'larını temizle (30 günden eski)
find . -name "hs_err_pid*.log" -mtime +30 -delete 2>/dev/null || true

exit $EXIT_CODE