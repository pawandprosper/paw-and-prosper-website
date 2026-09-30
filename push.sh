#!/bin/bash
# Paw & Prosper — deploy with a preview gate
# Usage: ./push.sh
#        ./push.sh "Optional commit message"
# Shows exactly what will go live and asks before committing.
# Pushing to main deploys to Netlify in ~60 seconds.

MSG="${1:-Deploy updates}"

echo "🐾 Paw & Prosper Deploy"
echo "─────────────────────────"

CHANGES=$(git status --short)
if [ -z "$CHANGES" ]; then
  echo "Nothing to deploy: no changes since the last push."
  exit 0
fi

echo "These changes will go LIVE:"
echo "$CHANGES"
echo ""
git diff --stat HEAD 2>/dev/null | tail -1

# Safety checks: never publish secrets or stray files
if echo "$CHANGES" | grep -qE '(^| )\.env|\.key$|\.pem$'; then
  echo "❌ Stopped: a secrets file (.env/.key/.pem) is in the change list. Remove it first."
  exit 1
fi
BIG=$(git status --porcelain | awk '{print $2}' | xargs -I{} sh -c 'test -f "{}" && [ $(wc -c < "{}") -gt 5000000 ] && echo "{}"' 2>/dev/null)
if [ -n "$BIG" ]; then
  echo "⚠️  Large file(s) over 5 MB: $BIG"
fi

echo ""
read -r -p "Deploy these changes to the live site? [y/N] " ANSWER
case "$ANSWER" in
  [yY]|[yY][eE][sS]) ;;
  *) echo "Cancelled. Nothing was committed or pushed."; exit 1 ;;
esac

git add .
git commit -m "$MSG"
git push
echo ""
echo "✅ Pushed! Netlify will deploy in ~60 seconds."
echo "👀 Live site: https://paw-and-prosper.netlify.app"
