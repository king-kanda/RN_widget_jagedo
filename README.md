# Using nexus-chat-widget in React Native (Expo)

This guide explains how to embed [`nexus-chat-widget`](https://www.npmjs.com/package/nexus-chat-widget) inside a React Native / Expo app using a WebView. The implementation in this repo — a construction site management app — is used as the working reference throughout.

---

## Why WebView?

`nexus-chat-widget` is built for the browser. It creates DOM elements directly (`document.createElement`, CSS, `fetch`). React Native has no DOM, so the widget **cannot run natively**.

The solution is [`react-native-webview`](https://www.npmjs.com/package/react-native-webview) — a real browser engine (Chromium on Android, WebKit on iOS) embedded inside your app. We inject the widget's code into an HTML page that runs inside this engine.

---

## Prerequisites

```bash
npm install nexus-chat-widget react-native-webview react-native-safe-area-context
```

Your `package.json` should include all three (as in this repo):

```json
"dependencies": {
  "nexus-chat-widget": "^1.1.7",
  "react-native-webview": "13.12.5",
  "react-native-safe-area-context": "^4.12.0"
}
```

---

## The problem with the package's dist format

After installing, the widget's built file lives at:

```
node_modules/nexus-chat-widget/dist/components/ChatWidget.js
```

It ends with:

```js
export default ChatWidget;
```

This is an ES module export. A plain `<script>` tag inside a WebView **cannot use ES module exports** — there is no bundler running inside the WebView. If you load this file directly, `ChatWidget` is never available and nothing renders.

### The fix: patch it into a browser global

Run this Node script once after install (and again after any package update) to generate a WebView-ready asset file:

```bash
node -e "
const fs = require('fs');
const src = fs.readFileSync('./node_modules/nexus-chat-widget/dist/components/ChatWidget.js', 'utf8');
const patched = src.replace('export default ChatWidget;', 'window.ChatWidget = ChatWidget;');
const wrapped = '(function(){\n' + patched + '\n})();';
fs.mkdirSync('./src/assets', { recursive: true });
fs.writeFileSync(
  './src/assets/chatWidgetScript.js',
  'export default ' + JSON.stringify(wrapped) + ';\n'
);
console.log('Done');
"
```

This creates `src/assets/chatWidgetScript.js` — a JavaScript string constant containing the full widget code wrapped in an IIFE, with `window.ChatWidget = ChatWidget` at the end instead of `export default`.

> The npm package is **never modified**. Only the generated asset file changes.

---

## Step-by-step integration

### 1. Generate the asset (run once after install)

Run the patching script above. You should now have:

```
src/
  assets/
    chatWidgetScript.js   ← generated, do not edit by hand
```

### 2. Create the overlay component

Create `src/components/ChatWidget.js`. This is the file that owns the WebView and all widget configuration:

```js
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import widgetScript from '../assets/chatWidgetScript';

// Keep in sync with the tab bar height in App.js
const TAB_BAR_HEIGHT = 56;

function buildHtml(script, options) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: transparent; overflow: hidden; }
  </style>
</head>
<body>
<script>${script}<\/script>
<script>
  window.ChatWidget && new window.ChatWidget(${JSON.stringify(options)});
<\/script>
</body>
</html>`;
}

const WIDGET_OPTIONS = {
  title: 'Site Support',
  appToken: 'YOUR_APP_TOKEN',        // replace with token from Nexus dashboard
  sessionId: 'user-' + Math.random().toString(36).substr(2, 9), // use stable user ID in production
  botAvatar: 'https://i.pravatar.cc/40?img=12',
  apiBaseUrl: 'https://api.cloud.nexuswave.ai',
};

const HTML = buildHtml(widgetScript, WIDGET_OPTIONS);

export default function ChatWidgetOverlay() {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[styles.overlay, { bottom: TAB_BAR_HEIGHT + insets.bottom }]}
      pointerEvents="box-none"
    >
      <WebView
        source={{ html: HTML }}
        style={styles.webview}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        originWhitelist={['*']}
        mixedContentMode="always"
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
```

**Why `pointerEvents="box-none"` on the container?**
The overlay covers the full screen. Without this, it would swallow all touches and make the rest of the app unresponsive. `box-none` means the View itself ignores touches while its child (the WebView) still receives them — so the chat widget stays interactive without blocking the rest of the UI.

**Why `bottom: TAB_BAR_HEIGHT + insets.bottom`?**
This positions the overlay's lower edge above the tab bar and the device's system navigation area (Android gesture bar or hardware button row). Without it, the chat button sits behind the tab bar or behind the phone's own navigation buttons.

**Why inline the script instead of using a CDN URL?**
The widget loads instantly with no network dependency, the version is locked to whatever is installed in `node_modules`, and it works in airplane mode.

### 3. Add it to your app root

Mount the overlay **once**, outside the navigator, so a single instance is shared across all screens. Chat state is preserved when the user switches tabs.

```js
// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native';

import DashboardScreen from './src/screens/DashboardScreen';
import ActiveJobsScreen from './src/screens/ActiveJobsScreen';
import MaterialsScreen from './src/screens/MaterialsScreen';
import ChatWidgetOverlay from './src/components/ChatWidget';

const Tab = createBottomTabNavigator();

function TabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1C1C1E',
          height: 56 + insets.bottom,   // accounts for system navigation bar
          paddingBottom: insets.bottom + 4,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Active Jobs" component={ActiveJobsScreen} />
      <Tab.Screen name="Materials" component={MaterialsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
      <ChatWidgetOverlay />  {/* single instance, renders above all screens */}
    </SafeAreaProvider>
  );
}
```

`SafeAreaProvider` is required. Without it, `useSafeAreaInsets()` always returns `0` and the widget will overlap the system navigation area.

Do **not** import `ChatWidgetOverlay` inside individual screens — one instance at the root is enough.

### 4. Update screen headers to respect safe area

Each screen header should use `useSafeAreaInsets().top` instead of a hardcoded value so the header sits correctly below the status bar on any device:

```js
// src/screens/DashboardScreen.js  (same pattern for all screens)
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Site Dashboard</Text>
      </View>
      {/* ... */}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#1C1C1E',
    paddingBottom: 20,
    paddingHorizontal: 20,
    // paddingTop is set dynamically above
  },
});
```

---

## How the layout looks on device

```
┌─────────────────────┐
│   Status bar        │  ← insets.top (varies by device)
│─────────────────────│
│   Screen header     │  ← paddingTop: insets.top + 12
│                     │
│   Screen content    │
│                     │
│              [💬]   │  ← widget floating button (bottom-right)
│─────────────────────│
│   Tab bar           │  ← height: 56 + insets.bottom
│─────────────────────│
│   System nav bar    │  ← insets.bottom (Android gesture / buttons)
└─────────────────────┘
```

---

## Configuration options

Edit `WIDGET_OPTIONS` in `src/components/ChatWidget.js`:

| Option | Type | Default | Description |
|---|---|---|---|
| `title` | string | `'Chat with us'` | Text shown in the chat panel header |
| `appToken` | string | — | **Required.** API key from the Nexus dashboard |
| `sessionId` | string | — | **Required.** Unique ID per user. Use a stable identifier from your auth system so history persists across app launches |
| `botAvatar` | string | Nexus logo | URL of the image shown as the bot avatar |
| `apiBaseUrl` | string | `https://api.cloud.nexuswave.ai` | Override for self-hosted deployments |
| `retryAttempts` | number | `3` | Retry count for failed API calls |
| `pollingInterval` | number | `45000` | Milliseconds between polling for new messages |
| `enableFileUpload` | boolean | `true` | Show the file attachment button |
| `maxFileSize` | number | `10485760` | Max file size in bytes (default 10 MB) |
| `maxFiles` | number | `5` | Max files per message |
| `allowedFileTypes` | string[] | `['jpg','jpeg','png','pdf','doc','docx','txt','csv','xlsx','xls']` | Permitted file extensions |

---

## Widget API methods

The widget instance is created inside the WebView. To call its methods from React Native, use `webViewRef.current.injectJavaScript(...)`.

| Method | Description |
|---|---|
| `addBotMessage(text)` | Programmatically insert a bot message |
| `updateOptions(options)` | Update configuration after initialisation |
| `clearMessages()` | Wipe the chat history from the UI |
| `isWidgetOpen()` | Returns `true` if the chat panel is currently open |
| `destroy()` | Remove the widget from the DOM and stop polling |

Example from React Native:

```js
const webViewRef = useRef(null);

// Inject a bot message from outside the WebView
webViewRef.current?.injectJavaScript(
  `window.__chatWidget && window.__chatWidget.addBotMessage('Welcome back!'); true;`
);
```

---

## Updating to a new widget version

```bash
# 1. Update the package
npm install nexus-chat-widget@latest

# 2. Regenerate the asset
node -e "
const fs = require('fs');
const src = fs.readFileSync('./node_modules/nexus-chat-widget/dist/components/ChatWidget.js', 'utf8');
const patched = src.replace('export default ChatWidget;', 'window.ChatWidget = ChatWidget;');
const wrapped = '(function(){\n' + patched + '\n})();';
fs.writeFileSync('./src/assets/chatWidgetScript.js', 'export default ' + JSON.stringify(wrapped) + ';\n');
console.log('Done');
"

# 3. Clear Metro cache and restart
npm start -- --reset-cache
```

No changes to `ChatWidget.js` are needed unless the widget's constructor API changed in the new release.

---

## Troubleshooting

**Widget does not appear**
`src/assets/chatWidgetScript.js` is missing. Run the patching script from the *Prerequisites* section.

**"Token error" shown in the chat panel**
`appToken` is set to the placeholder value. Replace it with a real token from the Nexus dashboard.

**Chat history resets on every app launch**
The default `sessionId` uses `Math.random()`. Replace it with a stable user identifier from your auth system.

**Widget button sits behind the tab bar**
`TAB_BAR_HEIGHT` in `ChatWidget.js` does not match the `height` value in your tab bar style. Keep them in sync.

**Tab bar overlaps the phone's navigation buttons**
`SafeAreaProvider` is missing from `App.js`. Wrap the app as shown in Step 3 above.
