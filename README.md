# ARCFORM AI v3

Holographic 3D Structural Engineering Platform with Groq AI (Llama-3.3-70b).

## Quick Start

Open `index.html` directly in a browser — no build step needed.

Or serve locally for full features:
```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## AI Features

- **Groq AI** (Llama-3.3-70b, free): enter natural language like *"Build an iconic bridge 700m long with viewpoint"*
- **ARCAI Neural Engine**: TF.js MLP, works offline
- **Rule-based fallback**: always works, even without internet

Groq API key is pre-loaded. Get your own free key at https://console.groq.com

## Project Structure

```
arcform-project/
├── index.html              Entry point
├── src/
│   ├── core/               State, utilities
│   ├── renderer/           Three.js engine, camera controls
│   ├── ai/                 ARCAI, Knowledge Base, Groq client, parser
│   ├── gestures/           Hand tracking (MediaPipe)
│   └── ui/                 Panels, toolbar, keyboard shortcuts
└── styles/                 CSS (holographic dark theme)
```

## Camera Controls

| Action | Control |
|--------|---------|
| Orbit  | Left-drag |
| Pan    | Right-drag / Shift+drag |
| Zoom   | Scroll wheel / Pinch |
| Reset  | F key or ⊙ button |

Mouse/trackpad inertia: camera glides after release.
