# CLAUDE.md — BaristaAI

Guidelines for AI assistants working on this repository.

---

## Project Overview

**BaristaAI** (aibarista) is an AI-powered coffee recipe generator and business
calculator for coffee shop owners and baristas in the Czech Republic. The entire
application is a single self-contained HTML file with no build system, no
backend, and no dependencies beyond Google Fonts and the Anthropic API.

- **UI language**: Czech
- **Code comments**: English
- **Currency**: Czech Koruna (CZK)
- **Target market**: Czech Republic

---

## Repository Structure

```
aibarista/
├── index.html   # The complete application (~1 100 lines, ~54 KB)
├── README.md    # One-line description
└── CLAUDE.md    # This file
```

Everything — HTML structure, CSS styles, and JavaScript logic — lives in
`index.html`. There are no separate source files, modules, or assets.

---

## Architecture

### Single-File SPA

The file is split into three logical sections inside `index.html`:

| Section | Lines (approx.) | Content |
|---------|-----------------|---------|
| `<style>` | 1–~500 | All CSS, including CSS custom properties and animations |
| `<body>` | ~500–~660 | HTML markup — form, result panels, gate overlay |
| `<script>` | ~660–1 103 | All JavaScript application logic |

### CSS Design Tokens (`:root`)

```css
--red:     #c0392b   /* main accent */
--red-soft:#e8504a   /* hover state */
--red-pale:#fdf0ef   /* tinted backgrounds */
--espresso:#2c1a0e   /* headings / header background */
--roast:   #5c3520   /* medium brown */
--latte:   #c4a882   /* warm tan */
--cream:   #faf6f0   /* warm white */
--sage:    #6a9e7a   /* success / kids-drink indicator */
--bg:      #f7f2eb
--surface: #fffcf8
--text:    #2c1a0e
--muted:   #8a7060
```

Always use these variables; never hard-code colour values.

### JavaScript State

All mutable state lives in module-level variables:

```js
let _labor     = 0;    // labour + energy cost per portion (CZC)
let _marginPct = 70;   // gross margin percentage (30–90)
let _ingredients = []; // array of {name, amount, cost} objects
```

### Key Functions

| Function | Purpose |
|----------|---------|
| `generateRecipe()` | Builds the Claude prompt, calls the Anthropic API, renders result |
| `renderRecipe(r)` | Populates all result panels from the parsed JSON recipe |
| `renderIngTable(ings)` | Renders the editable ingredient table |
| `redrawTable()` | Re-renders the ingredient table and calls `recalc()` |
| `recalc()` | Recomputes total cost and recommended sell price from current state |
| `onSlider(v)` | Updates `_marginPct` and triggers `recalc()` |
| `renderMarket(m)` | Displays comparable market drinks |
| `upd(i, f, v)` | Updates a single field of `_ingredients[i]` in-place |
| `delRow(i)` / `addRow()` | Manage ingredient rows |
| `checkAccessCode()` | Validates the access gate code against stored codes |
| `checkExistingSession()` | Restores a valid session from `sessionStorage` |
| `resetForm()` | Clears all inputs and result panels back to initial state |
| `czk(v)` | Formats a number as Czech Koruna string |
| `esc(s)` | HTML-escapes a string (use before inserting user data into `innerHTML`) |
| `getDemo()` | Returns a hardcoded demo recipe object (used as API fallback) |

### Anthropic API Integration

- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Model**: `claude-sonnet-4-20250514`
- **Auth header**: `x-api-key` with the embedded key
- **Special header**: `anthropic-dangerous-direct-browser-access: true`
- The API key is **embedded directly in the JavaScript** (see Security section).
- The response is expected to be valid JSON inside the first `content[0].text`.
  The code strips markdown fences before `JSON.parse()`.
- On any error the application silently falls back to `getDemo()`.

### Access Gate

The application is protected by a simple code-based gate:

- Default codes are defined in `getDefaultCodes()` (line ~1 009).
- Custom codes can be stored in `localStorage` via `saveAccessCodes()`.
- A valid session is written to `sessionStorage`; `checkExistingSession()` on
  load bypasses the gate when a valid session exists.
- `formatGateCode()` auto-formats input as `XXXX-XXXX-XXXX`.

---

## Development Workflow

### Running the Application

Open `index.html` directly in a browser — no server required for basic use.

For testing API calls from a local file you may need a local HTTP server to
avoid browser CORS restrictions:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

### Making Changes

1. Edit `index.html` directly.
2. Reload the browser — no build step needed.
3. Use browser DevTools for debugging.

### No Testing Framework

There are no automated tests. Validate changes manually by exercising the
full user flow:
- Enter a concept and select options.
- Generate a recipe and verify the result panels appear correctly.
- Edit ingredient rows and confirm `recalc()` updates prices.
- Move the margin slider and confirm the sell price updates.
- Test the access gate with a valid and an invalid code.

---

## Conventions

### HTML / CSS

- Use semantic HTML elements.
- All styles go inside the single `<style>` block.
- Always use CSS custom properties for colours and spacing — never inline hex
  values.
- Class names use kebab-case (e.g. `result-card`, `tag-btn`).

### JavaScript

- No frameworks, no modules, no `import`/`export`.
- All code is in a single `<script>` block at the end of `<body>`.
- Use `document.getElementById()` for DOM access; avoid `querySelector` for
  frequently-called paths.
- State mutation goes through the three module-level variables (`_labor`,
  `_marginPct`, `_ingredients`). Always call `recalc()` after changing them.
- **Never** use `eval()` or `new Function()`.
- Escape all user-supplied or API-supplied strings with `esc()` before
  inserting into `innerHTML`.
- Format currency values with `czk(v)` — do not format manually.
- Czech UI strings belong in the HTML or as string literals in JS. Do not
  introduce a separate i18n layer.

### Commit Messages

Use short, imperative English commit messages:

```
Add alcohol detection to recipe prompt
Fix margin slider not updating on mobile
Remove hardcoded demo fallback price
```

---

## Security Notes

> **The Anthropic API key is hardcoded in `index.html`.**
> This is a known, intentional trade-off for this prototype.
> Do **not** log, print, or expose the key further.
> Do **not** commit a replacement key without confirming with the repository owner.

Additional points:
- Always use `esc()` before inserting any external string into `innerHTML` to
  prevent XSS.
- The access gate stores codes in `localStorage` — treat them as low-security
  tokens, not secrets.
- Session state is kept in `sessionStorage` (cleared on tab close).

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `master` | Stable / production |
| `claude/claude-md-*` | AI-generated feature branches |

When working as an AI assistant:
- Develop on the designated `claude/…` branch.
- Commit with clear messages.
- Push with `git push -u origin <branch-name>`.
- Never push directly to `master` without explicit permission.

---

## Out of Scope

The following are intentionally absent and should **not** be added unless
explicitly requested:

- Build tooling (webpack, Vite, Rollup, etc.)
- npm / package.json
- TypeScript
- Testing frameworks
- Backend server
- Database
- Docker / CI/CD pipeline
