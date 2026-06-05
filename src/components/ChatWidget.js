import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import widgetScript from '../assets/chatWidgetScript';

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
  appToken: 'demo-token',
  sessionId: 'rn-user-' + Math.random().toString(36).substr(2, 9),
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
