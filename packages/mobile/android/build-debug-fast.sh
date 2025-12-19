#!/bin/bash
# Fast local debug build script with caching enabled

echo "🚀 Building debug APK with optimizations..."
echo "📦 Using build cache and parallel execution"

./gradlew \
  --build-cache \
  --parallel \
  --max-workers=8 \
  assembleDebug

echo "✅ Build complete!"
