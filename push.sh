#!/bin/bash
# Paw & Prosper — deploy with a preview gate
# Usage: ./push.sh
#        ./push.sh "Optional commit message"
# Shows exactly what will go live and asks before committing.
# Pushing to main deploys to Netlify in ~60 seconds.

MSG="${1:-Deploy updates}"

echo "🐾 Paw & Prosper Deploy"
echo "─────────────────────────"

CHANGES=$(git status --short -uall)
if [ -z "$CHANGES" ]; then
  echo "Nothing to deploy: no changes since the last push."
  exit 0
fi

echo "These changes will go LIVE:"
echo "$CHANGES"
echo ""
git diff --stat HEAD 2>/dev/null | tail -1

# Safety checks: never publish secrets or stray files
if echo "$CHANGES" | grep -qE '(^|/| )\.env|\.key$|\.pem$'; then
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
# Re-check what actually got staged (catches files inside new folders)
if git diff --cached --name-only | grep -qE '(^|/)\.env|\.key$|\.pem$'; then
  git reset -q
  echo "❌ Stopped: a secrets file was staged. Nothing was committed."
  exit 1
fi
git commit -m "$MSG" || { echo "❌ Commit failed. Nothing was pushed."; exit 1; }
git push || { echo "❌ Push FAILED. The site was NOT updated. The commit is saved locally; fix the error above and run ./push.sh again."; exit 1; }
echo ""
echo "✅ Pushed! Netlify will deploy in ~60 seconds."
echo "👀 Live site: https://paw-and-prosper.netlify.app"
