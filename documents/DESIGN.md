---
design_system:
  name: "ClubSphere Design System"
  version: "1.0.0"
  author: "Principal Product Design & Systems Architecture Team"
  license: "Apache-2.0"
  description: "Enterprise-grade design system specification for ClubSphere, defining visual tokens, interaction states, responsive layouts, and accessibility standards for AI coding agents and frontend engineers."

tokens:
  colors:
    brand:
      primary: "#1A73E8"          # Google Blue - Primary Call-to-Action
      primary_hover: "#1557B0"    # Darkened state on hover
      primary_active: "#0D47A1"   # Pressed / Active state
      primary_subtle: "#E8F0FE"   # Tinted background for badges/active tabs
      surface: "#FFFFFF"          # Card & Dialog Background
      background: "#F8F9FA"        # App Canvas Background
    neutral:
      slate_50: "#F8FAFC"
      slate_100: "#F1F5F9"
      slate_200: "#E2E8F0"        # Standard Borders
      slate_300: "#CBD5E1"        # Input Borders
      slate_400: "#94A3B8"        # Placeholder Text
      slate_500: "#64748B"        # Secondary Label & Metadata
      slate_700: "#334155"        # Subheading Text
      slate_800: "#1E293B"
      slate_900: "#0F172A"        # High-Contrast Headings & Body
    status:
      success: "#1E8E3E"          # Google Green - Check-in Valid / Dues Active
      success_surface: "#E6F4EA"
      success_border: "#CEEAD6"
      warning: "#F9AB00"          # Google Amber - Expiring Dues / Low Stock
      warning_surface: "#FEF7E0"
      warning_border: "#FEEFC3"
      danger: "#D93025"           # Google Red - Duplicate Scan / Void / Overdue
      danger_surface: "#FCE8E6"
      danger_border: "#FAD2CF"
      info: "#1A73E8"
      info_surface: "#E8F0FE"
      info_border: "#D2E3FC"

  typography:
    font_families:
      sans: "'Google Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      mono: "'JetBrains Mono', 'Roboto Mono', SFMono-Regular, monospace"
    scales:
      display:
        size: "2.25rem"     # 36px
        line_height: "2.75rem" # 44px
        weight: "700"
        letter_spacing: "-0.02em"
      title_1:
        size: "1.75rem"     # 28px
        line_height: "2.25rem" # 36px
        weight: "600"
        letter_spacing: "-0.015em"
      title_2:
        size: "1.375rem"    # 22px
        line_height: "1.75rem" # 28px
        weight: "600"
        letter_spacing: "-0.01em"
      title_3:
        size: "1.125rem"    # 18px
        line_height: "1.5rem"  # 24px
        weight: "600"
      body_large:
        size: "1rem"        # 16px
        line_height: "1.5rem"  # 24px
        weight: "400"
      body_medium:
        size: "0.875rem"    # 14px
        line_height: "1.25rem" # 20px
        weight: "400"
      caption:
        size: "0.75rem"     # 12px
        line_height: "1rem"    # 16px
        weight: "500"
        letter_spacing: "0.02em"
      code:
        family: "mono"
        size: "0.8125rem"   # 13px
        line_height: "1.125rem"
        weight: "500"

  elevation:
    shadow_card: "0 1px 3px 0 rgba(60,64,67,0.12), 0 2px 6px 2px rgba(60,64,67,0.06)"
    shadow_dropdown: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.06)"
    shadow_modal: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)"
    shadow_scanner_hud: "0 25px 50px -12px rgba(0,0,0,0.6)"

  radii:
    none: "0px"
    sm: "4px"
    md: "8px"
    lg: "12px"
    xl: "16px"
    pill: "9999px"

  spacing:
    0: "0px"
    1: "4px"
    2: "8px"
    3: "12px"
    4: "16px"
    5: "20px"
    6: "24px"
    8: "32px"
    10: "40px"
    12: "48px"
    16: "64px"

  breakpoints:
    mobile: "320px"
    tablet: "768px"
    desktop: "1024px"
    wide: "1280px"
---

# ClubSphere (DESIGN.md)

## 1. Brand Philosophy & Aesthetic Foundations
**ClubSphere** embodies clarity, velocity, and institutional trust. Student leaders operate under extreme time pressure; therefore, every pixel must prioritize rapid scannability over decorative distraction.

* **Primary Visual Tone:** Clean, Google-inspired utility with crisp typography, purposeful whitespace, and authoritative feedback.
* **Zero Cognitive Fatigue:** High-frequency workflows (door scanning, expense submission, inventory decrement) require immediate tactile, acoustic, and visual feedback.
* **Deterministic Information Density:** Tabular financial ledgers and roster lists default to dense, monospaced numerical layouts to facilitate end-of-semester auditing.

---

## 2. Token Application Rules

### 2.1 Color Semantics
* `brand.primary` (`#1A73E8`) must be used exclusively for primary calls to action (e.g., "Confirm Check-in", "Complete Order", "Publish Announcement"). Never use for destructive actions.
* `status.success` (`#1E8E3E`) and `status.success_surface` (`#E6F4EA`) are reserved for positive terminal states: valid ticket check-ins, active membership confirmation, and reconciled ledger balances.
* `status.danger` (`#D93025`) and `status.danger_surface` (`#FCE8E6`) signal critical friction: duplicate door scans, expired membership locks, and rejected expense reimbursements.
* `neutral.slate_900` (`#0F172A`) is used for primary headings, while `neutral.slate_500` (`#64748B`) handles metadata, timestamps, and breadcrumb trails.

### 2.2 Typography Hierarchy
* Use `font_families.sans` for all interface chrome, narrative copy, and executive dashboards.
* Use `font_families.mono` for all numerical currency figures (`$25.00`), ticket codes (`TCK-8942-XF91`), SKUs (`SKY-HD26-BLK-M`), and student ID numbers. This prevents vertical misalignment in financial data grids.

---

## 3. Core Component Specifications & Interaction States

### 3.1 Rapid Door Scanner HUD (`/scanner/[eventId]`)
The Door Scanner is a specialized PWA view built for high-throughput mobile verification in low-light, loud campus environments.

* **Viewfinder Architecture:** Full-screen camera stream with an overlaid translucent dark mask (`rgba(0,0,0,0.65)`).
* **Scan Target:** Centered 280x280px reticle with 16px corner indicators styled with `radii.lg` and a pulsing blue laser line.
* **State Machine:**
  * **Idle / Seeking:** Video stream active at 60fps; reticle corners pulse softly (`opacity: 0.8` to `1.0`).
  * **Success Verification (< 180ms):**
    * Reticle border turns `status.success` (`#1E8E3E`).
    * Fullscreen transient green flash (`status.success_surface`).
    * Haptic single vibration (`navigator.vibrate(50)`).
    * Audio 440Hz positive sine-wave chime.
    * Slide-up bottom card presenting attendee name, student ID, and tier badge.
    * Auto-dismisses and resets after 1,200ms.
  * **Duplicate / Rejected Verification:**
    * Reticle border turns `status.danger` (`#D93025`).
    * Fullscreen warning red flash (`status.danger_surface`).
    * Triple haptic buzz (`navigator.vibrate([100, 50, 100, 50, 100])`).
    * Low-frequency warning buzz.
    * Persistent modal stating: "ALREADY CHECKED IN" with original scan timestamp and door station ID. Requires manual button tap to clear.

---

### 3.2 Dual-Entry Financial Ledger Datagrid (`/dashboard/[club]/ledger`)
* **Layout:** High-density, edge-to-edge data table.
* **Column Alignments:**
  * Date/Time (`neutral.slate_500`, Left aligned).
  * Entry Number (`font_families.mono`, Left aligned).
  * Description & Reference Link (Left aligned).
  * Account Classification (Centered pill badge).
  * Debit / Credit Columns (Right-aligned, monospaced, zero-padded decimals).
* **Row States:**
  * *Default:* Clean white background (`brand.surface`), subtle 1px border (`neutral.slate_200`).
  * *Hover:* Subtle highlight (`neutral.slate_50`).
  * *Selected:* `brand.primary_subtle` tint with a 2px blue left accent bar.

---

### 3.3 Collaborative Task & Fundraiser Kanban Board (`/dashboard/[club]/tasks`)
* **Structure:** 5 distinct drop-zone columns (`BACKLOG`, `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`).
* **Task Card Anatomy:**
  * Top Row: Priority indicator badge (`URGENT` in red pill, `MEDIUM` in blue pill).
  * Center: Task Title (Semi-bold, 14px) and Markdown checklist progress bar (e.g., "3 of 5 done").
  * Bottom Row: Assignee avatar circle (with fallback initials) and countdown due date pill (turns red when < 24 hours).
* **Drag-and-Drop Interaction:**
  * Lift state: `elevation.shadow_modal`, `scale(1.02)`, `cursor: grabbing`.
  * Drop target: Column border pulses with 2px dashed `brand.primary`.

---

## 4. Accessibility & Responsive Viewport Rules (WCAG 2.1 AA)

1. **Color Contrast:** Every text/background pair achieves at least a 4.5:1 contrast ratio for normal text and 3:1 for large display headers.
2. **Focus Visibility:** Interactive elements show a deterministic 2px outer outline in `brand.primary` with a 2px offset (`outline: 2px solid #1A73E8; outline-offset: 2px;`) upon `focus-visible`.
3. **Screen Reader Integration:**
   * Dynamic scanner results update a hidden ARIA live region (`<div aria-live="assertive" class="sr-only">`).
   * Announcement reads are annotated with `<article>` and `<time>` semantic elements.
4. **Touch Target Size:** On mobile viewports (`< 768px`), all tap targets (buttons, scanner controls, dropdown items) enforce a minimum hit area of 48x48 physical pixels.
