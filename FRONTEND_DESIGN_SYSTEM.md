# VRPFR Frontend Design System
## Complete Identity for Mobile App Development

---

## 1. COLOR PALETTE

### Primary Color System (OKLCH Color Space)

| Name | OKLCH Value | Hex Approx | Usage |
|------|-------------|-----------|-------|
| **Background** | `oklch(0.13 0.02 250)` | #0f0f1a | Main dark navy background |
| **Foreground** | `oklch(0.98 0 0)` | #fafafa | Off-white text |
| **Primary** | `oklch(0.72 0.18 35)` | Warm Coral | CTAs, accents, focus rings |
| **Secondary** | `oklch(0.22 0.02 250)` | Medium Navy | Secondary actions |
| **Card** | `oklch(0.16 0.02 250)` | Slightly Lighter Navy | Card backgrounds |
| **Muted** | `oklch(0.20 0.02 250)` | Muted Navy | Disabled/secondary elements |
| **Muted Foreground** | `oklch(0.65 0 0)` | Gray | Secondary text |
| **Border** | `oklch(0.25 0.02 250)` | Subtle Navy | Borders |
| **Destructive** | `oklch(0.577 0.245 27.325)` | Red | Errors, warnings |
| **Ring** | `oklch(0.72 0.18 35)` | Coral | Focus rings |

### Sidebar Colors
- Sidebar BG: `oklch(0.11 0.02 250)` - Darker navy for contrast
- Sidebar Accent: `oklch(0.18 0.02 250)` - Highlight
- Sidebar Primary: `oklch(0.72 0.18 35)` - Coral accent

### Data Visualization (Chart Colors)
- Chart 1: `oklch(0.72 0.18 35)` - Primary Coral
- Chart 2: `oklch(0.65 0.15 200)` - Cyan/Teal
- Chart 3: `oklch(0.75 0.12 80)` - Yellow/Lime
- Chart 4: `oklch(0.60 0.20 320)` - Purple/Magenta
- Chart 5: `oklch(0.55 0.18 180)` - Cyan Accent

### Design Philosophy
- **Deep navy + warm coral**: Professional yet approachable
- **High contrast**: Excellent readability on dark backgrounds
- **OKLCH color space**: Modern, perceptually accurate colors
- **Dark-first approach**: Entire palette optimized for dark backgrounds

---

## 2. TYPOGRAPHY

### Font Families

| Font | Source | Weights | Usage |
|------|--------|---------|-------|
| **Geist** | Google Fonts | 300, 400, 500, 600, 700, 800, 900 | Default UI font, sans-serif |
| **Instrument Serif** | Google Fonts | Regular, Italic | Display headings, emphasis |
| **JetBrains Mono** | Google Fonts | 400, 500, 600 | Code, monospace content |

### Font Features Applied Globally
```
font-feature-settings: 'ss01', 'cv11', 'ss03';
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

### Typography Scale

| Usage | Class/Style | Example |
|-------|-----------|---------|
| **Hero Headings** | `font-display text-5xl md:text-7xl leading-[0.95] tracking-tight` | Large display (80-112px) |
| **Section Headings** | `font-display text-3xl md:text-4xl` | (32-48px) |
| **Body Text** | `text-base md:text-lg leading-relaxed` | 16-18px line height 1.625 |
| **Small Text** | `text-xs md:text-sm` | 12-14px |
| **Labels/UI** | `text-[10px] uppercase tracking-[0.35em]` | Small tracked caps |
| **Code** | `font-mono text-sm` | Monospace |

### Display Font Styling
- Font: Instrument Serif, italic
- Letter spacing: -0.02em
- Used for emphasis and visual hierarchy

---

## 3. BORDER RADIUS

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Small elements |
| `--radius-md` | 6px | Medium elements |
| `--radius-lg` | 8px | Standard elements (default) |
| `--radius-xl` | 12px | Large cards, modals |

---

## 4. UI COMPONENTS

### Button Component
**Variants:**
- `default`: Primary coral background, shadow
- `destructive`: Red background for delete/danger
- `outline`: Bordered with hover accent
- `secondary`: Secondary navy background
- `ghost`: Hover only background
- `link`: Text link with underline on hover

**Sizes:**
- `sm`: Small compact button
- `default`: Standard 36px height
- `lg`: Large 40px height
- `icon`: Square icon button

**Styling Pattern:**
```
inline-flex items-center justify-center gap-2 | text-sm font-medium
focus-visible:border-ring focus-visible:ring-[3px]
transition-[color,box-shadow]
```

**Icon Sizing:** Size-4 (16px) by default, smart spacing

### Card Component
```
bg-card text-card-foreground rounded-xl border py-6 shadow-sm
flex flex-col gap-6
```

**Subcomponents:**
- **CardHeader**: `px-6 flex flex-col gap-1.5`
- **CardTitle**: `leading-none font-semibold`
- **CardDescription**: `text-sm text-muted-foreground`
- **CardContent**: `px-6`
- **CardFooter**: `flex items-center px-6`

### Input Component
- Height: `h-9` (36px)
- Padding: `px-3 py-1`
- Border: `border-input`
- Focus ring: `ring-ring/50 ring-[3px]`
- Disabled: `opacity-50 pointer-events-none`

### Badge Component
**Variants:** default, secondary, destructive, outline
```
inline-flex items-center justify-center rounded-md border
px-2 py-0.5 text-xs font-medium
```

### Avatar Component
```
relative flex size-8 shrink-0 overflow-hidden rounded-full
```

### Checkbox
```
size-4 shrink-0 rounded-[4px] border border-input
data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground
focus-visible:ring-ring/50 focus-visible:ring-[3px]
```

### Select Component
- Trigger: `h-9 px-3 py-2 rounded-md border border-input`
- Content: `bg-popover rounded-md border shadow-md`
- Animations: Fade in/out on open/close

### Dialog
- Overlay: `bg-black/80 fixed inset-0 z-50`
- Content: `bg-background max-w-lg rounded-lg border p-6 shadow-lg`

### Alert
- Base: `rounded-lg border px-4 py-3 text-sm`
- Variants: default, destructive
- Icon support: `[&>svg]:size-4`

### Tooltip
```
bg-primary text-primary-foreground
animate-in fade-in-0 zoom-in-95
data-[state=closed]:animate-out data-[state=closed]:fade-out-0
```

### Sidebar Component
- **Desktop Width**: 16rem (64px expanded, 48px collapsed icon mode)
- **Mobile Width**: 18rem
- **Collapsible**: Keyboard shortcut Cmd/Ctrl+B
- **State Persistence**: Cookie-based
- **Responsive**: Sheet overlay on mobile

### Focus & Accessibility Pattern
All interactive elements:
```
focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
```

---

## 5. ANIMATIONS

### Custom Keyframe Animations

#### Shimmer
```
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
Gradient: transparent → white(0.08) → transparent
Duration: 3s linear infinite
```

#### Float (Slow)
```
@keyframes float-slow {
  0%, 100% { transform: translate3d(0,0,0); }
  50% { transform: translate3d(0,-12px,0); }
}
Duration: 6s ease-in-out infinite
```

#### Border Flow
Gradient animation between coral and teal
Duration: 4s ease-in-out infinite

#### VX Radar (Rotating conic gradient)
```
Conic gradient: coral at 20deg, transparent fade
Duration: 3.2s linear infinite
Position: centered, 140% size
Mix-blend-mode: screen
```

#### VX Pulse (Scaling pulse)
```
0% { transform: scale(0.6); opacity: 0.8; }
100% { transform: scale(2.4); opacity: 0; }
```

#### VX Grid Fade (Pulsing grid)
```
0%, 100% { opacity: 0.25; }
50% { opacity: 0.45; }
```

### Framer Motion Usage
- Entry animations: `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}`
- Staggered children: `delay: index * 0.06`
- Standard duration: 0.5s with easing

### Body Background Animation
Radial gradient accent in background:
```
background-image: radial-gradient(
  ellipse 70% 50% at 50% -20%, 
  oklch(0.72 0.18 35 / 0.06), 
  transparent 70%
)
```

---

## 6. ICON LIBRARY

### Icon Source: lucide-react (v0.475.0+)

**Icon Usage Pattern:**
```
<IconName className="size-4" />  // Default
<IconName className="size-6" />  // Larger
<IconName className="size-8" />  // Extra large
```

**Common Icons Used:**
- Navigation: Menu, Search, LayoutGrid, Folder, BookOpen
- UI: ChevronDown, ChevronUp, XIcon, CheckIcon
- User: Settings, LogOut, Eye, EyeOff
- Status: Loader2Icon (animated with animate-spin), ScanLine
- Arrow: ArrowRight
- Layout: PanelLeftOpenIcon, PanelLeftCloseIcon

**SVG Styling:**
- Smart default sizing: `[&_svg:not([class*='size-'])]:size-4`
- Pointer events disabled in buttons
- Shrink-0 applied for flex layouts

---

## 7. SPACING & LAYOUT

### Spacing System
- **Base Unit**: 0.25rem (4px)
- **Gaps**: 4px → 48px (gap-1 to gap-12)
- **Padding**: `px-3` (12px) horizontal, `py-2` (8px) vertical standard
- **Margins**: Flexbox gaps preferred over margin

### Responsive Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Fluid Typography Pattern
```
text-[clamp(3.5rem, 10vw, 8rem)]
```
Scales responsively between min/max sizes

---

## 8. LAYOUT COMPONENTS

### AppShell Component
Wrapper for two layout variants:
- `variant='sidebar'`: Sidebar + main content
- `variant='header'`: Header + main content

### AppHeader Component
- Height: `h-16` (64px)
- Features: Mobile menu, breadcrumbs, user avatar
- Responsive: Sheet overlay on mobile

### AppSidebar Component
- Collapsible with smooth animations
- Icons with labels (expanded) or icon-only (collapsed)
- Navigation items with active state highlighting

---

## 9. FORM PATTERNS

### Standard Form Field
```
<div className="flex flex-col gap-2">
  <Label htmlFor="field">Field Label</Label>
  <Input id="field" placeholder="..." />
  {error && <p className="text-xs text-destructive">{error}</p>}
</div>
```

### Form Validation
- Error text: Red (`text-destructive`)
- Size: `text-xs`
- Success: Green check with badge

### Form Groups
```
<div className="flex flex-col gap-4">
  {/* Multiple form fields */}
</div>
```

---

## 10. CSS CUSTOM VARIABLES (Complete Reference)

```css
/* Base Colors */
--background: oklch(0.13 0.02 250)
--foreground: oklch(0.98 0 0)
--card: oklch(0.16 0.02 250)
--card-foreground: oklch(0.98 0 0)
--popover: oklch(0.16 0.02 250)
--popover-foreground: oklch(0.98 0 0)
--primary: oklch(0.72 0.18 35)
--primary-foreground: oklch(0.13 0.02 250)
--secondary: oklch(0.22 0.02 250)
--secondary-foreground: oklch(0.98 0 0)
--muted: oklch(0.20 0.02 250)
--muted-foreground: oklch(0.65 0 0)
--accent: oklch(0.72 0.18 35)
--accent-foreground: oklch(0.13 0.02 250)
--destructive: oklch(0.577 0.245 27.325)
--destructive-foreground: oklch(0.98 0 0)
--border: oklch(0.25 0.02 250)
--input: oklch(0.22 0.02 250)
--ring: oklch(0.72 0.18 35)

/* Sidebar Colors */
--sidebar: oklch(0.11 0.02 250)
--sidebar-foreground: oklch(0.98 0 0)
--sidebar-primary: oklch(0.72 0.18 35)
--sidebar-primary-foreground: oklch(0.13 0.02 250)
--sidebar-accent: oklch(0.18 0.02 250)
--sidebar-accent-foreground: oklch(0.98 0 0)
--sidebar-border: oklch(0.25 0.02 250)
--sidebar-ring: oklch(0.72 0.18 35)

/* Chart Colors */
--chart-1: oklch(0.72 0.18 35)
--chart-2: oklch(0.65 0.15 200)
--chart-3: oklch(0.75 0.12 80)
--chart-4: oklch(0.60 0.20 320)
--chart-5: oklch(0.55 0.18 180)

/* Spacing */
--radius: 0.5rem
--radius-sm: 4px
--radius-md: 6px
--radius-lg: 8px
--radius-xl: 12px

/* Fonts */
--font-sans: 'Geist', ui-sans-serif, system-ui, sans-serif
--font-serif: 'Instrument Serif', ui-serif, Georgia, serif
--font-mono: 'JetBrains Mono', ui-monospace, monospace
```

---

## 11. KEY DESIGN PRINCIPLES

### Visual Identity
✓ **Quiet studio aesthetic** - Restrained, purposeful design  
✓ **Deep navy + coral warmth** - Professional yet approachable  
✓ **Generous whitespace** - Breathing room between elements  
✓ **High contrast text** - Excellent readability  
✓ **Subtle animations** - Elegant, purposeful motion  
✓ **Typography-driven** - Serif for emphasis, sans-serif for UI  

### Interactive State Pattern
```
Default → Hover → Focus → Disabled
Colors:  primary → primary/90 → ring accent → opacity-50
```

### Accessibility
- Focus rings: 3px coral rings with proper contrast
- Disabled states: Reduce opacity to 0.5
- Color not the only indicator: Supported by icons/text
- Font sizes: Minimum 12px with proper line-height

### Performance Utilities
- GPU acceleration: `.gpu { transform: translate3d(0,0,0); backface-visibility: hidden; }`
- Will-change: Applied to animated elements
- Lazy-loading: Images use placeholders

---

## 12. DESIGN FILE LOCATIONS

### Core Styling
- **Main CSS**: `resources/css/app.css` - All colors, fonts, animations, utilities
- **Layout**: Components in `resources/js/components/`

### Component Library
- **UI Components**: `resources/js/components/ui/` (25+ components)
- **Layout Components**: `resources/js/components/` (app-shell, app-header, app-sidebar)
- **Landing Components**: `resources/js/components/landing/` (hero, features, CTA sections)
- **Dashboard Components**: `resources/js/components/dashboard/` (stats, charts, tables)

### Configuration
- **Vite**: `vite.config.ts`
- **TypeScript**: `tsconfig.json`
- **shadcn/ui**: `components.json`
- **Build**: `package.json`, `pnpm-workspace.yaml`

---

## 13. NPM DEPENDENCIES - UI & STYLING

```json
{
  "@headlessui/react": "^2.2.0",
  "@radix-ui/react-avatar": "^1.1.3",
  "@radix-ui/react-checkbox": "^1.1.4",
  "@radix-ui/react-dialog": "^1.1.6",
  "@radix-ui/react-dropdown-menu": "^2.1.6",
  "@radix-ui/react-label": "^2.1.2",
  "@radix-ui/react-separator": "^1.1.2",
  "@radix-ui/react-toggle": "^1.1.2",
  "@radix-ui/react-tooltip": "^1.1.8",
  "@tailwindcss/vite": "^4.1.11",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "framer-motion": "^12.38.0",
  "input-otp": "^1.4.2",
  "lucide-react": "^0.475.0",
  "recharts": "^3.8.1",
  "sonner": "^2.0.0",
  "tailwind-merge": "^3.0.1",
  "tailwindcss": "^4.0.0",
  "tw-animate-css": "^1.4.0"
}
```

---

## 14. COMPONENT SUMMARY TABLE

| Component | Location | Variants | Key Feature |
|-----------|----------|----------|------------|
| **Button** | `ui/button.tsx` | 6 variants | CVA-based with icon support |
| **Card** | `ui/card.tsx` | - | Header, content, footer sections |
| **Input** | `ui/input.tsx` | Text, email, password, file | Accessible with focus ring |
| **Badge** | `ui/badge.tsx` | 4 variants | Colored status indicators |
| **Avatar** | `ui/avatar.tsx` | - | Image + fallback initials |
| **Checkbox** | `ui/checkbox.tsx` | Checked/unchecked | Radix-based |
| **Select** | `ui/select.tsx` | - | Dropdown with animations |
| **Dialog** | `ui/dialog.tsx` | - | Modal overlay with close button |
| **Alert** | `ui/alert.tsx` | 2 variants | Icon + title + description |
| **Toggle** | `ui/toggle.tsx` | On/off states | Binary state trigger |
| **Tooltip** | `ui/tooltip.tsx` | - | Hover popover |
| **Separator** | `ui/separator.tsx` | H/V | Visual divider |
| **Label** | `ui/label.tsx` | - | Form field label |
| **Spinner** | `ui/spinner.tsx` | - | Rotating loader icon |
| **OTP Input** | `ui/input-otp.tsx` | - | Multi-digit code input |
| **Sidebar** | `ui/sidebar.tsx` | Expanded/Collapsed | 16rem / 3rem widths |
| **App Shell** | `app-shell.tsx` | Sidebar/Header | Layout wrapper |
| **App Header** | `app-header.tsx` | - | 64px top nav bar |
| **App Sidebar** | `app-sidebar.tsx` | - | Collapsible side nav |

---

## Quick Reference: Theming for Mobile

To replicate this design system in your mobile app, ensure:

1. **Use OKLCH colors** - They render consistently across devices
2. **Font fallbacks**: Geist → Helvetica Neue → system sans-serif
3. **Dark mode by default** - Entire palette is dark-optimized
4. **Coral accents** - Primary actions and focus states
5. **Responsive sizing** - Use fluid typography scaling
6. **Animations** - Keep hover/focus animations smooth with 0.3-0.5s durations
7. **Spacing**: 4px base unit (not 8px) for tighter European-style layouts
8. **Shadows**: Minimal, subtle shadows (`shadow-sm`) for depth
9. **Borders**: Subtle navy borders, not black
10. **Focus states**: Always visible coral rings

---

This design system provides complete visual consistency between your web and mobile applications. All hex/RGB values can be derived from the OKLCH values using standard color space conversion tools.
