# nexus-chat-widget — React Native / Expo Integration Guide

This document explains how `nexus-chat-widget` is integrated into this React Native (Expo) app using a WebView, and how to maintain or reconfigure it.

---

## Why WebView?

`nexus-chat-widget` is a **browser-based widget**. It manipulates the DOM directly (`document.createElement`, CSS, `fetch`). React Native has no DOM, so the widget cannot run natively. The solution is to embed it inside a `react-native-webview` — a real browser engine (Chrome on Android, WebKit on iOS) running inside your app.

---

## Project structure

```
src/
  assets/
    chatWidgetScript.js   ← generated — do not edit by hand
  components/
    ChatWidget.js         ← the React Native component you import
```

---

## How it works

### Step 1 — npm package is installed

```bash
npm install nexus-chat-widget
```

The package ships as an ES module (`export default ChatWidget`). Plain `<script>` tags in a WebView cannot use ES module exports, so the file cannot be used directly.

### Step 2 — a patching script converts it to a browser global

A Node script reads the installed package source, wraps it in an IIFE, and replaces the ES module export with a `window` global so the WebView can use it without a bundler:

```bash
node -e "
const fs = require('fs');
const src = fs.readFileSync('./node_modules/nexus-chat-widget/dist/components/ChatWidget.js', 'utf8');
const patched = src.replace('export default ChatWidget;', 'window.ChatWidget = ChatWidget;');
const wrapped = '(function(){\n' + patched + '\n})();';
fs.mkdirSync('./src/assets', { recursive: true });
fs.writeFileSync('./src/assets/chatWidgetScript.js', 'export default ' + JSON.stringify(wrapped) + ';\n');
"
```

This produces `src/assets/chatWidgetScript.js` — a plain JS string constant containing the full widget code. It is **not** the npm package; it is a snapshot prepared for WebView injection.

> **The npm package itself is never modified.** Only the generated asset file changes.

### Step 3 — the component injects the script into a WebView

`src/components/ChatWidget.js` imports the string, builds a self-contained HTML document with the script inlined, and passes it to `<WebView source={{ html: ... }}>`. No CDN, no network request for the widget code.

---

## Configuration

Open `src/components/ChatWidget.js` and edit `WIDGET_OPTIONS`:

```js
const WIDGET_OPTIONS = {
  title: 'Site Support',        // Header text inside the chat panel
  appToken: 'YOUR_TOKEN_HERE',  // API key from your Nexus dashboard — required
  sessionId: 'rn-user-' + Math.random().toString(36).substr(2, 9), // unique per user/session
  botAvatar: 'https://i.pravatar.cc/40?img=12',  // URL to the bot's avatar image
  apiBaseUrl: 'https://api.cloud.nexuswave.ai',  // Nexus API base — change for self-hosted
};
```

### All available options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | `'Chat with us'` | Text shown in the chat panel header |
| `appToken` | string | — | **Required.** API key from the Nexus dashboard |
| `sessionId` | string | — | **Required.** Unique identifier for the conversation. Use a stable user ID so chat history persists across sessions |
| `botAvatar` | string | Nexus logo | URL to an image used as the bot's avatar |
| `apiBaseUrl` | string | `https://api.cloud.nexuswave.ai` | Override for self-hosted Nexus deployments |
| `retryAttempts` | number | `3` | How many times to retry failed API calls |
| `pollingInterval` | number | `45000` | Milliseconds between polling for new messages |
| `enableFileUpload` | boolean | `true` | Show the file attachment button |
| `maxFileSize` | number | `10485760` (10 MB) | Maximum file size in bytes |
| `maxFiles` | number | `5` | Maximum number of files per message |
| `allowedFileTypes` | string[] | `['jpg','jpeg','png','pdf','doc','docx','txt','csv','xlsx','xls']` | Permitted file extensions |

---

## Placement

The widget overlay is rendered once at the **app root level** (`App.js`), outside the tab navigator. This means:

- A single instance is shared across all screens — chat state is not reset when switching tabs
- The overlay sits above all screens but below the system UI
- The bottom edge is set to `TAB_BAR_HEIGHT + insets.bottom` so the floating button sits above the tab bar and the system navigation area

```
┌─────────────────────┐
│   Status bar        │  ← safe area top
│─────────────────────│
│                     │
│   Screen content    │
│                     │
│           [💬]      │  ← widget button (above tab bar)
│─────────────────────│
│   Tab bar           │  ← TAB_BAR_HEIGHT + insets.bottom
│─────────────────────│
│   System nav        │  ← safe area bottom (Android gesture / button bar)
└─────────────────────┘
```

If you change the tab bar height in `App.js`, update the `TAB_BAR_HEIGHT` constant in `ChatWidget.js` to match:

```js
// src/components/ChatWidget.js
const TAB_BAR_HEIGHT = 56; // keep in sync with App.js tabBarStyle height
```

---

## Updating to a new widget version

When `nexus-chat-widget` releases a new version:

1. Update the package:
   ```bash
   npm install nexus-chat-widget@latest
   ```

2. Regenerate the asset file:
   ```bash
   node -e "
   const fs = require('fs');
   const src = fs.readFileSync('./node_modules/nexus-chat-widget/dist/components/ChatWidget.js', 'utf8');
   const patched = src.replace('export default ChatWidget;', 'window.ChatWidget = ChatWidget;');
   const wrapped = '(function(){\n' + patched + '\n})();';
   fs.writeFileSync('./src/assets/chatWidgetScript.js', 'export default ' + JSON.stringify(wrapped) + ';\n');
   console.log('Asset regenerated');
   "
   ```

3. Restart the Metro bundler:
   ```bash
   npm start -- --reset-cache
   ```

No changes to `ChatWidget.js` are needed unless the widget's constructor API changed.

---

## Widget API methods (for advanced use)

The widget instance exposes these methods. To call them from React Native you would need to use `WebView.injectJavaScript(...)`.

| Method | Description |
|--------|-------------|
| `addBotMessage(text)` | Programmatically add a message from the bot |
| `updateOptions(options)` | Update configuration after initialisation |
| `clearMessages()` | Wipe the chat history from the UI |
| `isWidgetOpen()` | Returns `true` if the chat panel is open |
| `destroy()` | Remove the widget from the DOM and stop polling |

---

## Troubleshooting

**Widget does not appear**
- Make sure `src/assets/chatWidgetScript.js` exists. If not, run the patching script from the *Updating* section above.
- Check that `react-native-webview` is installed: `npm list react-native-webview`.

**Messages fail to send / "Token error" shown in chat**
- `appToken` is set to `'demo-token'` by default. Replace it with a real token from the Nexus dashboard.

**Chat history does not persist between app launches**
- The default `sessionId` is random (`Math.random()`). Replace it with a stable user identifier (e.g. from your auth system) so the backend can retrieve existing conversation history.

**Tab bar overlaps the widget button**
- Ensure `TAB_BAR_HEIGHT` in `ChatWidget.js` matches the `height` value in `App.js` tabBarStyle.

**Widget looks cut off on some devices**
- The overlay bottom is computed from `useSafeAreaInsets()`. Make sure `SafeAreaProvider` wraps the app in `App.js` — if it is missing, `insets.bottom` will always be `0`.
