import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

const WIDGET_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: transparent; overflow: hidden; }
  </style>
</head>
<body>
  <script src="https://cdn.jsdelivr.net/npm/nexus-chat-widget@latest/dist/chat-widget.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function () {
      new ChatWidget({
        title: 'Site Support',
        appToken: 'demo-token',
        sessionId: 'rn-user-' + Math.random().toString(36).substr(2, 9),
        botAvatar: 'https://i.pravatar.cc/40?img=12'
      });
    });
  </script>
</body>
</html>
`;

export default function ChatWidgetOverlay() {
  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <WebView
        source={{ html: WIDGET_HTML }}
        style={styles.webview}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        backgroundColor="transparent"
        originWhitelist={['*']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
