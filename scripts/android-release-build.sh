#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
MOBILE_DIR="${ROOT_DIR}/app_mobile/calendar-mobile"
ANDROID_DIR="${MOBILE_DIR}/android"
SKIP_EXPO_PREBUILD="${SKIP_EXPO_PREBUILD:-1}"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found. Please install pnpm first."
  exit 1
fi

if ! command -v java >/dev/null 2>&1; then
  echo "Java not found. Please install JDK 17."
  exit 1
fi

echo "==> Install monorepo dependencies"
cd "${ROOT_DIR}"
export SA2KIT_SKIP_PREPARE=1
export SA2KIT_SKIP_DTS=1
pnpm install --frozen-lockfile --ignore-scripts
pnpm build:libs

echo "==> Typecheck Calendar mobile"
pnpm --filter @profile/calendar-mobile build

cd "${MOBILE_DIR}"

VERSION="${APP_VERSION:-0.1.0}"
BUILD_NO="${EXPO_ANDROID_VERSION_CODE:-1}"

if [ -n "${EXPO_PUBLIC_AUTH_BASE_URL:-}" ] || [ -n "${EXPO_PUBLIC_CALENDAR_API_BASE_URL:-}" ]; then
  echo "==> Write .env for release bundle"
  cat > .env <<EOF
EXPO_PUBLIC_AUTH_BASE_URL=${EXPO_PUBLIC_AUTH_BASE_URL:-http://localhost:3000}
EXPO_PUBLIC_CALENDAR_API_BASE_URL=${EXPO_PUBLIC_CALENDAR_API_BASE_URL:-http://localhost:3001}
EOF
fi

if [ "${SKIP_EXPO_PREBUILD}" = "1" ]; then
  if [ ! -x "${ANDROID_DIR}/gradlew" ]; then
    echo "ERROR: ${ANDROID_DIR}/gradlew not found. Commit android/ or run with SKIP_EXPO_PREBUILD=0 once." >&2
    exit 1
  fi
  echo "==> Skip Expo prebuild (use committed android/)"
else
  if ! command -v npx >/dev/null 2>&1; then
    echo "npx not found. Please install Node.js first."
    exit 1
  fi
  echo "==> Generate Android native project (Expo prebuild)"
  CI=1 npx expo prebuild --platform android --non-interactive --clean
fi

echo "==> Patch Android version (versionName=${VERSION}, versionCode=${BUILD_NO})"
if [[ "$(uname -s)" == "Darwin" ]]; then
  sed -i '' -E "s/versionCode [0-9]+/versionCode ${BUILD_NO}/" "${ANDROID_DIR}/app/build.gradle"
  sed -i '' -E "s/versionName \"[^\"]+\"/versionName \"${VERSION}\"/" "${ANDROID_DIR}/app/build.gradle"
else
  sed -i -E "s/versionCode [0-9]+/versionCode ${BUILD_NO}/" "${ANDROID_DIR}/app/build.gradle"
  sed -i -E "s/versionName \"[^\"]+\"/versionName \"${VERSION}\"/" "${ANDROID_DIR}/app/build.gradle"
fi

# shellcheck source=/dev/null
source "${ROOT_DIR}/scripts/load-android-signing-env.sh"
bash "${ROOT_DIR}/scripts/setup-android-release-keystore.sh" "${ANDROID_DIR}"

echo "==> Build Android APK (release)"
cd "${ANDROID_DIR}"
chmod +x ./gradlew
./gradlew assembleRelease --no-daemon

APK_PATH="${ANDROID_DIR}/app/build/outputs/apk/release/app-release.apk"
if [ ! -f "${APK_PATH}" ]; then
  echo "APK not found: ${APK_PATH}" >&2
  exit 1
fi

DIST_DIR="${MOBILE_DIR}/dist"
mkdir -p "${DIST_DIR}"
OUTPUT_APK="${DIST_DIR}/calendar-mobile-${VERSION}+${BUILD_NO}.apk"
cp "${APK_PATH}" "${OUTPUT_APK}"

echo "==> APK output:"
echo "${OUTPUT_APK}"
