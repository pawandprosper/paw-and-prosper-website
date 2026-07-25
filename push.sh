#!/bin/bash
# Paw & Prosper — One-click deploy
# Usage: ./push.sh
#        ./push.sh "Optional commit message"

MSG="${1:-Deploy updates}"

echo "🐾 Paw & Prosper Deploy"
echo "─────────────────────────"
git add .
git commit -m "$MSG"
git push
echo ""
echo "✅ Pushed! Netlify will deploy in ~60 seconds."
echo "👀 Live site: https://paw-and-prosper.netlify.app"
