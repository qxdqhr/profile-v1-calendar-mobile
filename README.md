# Calendar Mobile（RN）

`@profile/calendar-mobile` — 日历子应用的 React Native 客户端（Expo）。

与 `web/calendar`（Web 子应用）同级，共享 `npm/calendar-shared`。

## 技术栈

- **Expo 52** + React Navigation
- **NativeWind v4**（Tailwind CSS，配色对齐 Web 端 calendar-core）
- **@react-native-cookies/cookies** — 同步 WebView HttpOnly Cookie 到 API 请求

## 目录

```
web/calendar-mobile/
├── App.tsx
├── global.css
├── tailwind.config.js
├── metro.config.js
├── src/
│   ├── auth/
│   │   ├── AuthContext.tsx
│   │   └── cookieStore.ts
│   ├── config.ts
│   ├── screens/
│   └── components/
└── assets/
```

## 本地开发

1. 启动主站 Auth + calendar API：

   ```bash
   pnpm dev:web          # :3000（Auth API）
   pnpm dev:calendar     # :3001（Calendar API）
   ```

2. 配置环境变量：

   ```bash
   cp web/calendar-mobile/.env.example web/calendar-mobile/.env
   ```

   Android 模拟器请将 `localhost` 改为 `10.0.2.2`。

3. **首次运行需 Dev Client**（Cookie 原生模块在 Expo Go 中不可用）：

   ```bash
   pnpm --filter @profile/calendar-mobile android
   ```

4. 日常开发：

   ```bash
   pnpm dev:calendar-mobile
   ```

## 功能

- WebView 登录 + Cookie 会话同步（与 teach-hub-mobile 相同加固流程）
- 月视图 / 列表视图
- 事件查看、创建、编辑、删除
- 与 Web 端共用 `/api/calendar/*` 后端

## Android APK（签名 release）

与 **TeachHub Mobile 共用同一套** `ANDROID_*` 签名（GitHub Secrets 同名，本地用 `config/android-signing.env`）。

**首次生成签名证书（只需一次，两 App 共用）：**

```bash
bash web/teach-hub-mobile/scripts/gen-android-keystore.sh
# 或 bash web/calendar-mobile/scripts/gen-android-keystore.sh（会转调 teach-hub 脚本）
```

**本地 release 构建：**

```bash
cp config/android-signing.env.example config/android-signing.env
# 填入与 GitHub Secrets 相同的 ANDROID_* 四个值

export EXPO_PUBLIC_AUTH_BASE_URL='https://qhr062.top'
export EXPO_PUBLIC_CALENDAR_API_BASE_URL='https://qhr062.top/calendar'

pnpm build:calendar-mobile:android
# 产物：web/calendar-mobile/dist/calendar-mobile-<version>+<build>.apk
```

### 与 Web 子应用一并打包

```bash
pnpm package:calendar              # Docker + 签名 APK（需 config/android-signing.env）
BUILD_ANDROID=0 pnpm package:calendar   # 仅 Docker
BUILD_DOCKER=0 pnpm package:calendar  # 仅 APK
```

### GitHub Actions

| Workflow | 触发 |
|----------|------|
| `.github/workflows/calendar-mobile-release.yml` | tag `calendar-mobile-v*` / 手动 |
| `.github/workflows/docker-build-push.yml` | 推 main 时与 TeachHub 一并打签名 APK |

**Repository Variables：**

- `CALENDAR_MOBILE_AUTH_BASE_URL` — 主站 Auth（如 `https://qhr062.top`）
- `CALENDAR_MOBILE_API_BASE_URL` — Calendar API（如 `https://qhr062.top/calendar`）

**Secrets（与 TeachHub Mobile 共用）：** `ANDROID_KEYSTORE_BASE64`、`ANDROID_KEYSTORE_PASSWORD`、`ANDROID_KEY_ALIAS`、`ANDROID_KEY_PASSWORD`
