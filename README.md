# Palette Picker

Beginner-friendly palette playground that turns one color into an impressive, accessible UI palette. Pick a vibe (mode), tune the mood, customize tokens, and export CSS variables or tokens.json.

## Features
- Vibe modes: Bold, Editorial, Neo Glass, Minimal, Playful, Elegant Dark
- Mood slider for quick saturation/feel adjustments
- Light/Dark theme with automatic contrast guardrails
- Customize Tokens for direct overrides
- Live component showcase (buttons, tabs, table, alerts, forms, badges, etc.)
- Copy :root CSS variables, download tokens.json
- Shareable URL state (primary/mode/theme/mood/harmony)

## Quick start
Open the static page directly or serve locally:

- Double-click `index.html` (file:// may restrict some clipboard features), or
- Serve folder:
  - Node
    - `npx serve -l 5173`
  - Python
    - `python -m http.server 5173`

Then visit http://localhost:5173

## Deploy on Vercel
This is a static site. Add a new Vercel project pointing to this folder.
- Framework Preset: Other
- Build Command: (empty)
- Output Directory: .

Alternatively, include this `vercel.json`:
```json
{
  "version": 2,
  "builds": [{ "src": "index.html", "use": "@vercel/static" }],
  "routes": [{ "src": "/(.*)", "dest": "/$1" }]
}
```

## Tokens
- Base tokens: `--bg, --surface, --text, --muted, --primary, --accent, --success, --warn, --danger, --border, --ring`
- Theme attribute: `<html data-theme="light|dark">` controls mixes via `--shade`

## License
MIT © 2025 Habbi2

## Credits
- Design & Development: Habbi Web Design — https://www.habbiwebdesign.site/