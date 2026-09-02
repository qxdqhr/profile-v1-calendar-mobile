#!/usr/bin/env bash
# Calendar Mobile 与 TeachHub Mobile 共用 release 签名，请使用 teach-hub 脚本生成 keystore。
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

echo "Calendar Mobile 复用 TeachHub Mobile 的 Android release 签名（GitHub Secrets: ANDROID_*）。"
echo ""
echo "首次生成证书请运行："
echo "  bash mobile/teach-hub-mobile/scripts/gen-android-keystore.sh"
echo ""
echo "本地打包前复制并填写："
echo "  cp config/android-signing.env.example config/android-signing.env"
echo ""
exec bash "${ROOT_DIR}/mobile/teach-hub-mobile/scripts/gen-android-keystore.sh" "$@"
