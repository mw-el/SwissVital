#!/usr/bin/env bash
################################################################################
# mrgsnc.sh - Automated Sync and Merge Script for Git Repository: SwissVital
#
# Features:
# - Pulls the latest changes from the remote SwissVital GitHub repository.
# - Detects changed, conflicted, and deleted files.
# - Provides a structured list of file differences with timestamps and commit hashes.
# - Ensures final synchronization before pushing changes to the remote repository.
#
# Dependencies:
# - Git installed (sudo apt-get install git)
# - Bash 4+ (Ubuntu 24.04 default)
#
################################################################################

# CONFIGURATION: This script is restricted to the SwissVital repository
REPO_NAME="SwissVital"
REPO_PATH="$HOME/git/$REPO_NAME"  # Adjust this to your actual repository location
REMOTE_NAME="origin"
REMOTE_BRANCH="main"
REMOTE_URL="https://github.com/mw-el/SwissVital.git"

# Ensure the script runs inside the correct repository
CURRENT_DIR=$(pwd)
if [[ "$CURRENT_DIR" != *"$REPO_NAME"* ]]; then
  echo "❌ ERROR: This script can only be executed inside the '$REPO_NAME' repository."
  echo "🛑 Please navigate to '$REPO_PATH' and run the script again."
  exit 1
fi

# Ensure correct Git remote URL is set
ACTUAL_REMOTE_URL=$(git remote get-url "$REMOTE_NAME" 2>/dev/null)
if [[ "$ACTUAL_REMOTE_URL" != "$REMOTE_URL" ]]; then
  echo "❌ ERROR: The remote URL does not match '$REMOTE_URL'."
  echo "🔄 Resetting remote URL to ensure correct repository..."
  git remote set-url "$REMOTE_NAME" "$REMOTE_URL"
fi

clear
echo
echo "************************************************************"
echo "*  AUTOMATED SYNC AND MERGE SCRIPT - SwissVital Repository *"
echo "*  Repo: $REPO_NAME                                        *"
echo "************************************************************"
echo

################################################################################
# 1) FETCH + PULL LATEST CHANGES
################################################################################
echo "============================================================"
echo "=== STEP 1: Fetching and pulling latest from $REMOTE_NAME/$REMOTE_BRANCH ==="
echo "============================================================"
echo

git fetch "$REMOTE_NAME"

# Capture local commit hash and timestamp
LOCAL_HEAD_HASH=$(git rev-parse HEAD)
LOCAL_TIMESTAMP=$(date -r "$(git log -1 --pretty=format:%ct)" +"%y%m%d-%H%M" 2>/dev/null)

echo " 🏠 Local HEAD commit: $LOCAL_HEAD_HASH ($LOCAL_TIMESTAMP)"
echo
echo " 📥 Performing 'git pull' to merge remote changes..."
git pull "$REMOTE_NAME" "$REMOTE_BRANCH"
echo

echo "✅ RESULT: Repository is now up to date (or conflicts detected)."
echo
echo "############################################################"
echo
echo


################################################################################
# 2) DETECT FILES CHANGED, CHECK FOR CONFLICTS & DELETIONS
################################################################################
echo "============================================================"
echo "=== STEP 2: Checking status and identifying changes ==="
echo "============================================================"
echo

STATUS_OUTPUT=$(git status --porcelain)

if [ -z "$STATUS_OUTPUT" ]; then
  echo "✅ No changes detected. Your local repository is up to date."
  exit 0
fi

# Process Git status output
CONFLICT_FILES=()
DELETED_FILES=()
MODIFIED_FILES=()

echo "📄 The following files have changed:"
echo

while IFS= read -r line; do
  STATUS=$(echo "$line" | awk '{print $1}')
  FILE_PATH=$(echo "$line" | cut -c4-)
  LOCAL_COMMIT_HASH=$(git log -1 --pretty=format:%h -- "$FILE_PATH" 2>/dev/null || echo "***edited***")
  LOCAL_TIMESTAMP=$(date -r "$FILE_PATH" +"%y%m%d-%H%M" 2>/dev/null || echo "N/A")
  
  # Fetch last known timestamp and commit hash for the remote file
  REMOTE_COMMIT_HASH=$(git log "$REMOTE_NAME/$REMOTE_BRANCH" -1 --pretty=format:%h -- "$FILE_PATH" 2>/dev/null || echo "N/A")
  REMOTE_TIMESTAMP=$(git log "$REMOTE_NAME/$REMOTE_BRANCH" -1 --pretty=format:%ct -- "$FILE_PATH" 2>/dev/null || echo "N/A")
  REMOTE_TIMESTAMP=$(date -d @"$REMOTE_TIMESTAMP" +"%y%m%d-%H%M" 2>/dev/null || echo "N/A")

  if [[ "$STATUS" == "UU" ]]; then
    CONFLICT_FILES+=("$FILE_PATH")
    echo "LCL: $FILE_PATH (***CONFLICT*** )[$LOCAL_TIMESTAMP]{$LOCAL_COMMIT_HASH}"
    echo "REM: $FILE_PATH (***CONFLICT*** )[$REMOTE_TIMESTAMP]{$REMOTE_COMMIT_HASH}"
    echo
  elif [[ "$STATUS" =~ ^D ]]; then
    DELETED_FILES+=("$FILE_PATH")
    echo "LCL: $FILE_PATH (__deleted__ )[deleted]{***edited***}"
    echo "REM: $FILE_PATH (***delete***)[$REMOTE_TIMESTAMP]{$REMOTE_COMMIT_HASH}"
    echo
  else
    MODIFIED_FILES+=("$FILE_PATH")
    echo "LCL: $FILE_PATH (__keep__)[${LOCAL_TIMESTAMP}]{${LOCAL_COMMIT_HASH}}"
    echo "REM: $FILE_PATH (discard)[${REMOTE_TIMESTAMP}]{${REMOTE_COMMIT_HASH}}"
    echo
  fi
done <<< "$STATUS_OUTPUT"

echo "############################################################"
echo
echo


################################################################################
# 3) FINAL COMMIT + PUSH
################################################################################
echo "============================================================"
echo "=== STEP 3: Finalizing changes and pushing to remote ==="
echo "============================================================"
echo

git add -A
git status
echo

# Retrieve last commit message from Git
LAST_MESSAGE=$(git log -1 --pretty=format:%s 2>/dev/null || echo "")
DEFAULT_MESSAGE="${LAST_MESSAGE} +1"

# Prompt user for commit message, with default
if [ -n "$LAST_MESSAGE" ]; then
  read -r -p "📝 Enter a commit message (default: '$DEFAULT_MESSAGE'): " COMMIT_MSG
  COMMIT_MSG="${COMMIT_MSG:-$DEFAULT_MESSAGE}"
else
  read -r -p "📝 Enter a commit message: " COMMIT_MSG
fi

echo
echo
echo "💾 Committing with message: '$COMMIT_MSG'"
echo
echo

if [ -z "$COMMIT_MSG" ]; then
  echo "❌ No commit message entered. Aborting."
  exit 0
fi

git commit -m "$COMMIT_MSG"
echo


echo "🔄 Final check for new remote changes before pushing..."
git fetch "$REMOTE_NAME"

REMOTE_HEAD_HASH=$(git rev-parse "$REMOTE_NAME/$REMOTE_BRANCH")

if [ "$REMOTE_HEAD_HASH" != "$(git rev-parse HEAD)" ]; then
  echo
  echo "❗ New remote commits detected. Pulling again..."
  echo
  git pull "$REMOTE_NAME" "$REMOTE_BRANCH"
  echo
else
  echo "✅ No new remote commits detected. Proceeding with push."
fi

echo
echo "🚀 Pushing to $REMOTE_NAME/$REMOTE_BRANCH..."
git push "$REMOTE_NAME" "$REMOTE_BRANCH"
echo
echo

echo "************************************************************"
echo "*  🎉 Done! Your SwissVital repository is now in sync.     *"
echo "************************************************************"
echo
echo

