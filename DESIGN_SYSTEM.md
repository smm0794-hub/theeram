# Theeram Spaces — Brand & Design System

Reference guide derived from the brand identity guidelines (`Design_ideas.zip`) and applied across the public directory and Curator workspace.

---

## 1. Color Palette

### Primary Colors
| Token | Name | Hex | Usage |
|---|---|---|---|
| `C.lime` | Green Grass (Light) | `#78E040` | Primary CTAs, active highlights, `>>` chevrons, dark-bg accents |
| `C.limeDark` | Green Grass (Dark) | `#58C922` | Hover states, high-contrast light-bg accents, badges |
| `C.limePill` | Soft Lime Pill | `#C4F596` | Status pills, category tags, hero location badge |
| `C.cream` / `C.bg` | Gray Storm (Light) | `#F4F5F3` | Primary page canvas, light surfaces |
| `C.text` / `C.dark` | Gray Storm (Dark) | `#111211` | Primary ink typography, dark buttons, footer |

### Secondary Colors
| Token | Name | Hex | Usage |
|---|---|---|---|
| `C.green` | Olive Garden | `#173B13` | Hero backgrounds, primary dark cards, curator headers, active tabs |
| `C.green2` | Deep Olive | `#0F290C` | Nested dark surfaces, trust bars, hover states |
| `C.gold` / `C.butter` | Orange Juice | `#FCE08B` | Featured hero showcase cards, highlight callouts, owner CTAs |
| `C.butterSoft` | Soft Butter | `#FEF3D1` | Warm editorial card backgrounds, quick-stat blocks |
| `C.lavender` | Lavender Tea | `#E5DDF5` | Editorial badge tags, secondary card surfaces |
| `C.sage` / `C.mintTint` | Mint Wash | `#EDFCE6` | Featured "Theeram Pick" card backgrounds |
| `C.muted` | Muted Ink | `#525750` | Secondary body copy, metadata labels |
| `C.cream3` / `C.border` | Subtle Border | `#DCE0D8` | Hairline dividers, card borders, input outlines |

---

## 2. Typography

- **Display / Headings (`serif` / `font-display`)**: **Montserrat** (Weights: `700`, `800`, `900`)
  - Used for `h1`–`h3`, town names, property/maker titles, stat numbers, and primary button labels.
  - Tight tracking (`-0.025em`) for bold editorial presence.
- **Body / UI (`sans`)**: **Inter** (Weights: `300`, `400`, `500`, `600`, `700`, plus italic)
  - Used for descriptions, filter chips, form inputs, navigation, and metadata.

Loaded globally via `next/font/google` in `src/app/layout.tsx` with CSS variables `--font-montserrat` and `--font-inter`.

---

## 3. Visual Motifs & Shapes

1. **Asymmetric Chamfered Corners (`.shape-chamfer-tr`, `.shape-chamfer-card`)**
   - Top-right corner receives an expressive `40px–56px` radius (`border-radius: 16px 44px 16px 16px`) on hero showcase cards, venue visual headers, and CTA panels.
2. **`>>` Tone-of-Voice Chevrons**
   - Used in `SectionLabel`, `GoldLabel`, trust tickers, and editorial callouts (`>> Approachable`, `>> Direct Owner Connect`).
3. **Geometric Line Graphics & Halftone Dot Grids (`.dot-grid`, `.dot-grid-light`)**
   - Subtle concentric octagon SVG line art in dark hero headers.
   - Subtle radial dot grids on warm butter (`#FCE08B`) and olive (`#173B13`) surfaces.
4. **Pill Badges**
   - Compact `999px` rounded tags in Soft Lime (`#C4F596`), Ink (`#111211`), or Lavender (`#E5DDF5`) for status, location, and category indicators.

---

## 4. Tone of Voice

- **Approachable**: Warm, neighbourly language — talk directly to owners on WhatsApp.
- **Straight-forward**: Clear capacity, transparent starting price guides, zero jargon.
- **Informative & Positive**: Highlight what makes each Kerala *tharavadu*, riverside lawn, or event maker special.
