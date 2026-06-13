# NexusWave Chat API — React Native Integration Guide

This guide documents how to call the NexusWave chat API directly from a React Native / Expo app without any widget or WebView.

**Source implementation:** [`src/screens/ChatScreen.js`](./src/screens/ChatScreen.js)

All code snippets in this guide are taken directly from that file. Read it alongside this document for the full working context.

---

## Base URL

```
https://api.cloud.nexuswave.ai
```

---

## Authentication

Every request must include a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_app_token>
```

Get your token from the NexusWave dashboard. Store it as a constant in your app — never hardcode it in a public repo, use an environment variable in production.

---

## Session ID

> [`src/screens/ChatScreen.js` line 17](./src/screens/ChatScreen.js)

A session ID ties a conversation together. Generate it once per user session and reuse it across all API calls:

```js
const SESSION_ID = 'rn-user-' + Math.random().toString(36).substr(2, 9);
```

In production, replace `Math.random()` with a stable user identifier from your auth system so conversation history persists across app launches.

---

## Endpoints

### 1. Send a message

```
POST /widget/incoming
```

Sends a user message and triggers the AI response.

**Headers**

| Header | Value |
|---|---|
| `Authorization` | `Bearer <your_app_token>` |

> Do **not** set `Content-Type` manually. The body is `FormData` and the browser/React Native sets the correct `multipart/form-data` boundary automatically. Setting it manually will break the request.

**Body (FormData)**

| Field | Type | Required | Description |
|---|---|---|---|
| `session_id` | string | Yes | The session ID for this conversation |
| `message` | string | Yes | The message text the user typed |
| `file` | File | No | Attach one or more files (repeat the field per file) |

**Example** — [`src/screens/ChatScreen.js` `apiSendMessage()`](./src/screens/ChatScreen.js)

```js
async function sendMessage(text) {
  const form = new FormData();
  form.append('session_id', SESSION_ID);
  form.append('message', text);

  const res = await fetch('https://api.cloud.nexuswave.ai/widget/incoming', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer nw_8fSTp10JZNf0gIpVPkAWsGX2',
    },
    body: form,
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

**Success response** — `200 OK`

```json
{ "status": "ok" }
```

---

### 2. Fetch messages

```
GET /widget/getmessages/:session_id
```

Returns the full message history for a session, ordered by time. Call this on mount to load history, then poll it on an interval to receive bot replies.

**Headers**

| Header | Value |
|---|---|
| `Authorization` | `Bearer <your_app_token>` |
| `Content-Type` | `application/json` |

**URL parameter**

| Parameter | Description |
|---|---|
| `session_id` | The session ID passed when sending messages |

**Example** — [`src/screens/ChatScreen.js` `apiFetchMessages()`](./src/screens/ChatScreen.js)

```js
async function fetchMessages() {
  const res = await fetch(
    `https://api.cloud.nexuswave.ai/widget/getmessages/${SESSION_ID}`,
    {
      headers: {
        Authorization: 'Bearer nw_8fSTp10JZNf0gIpVPkAWsGX2',
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

**Success response** — `200 OK`

```json
[
  {
    "messages": [
      {
        "id": "msg_abc123",
        "dateTime": 1718358000000,
        "user_message": "Hello, I need help with my order",
        "ai_message": "Hi! I'd be happy to help. What's your order number?",
        "agent_message": null
      },
      {
        "id": "msg_def456",
        "dateTime": 1718358060000,
        "user_message": "It's #4521",
        "ai_message": null,
        "agent_message": "Let me look that up for you..."
      }
    ]
  }
]
```

**Response fields**

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique message ID — use this to deduplicate when polling |
| `dateTime` | number | Unix timestamp in milliseconds — sort by this to display in order |
| `user_message` | string \| null | The message the user sent |
| `ai_message` | string \| null | The automated AI reply |
| `agent_message` | string \| null | A reply from a human agent (if escalated) |

Each message entry can have a `user_message` and either an `ai_message` or `agent_message`. Render both sides when present.

---

## Parsing the response

> [`src/screens/ChatScreen.js` `parseMessages()`](./src/screens/ChatScreen.js)

Flatten the nested structure into a simple list for display:

```js
function parseMessages(data) {
  if (!Array.isArray(data) || data.length === 0) return [];
  const raw = data[0]?.messages;
  if (!Array.isArray(raw)) return [];

  const flat = [];
  raw
    .sort((a, b) => a.dateTime - b.dateTime)
    .forEach((m) => {
      if (m.user_message) {
        flat.push({ id: `${m.id}_user`, text: String(m.user_message), role: 'user', ts: m.dateTime });
      }
      const botText = m.ai_message || m.agent_message;
      if (botText) {
        flat.push({ id: `${m.id}_bot`, text: String(botText), role: 'bot', ts: m.dateTime });
      }
    });

  return flat;
}
```

---

## Polling for new messages

> [`src/screens/ChatScreen.js` `useEffect` + `loadMessages()`](./src/screens/ChatScreen.js)

The API is REST — there is no WebSocket. To receive bot replies after sending a message, poll `GET /widget/getmessages` on an interval:

```js
useEffect(() => {
  fetchMessages(); // load on mount

  const timer = setInterval(fetchMessages, 10000); // poll every 10 seconds
  return () => clearInterval(timer);
}, []);
```

**Deduplicating messages** — [`src/screens/ChatScreen.js` `mergeMessages()`](./src/screens/ChatScreen.js)

Track already-rendered message IDs to avoid showing duplicates on each poll:

```js
const seenIds = useRef(new Set());

function mergeMessages(incoming) {
  setMessages((prev) => {
    const next = [...prev];
    let changed = false;
    incoming.forEach((m) => {
      if (!seenIds.current.has(m.id)) {
        seenIds.current.add(m.id);
        next.push(m);
        changed = true;
      }
    });
    if (!changed) return prev; // avoid unnecessary re-render
    return next.sort((a, b) => a.ts - b.ts);
  });
}
```

---

## Error handling

| HTTP Status | Meaning | Recommended action |
|---|---|---|
| `401` | Invalid or missing token | Show an error — do not retry |
| `403` | Origin not allowed | Show an error — do not retry |
| `404` | Session not found | Start a new session |
| `429` | Rate limited | Back off and retry after a delay |
| `500` / `502` / `503` | Server error | Retry with exponential backoff |

---

## Full flow

```
App launch
  └─ generate SESSION_ID
  └─ GET /widget/getmessages/:session_id  → load history
  └─ setInterval → GET /widget/getmessages/:session_id every 10s

User types and hits send
  └─ POST /widget/incoming  { session_id, message }
  └─ show typing indicator
  └─ GET /widget/getmessages/:session_id  → pick up AI reply
  └─ hide typing indicator
```

---

## Running the app

```bash
npm install
npx expo start        # opens Expo dev menu
# press W → browser
# press A → Android emulator
# scan QR → Expo Go on phone
```

Web and Expo Go are both supported. On a physical device, make sure your API server is reachable from the device network (localhost only works in the browser build).
