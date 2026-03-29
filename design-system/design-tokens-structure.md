# Design token structure (`tokens.json`)

This document summarizes how Figma variables are represented in `tokens.json`: top-level groupings, token categories, and **how collections connect** through aliases and modes.

## Top-level layout

| Branch | Role in Figma |
|--------|----------------|
| **`primitives.mobile`** | Primitive collection values resolved for the **mobile** breakpoint mode (typography sizes, line heights, and related overrides). |
| **`primitives.desktop`** | Same primitive **schema** as mobile; **numeric typography** (and line-height) scales are larger on desktop; small differences may appear in effects (e.g. shadow). |
| **`semantic.Light`** | Semantic color and interaction tokens for the **Light** theme mode. |
| **`semantic.Dark`** | Same semantic **paths** as Light (`Color.*`, `interactive state.*`) for the **Dark** theme mode. |

The root **`$description`** states that primitives are split by breakpoint (mobile/desktop) and semantic tokens by theme (Light/Dark).

---

## Design Tokens format and Figma metadata

Each leaf token follows the **Design Tokens Community Group** style:

- **`$type`** — e.g. `color`, `string`, `number`.
- **`$value`** — resolved value (colors as sRGB objects with `hex`; numbers as raw values).
- **`$extensions`** — Figma-specific data:
  - **`com.figma.variableId`** — Stable ID of the variable in the Figma file (e.g. `VariableID:22:9263`). The **same ID** can appear under both `semantic.Light` and `semantic.Dark` for the same role; resolved **`$value`** differs by theme.
  - **`com.figma.scopes`** — Where Figma allows the variable to apply (`ALL_SCOPES`, `TEXT_CONTENT`, `CORNER_RADIUS`, `WIDTH_HEIGHT`, `GAP`, `EFFECT_FLOAT`, etc.).
  - **`com.figma.isOverride`** — Mode override flag when exporting.
  - **`com.figma.aliasData`** — Present on **semantic** tokens that **reference** another collection (see below).
  - **`com.figma.type`** — Extra hint for string tokens (e.g. font family).

---

## Connection between variable collections

### 1. Primitives collection (`_Primitives`)

Semantic tokens that alias primitives carry:

```json
"com.figma.aliasData": {
  "targetVariableId": "…",
  "targetVariableName": "color/neutral/50",
  "targetVariableSetId": "VariableCollectionId:37442cccaf2bd7e04bc6b390f7e6b52a1e78c464/-1:-1",
  "targetVariableSetName": "_Primitives"
}
```

- **`targetVariableSetName`** is always **`_Primitives`** in this file: the **semantic** layer points at the **primitive** variable collection.
- **`targetVariableName`** uses Figma’s slash path (e.g. `color/primary/500`, `color/neutral/00`, `color/opacity-dark/opacity-light-4%`). That path matches the hierarchy under **`primitives.mobile.color`** / **`primitives.desktop.color`** (e.g. `color.neutral.50` ↔ `color/neutral/50` with naming convention differences: `00` vs `"00"` key).
- **`targetVariableId`** is the primitive variable’s ID in Figma (hash form in the export).

So the **connection point** between collections is: **semantic variable → alias → primitive variable** in `_Primitives`, with the export **also** baking the resolved color into `$value` for portability.

### 2. Primitives in this JSON file

Under **`primitives.mobile`** / **`primitives.desktop`**, tokens **do not** use `aliasData` in the same way; they are the **raw scales** (and typography, utilities, shadows). They use **`com.figma.variableId`** only. This file is a **flattened merge** of breakpoint modes, not a separate Figma “semantic” collection.

### 3. Theme connection (Light vs Dark)

Under **`semantic.Light`** and **`semantic.Dark`**:

- The **tree shape** matches: `Color` (with `white`, `black`, `bg`, `text`, `stroke`) and **`interactive state`**.
- For a given **semantic role** (e.g. `Color.white`), **`com.figma.variableId`** is often the **same** in Light and Dark, while **`$value`** and **`aliasData.targetVariableName`** change. Example pattern:
  - Light: `white` → aliases **`color/neutral/00`** (white).
  - Dark: `white` → aliases **`color/neutral/1000`** (black)—semantic “white” follows **inversion** via different primitive references.

So themes are modeled in Figma as **modes** on the semantic collection: same variable IDs, different aliases and/or overrides per mode.

### 4. Breakpoint connection (mobile vs desktop)

- **`primitives.mobile`** vs **`primitives.desktop`** duplicate **`color`**, **`typography`**, **`utilities`**, **`shadow`**.
- **Color palettes** align across breakpoints (same scales and groups).
- **Typography `size` and `line-height`** differ by breakpoint (e.g. `display-2xl` is **56** on mobile and **96** on desktop in this export)—this is the main **collection/mode** distinction captured in primitives.

---

## `primitives.*` — what’s inside

### `color`

| Group | Purpose |
|-------|---------|
| `neutral` | Full neutral scale (including `00`, `850`, `1000`, etc.). |
| `primary`, `secondary` | Brand-related scales. |
| `success`, `warning`, `error` | Semantic status scales. |
| `opacity-light`, `opacity-dark` | Transparent white/black tints (used by overlays and effects). |

### `typography`

- **`family`** — `display`, `title`, `body` (e.g. Inter Tight).
- **`weight`** — `regular`, `medium`, `Semibold`.
- **`size`** — Named steps: `display-2xl` … `body-xxs`, `h1`–`h6`, etc.
- **`line-height`** — Named steps (`10xl` … `xxs`) aligned to type scale.

### `utilities`

- **`radius`** — Corner radii (`radius-none` … `radius-rounded`).
- **`spacing`** — Spacing scale (`spacing-3xs` … `spacing-10xl`); scopes include `WIDTH_HEIGHT` and `GAP`.
- **`width`**, **`height`** — Dimension scales (`*-4xs` … `*-10xl`).
- **`stroke`** — Border widths (`stroke-s` … `stroke-xl`).

### `shadow`

- **`shadow-s`**, **`shadow-m`**, **`shadow-l`** — Each decomposed into `shadow-x/y`, `shadow-blur`, `shadow-spread`, `shadow-intensity` (color with alpha). **`shadow-l`** also includes a second layer (`shadow2-*`, `shadow-intensity 2`).

---

## `semantic.*` — what’s inside

### `Color`

- **`white`**, **`black`** — Baseline references into primitives (via `aliasData`).
- **`bg`** — Nested by intent: `brand`, `primary`, `secondary`, `tertiary`, `success`, `warning`, `error`; each contains tokens like `bg-*`, `bg-*-solid`, `bg-inversed-*` as applicable.
- **`text`** — Flat list: `text-primary`, `text-secondary`, `text-brand`, `text-inversed-primary`, `text-tertiary`, `text-success`, `text-error`, `text-warning`.
- **`stroke`** — `stroke-primary`, `stroke-secondary`, `stroke-active`, `stroke-light`, `stroke-dark`.

### `interactive state`

- **`bg-disabled`**, **`text-disabled`**
- **`overlay-hover-subtle`**, **`overlay-hover-strong`**, **`overlay-pressed-subtle`**, **`overlay-pressed-strong`** — Often alias **`color/opacity-dark/...`** primitives (semi-transparent black overlays on light UI); Dark mode may resolve overlays differently in Figma (check `$value` and `aliasData` per theme).

---

## Practical notes for code

1. **Resolved values** — `$value` is always present; you can build CSS without resolving aliases manually.
2. **Tracing to Figma** — Use `com.figma.variableId` and `aliasData.targetVariableName` to map back to the file.
3. **Theming** — Switch **`semantic.Dark`** vs **`semantic.Light`** for semantic colors; combine with **`primitives.mobile`** or **`primitives.desktop`** for responsive type and shared radii/spacing.
4. **Naming** — Semantic keys use **PascalCase** top-level (`Color`) and **kebab-case** leaf names (`text-primary`); primitives use **nested lowercase** groups (`color.neutral.50`).
