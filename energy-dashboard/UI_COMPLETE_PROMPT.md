# IoT Energy Dashboard - Complete UI Design Prompt

## Project Overview
**IoT Energy Dashboard** is a modern, responsive real-time energy monitoring and control system built with React 19, utilizing a sophisticated dark-themed glassmorphism design pattern. The application provides comprehensive energy analytics, device control, billing management, and monitoring capabilities for IoT energy management systems, particularly designed for Raspberry Pi deployments.

---

## Technical Stack

### Frontend Framework & Libraries
- **React 19.2.0** - Core UI library
- **React Router DOM 7.13.0** - Client-side routing and navigation
- **Vite 7.3.1** - Build tool and development server
- **Recharts 2.15.4** - Advanced data visualization charting library
- **Tailwind CSS 3.4.14** - Utility-first CSS framework
- **React Icons 5.2.1** - Icon library (using Feather icons - Fi prefix)
- **jsPDF 2.5.1** - PDF generation for bill exports

### Build & Optimization
- PostCSS 8.4.49 - CSS processing pipeline
- Autoprefixer 10.4.20 - Browser vendor prefix automation
- ESLint 9.39.1 - Code quality and consistency
- Tailwind CSS - Compiled with PostCSS for production optimization

### Development Environment
- Node.js module system (ES6)
- Hot Module Replacement (HMR) via Vite
- CORS-enabled development server for backend API communication

---

## Design System

### Color Palette
**Primary Brand Colors:**
- **Background**: `#050b18` (Deep Midnight Blue)
- **Accent Green**: `#10b981` / `rgba(16, 185, 129)` (Emerald-400/500)
- **Accent Cyan**: `#22d3ee` (Cyan-300)
- **Accent Purple**: `#a855f7` (Purple-500)
- **Golden Yellow**: `#fbbf24` (Amber-300/Yellow)

**Neutrals & Overlay Colors:**
- **Slate-300**: `#cbd5e1` (Text/Light Accents)
- **Slate-400**: `#94a3b8` (Secondary Text)
- **Slate-500**: `#64748b` (Tertiary Text)
- **Slate-700**: `#334155` (Borders & Dividers)
- **White with Transparency**: `rgba(255,255,255,0.04-0.15)` (Glass effect overlays)

### Visual Effects & Styling

**Glassmorphism Design Pattern:**
```css
.glass {
  background: linear-gradient(140deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  box-shadow: 0 10px 50px rgba(0, 0, 0, 0.35);
}
```

**Background Grid Pattern:**
- Subtle grid overlay on main container
- Grid size: 36px × 36px
- Opacity: 4% white lines

**Radial Gradient Background:**
- Purple accent (20%, 20%): `rgba(88, 28, 135, 0.25)`
- Blue accent (80%, 0%): `rgba(37, 99, 235, 0.25)`
- Green accent (50%, 70%): `rgba(16, 185, 129, 0.25)`
- Creates atmospheric depth without overwhelming content

**Shadow & Glow Effects:**
- Standard card shadow: `0 10px 50px rgba(0, 0, 0, 0.35)`
- Glow shadow: `0 0 40px rgba(124, 243, 199, 0.25)`
- Emerald glow: `shadow-[0_10px_30px_-18px_rgba(16,185,129,0.8)]`
- Emerald active glow: `shadow-[0_10px_35px_-15px_rgba(16,185,129,0.8)]`

**Typography:**
- **Display Font**: 'Space Grotesk' (brand/headings)
- **Body Font**: 'Inter' (content/UI)
- **Fallbacks**: system-ui, -apple-system, 'Segoe UI', sans-serif
- **Font Rendering**: Optimized with antialiasing enabled

### Spacing & Layout
- **Breakpoints**:
  - Mobile: Base (< 640px)
  - Tablet: `sm` (≥ 640px)
  - Desktop: `lg` (≥ 1024px)
  - Wide: `xl` (≥ 1280px)
- **Gap/Padding Standard**: 4px, 6px, 8px, 12px, 16px, 20px, 24px, 32px units
- **Border Radius**: Primarily rounded-2xl (16px), some rounded-xl (12px)
- **Transitions**: `duration-200` (200ms ease-in-out)

---

## Application Structure

### Main Routes & Navigation
```
/              → Dashboard (Real-time energy overview)
/monitoring    → Monitoring (Live device metrics & status)
/billing       → Billing (Cost tracking & PDF export)
/statistics    → Statistics (Analytics & trends)
/alerts        → Alerts (System notifications & alarms)
/devices       → Devices (Device management & configuration)
/settings      → Settings (System configuration)
```

### Core Layout Architecture

**Two-Column Responsive Layout:**
1. **Left Sidebar** (Hidden on mobile/tablet, visible on xl screens)
   - Logo/branding section
   - Navigation menu with 7 items
   - Active state indicator with glow effect
   - Footer status indicator

2. **Main Content Area** (Flex-grow responsive)
   - Sticky header (Navbar)
   - Dynamic content sections
   - Responsive grid layouts

---

## Component Hierarchy

### Sidebar Component (`Sidebar.jsx`)
**Purpose**: Primary navigation menu with branding

**Features:**
- Logo: "IoT Energy" (uppercase, small) + "Control Center" (heading)
- Navigation Items (7 total) with icon + label pairs:
  - Dashboard (FiGrid)
  - Monitoring (FiMonitor)
  - Billing (FiDollarSign)
  - Statistics (FiBarChart2)
  - Alerts (FiAlertTriangle)
  - Devices (FiBatteryCharging)
  - Settings (FiSettings)
- Active state styling: Emerald highlight + glow shadow
- Responsive behavior: Hidden on `xl:hidden`, visible on `xl:block`
- Status footer: "Demo UI · No hardware connected"

**Styling:**
- Width: `w-64` (256px fixed)
- Height: Full screen (`h-screen`)
- Flex column layout with space-between
- Border right: `1px solid rgba(255,255,255,0.05)`
- Background: Dark with slight backdrop blur

### Navbar Component (`Navbar.jsx`)
**Purpose**: Header with branding, title, and clock display

**Features:**
- **Left Section**: 
  - CPU icon in emerald-themed badge
  - Subtitle (uppercase, small tracking)
  - Dynamic title (default: "Energy Monitoring Dashboard")
- **Right Section**: 
  - Date display (formatted: "Mon, Jan 15")
  - Time display (24-hour, HH:MM:SS format)
  - Both in glassmorphism boxes
- **Clock**: Updates every 1 second (useEffect hook)
- Sticky positioning with z-index: 10

**Styling:**
- Gradient background: From → Through → Transparent
- Responsive flex direction: `flex-col` (mobile) → `md:flex-row` (tablet+)
- Border: 1px white/10 (subtle outline)

### DataCard Component (`DataCard.jsx`)
**Purpose**: Display single metric with gradient accent

**Structure:**
- Title (uppercase, small tracking)
- Large value display with unit
- Icon badge (right side)
- Gradient background layer (visible with opacity)

**Variants (Dashboard):**
1. **Voltage**: Cyan gradient, FiZap icon, 223-238V range
2. **Current**: Green-Cyan gradient, FiActivity icon, 1.4-4.8A range
3. **Power**: Yellow-Green gradient, FiPower icon, 480-1050W range
4. **Energy Units**: Purple-Cyan gradient, FiTrendingUp icon, 12-44kWh range
5. **Frequency**: Blue gradient, FiBarChart2 icon, 49.6-50.4Hz range
6. **Power Factor**: Green-Blue gradient, FiActivity icon, 0.9-0.99 range
7. **Cost**: Pink-Blue gradient, FiDollarSign icon, ₹140-260 range

**Responsive Grid:** `sm:grid-cols-2`, `lg:grid-cols-3`, etc.

### Charts Component (`Charts.jsx`)
**Purpose**: Multi-chart visualization section

**Three Chart Types:**

1. **Real-time Power Chart** (AreaChart)
   - Spans 2 columns on large screens
   - Data key: `power`
   - Gradient fill: Cyan (70% opacity top) → Transparent
   - Y-axis domain: 0-2200W
   - 18 data points (time-series)
   - Smooth monotone curve
   - Height: `h-72` (288px) / `sm:h-80` (320px)

2. **Daily Energy Bar Chart** (BarChart)
   - Single column (right side)
   - 7 bars (Mon-Sun)
   - Gradient: Purple-400 → Cyan
   - Y-axis domain: 0-60kWh
   - Rounded bars with radius `[10, 10, 4, 4]`

3. **Voltage vs Current Line Chart** (LineChart)
   - Spans full width (3 columns)
   - Dual Y-axes (voltage & current)
   - Dual lines with different colors
   - 18 data points with voltage + current

**Tooltip Design:**
- Background: Dark with 90% opacity
- Border: 1px white/25%
- Border Radius: 12px
- Padding: 10px + 12px
- Text Color: Slate-200

**Recharts Configuration:**
- CartesianGrid: Dashed lines, gray color
- XAxis/YAxis: Slate-400 text, custom tick formatting
- Margins: Optimized for readability

### Controls Component (`Controls.jsx`)
**Purpose**: Device control panel with toggle switches

**Switch Controls (5 total):**
1. Main Power
2. Light
3. Fan
4. AC
5. Charging Socket

**Features:**
- Toggle button with label + status text
- Status text: "On"/"Off" (Slate-400)
- Visual indicator: Custom toggle switch
- Active state: Emerald background + glow
- Inactive state: White/5 background
- Smooth transitions on click
- Responsive grid: `sm:grid-cols-2`, `lg:grid-cols-5`

---

## Page Components

### Dashboard Page (`Dashboard.jsx`)
**Primary Landing Page**

**Sections:**
1. **Metrics Grid** (7 cards - responsive)
   - Voltage, Current, Power, Energy, Frequency, Power Factor, Cost
   - Real-time updates from API
   - Gradient accents for visual distinction

2. **Charts Section** (3 visualizations)
   - Real-time Power (Area chart)
   - Daily Energy (Bar chart)
   - Voltage vs Current (Line chart)

3. **Controls Section** (5 switches)
   - Device toggle controls
   - State management via useState

**Data Simulation:**
- Mock data generation for demo mode
- API integration fallback: `fetchMetrics()`
- Auto-updating series data:
  - 18-point time series for power
  - 7-day energy data
  - Voltage/Current pairs

### Monitoring Page (`Monitoring.jsx`)
**Live Device Monitoring & Status**

**Sections:**
1. **Live Metrics** (5 cards)
   - Voltage (V)
   - Current (A)
   - Power (W)
   - Energy Usage (kWh)
   - Device Status (Online/Offline)

2. **Waveform Chart** (Voltage vs Current line chart)
   - 20 data point history
   - Updates every 2.5 seconds
   - Mock drift values (simulating real sensor data)

**Data Dynamics:**
- Interval updates: 2500ms
- Value drift simulation: Small random variations
- Status randomization: 7% chance to toggle

### Billing Page (`Billing.jsx`)
**Energy Cost & Consumption Tracking**

**Sections:**
1. **Key Metrics** (4 cards)
   - Units Consumed (kWh)
   - Cost per Unit (₹/kWh)
   - Total Cost (₹)
   - Billing Status (Paid/Pending)

2. **Monthly Consumption Chart** (Bar chart)
   - 6-month history (Jan-Jun)
   - Gradient bars
   - Y-axis domain: 1200-2200₹

3. **Bill PDF Export**
   - Generates downloadable PDF
   - Includes cycle, summary, recent bills
   - Uses jsPDF library

**Features:**
- Dynamic billing cycle display
- Real-time cost calculation: unitConsumed × costPerUnit
- PDF export with formatted bill summary

### Statistics Page (`Statistics.jsx`)
**Analytics & Historical Data**

**Sections:**
1. **Daily Energy Consumption** (Bar chart)
   - 7 days (Mon-Sun)
   - Y-axis domain: 0-60kWh
   - Drifting values

2. **Weekly Consumption** (Bar chart)
   - 4 weeks
   - Y-axis domain: 0-220kWh

3. **Voltage vs Current Pattern** (Line chart)
   - 16 data points
   - Trend visualization

4. **Peak Load Chart** (Area chart)
   - 12-hour peak analysis (6:00-17:00)
   - Y-axis domain: 0-1200W

### Alerts Page (`Alerts.jsx`)
**System Notifications & Alarms** (Component file exists - placeholder for alerts list)

### Devices Page (`Devices.jsx`)
**Device Management & Configuration** (Component file exists - device listing/config)

---

## Styling Architecture

### CSS Files
- **`index.css`**: Global styles, Tailwind directives, glassmorphism definitions
- **`App.css`**: App-level component styles (if needed)
- **`dashboard.css`**: Dashboard-specific styles (if needed)
- **Component-level**: Inline Tailwind classes (default preferred approach)

### Tailwind Configuration
```javascript
theme: {
  extend: {
    fontFamily: {
      display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      body: ['Inter', 'system-ui', 'sans-serif'],
    },
    colors: {
      midnight: '#0b1224',
      neon: '#7cf3c7',
    },
    boxShadow: {
      glow: '0 0 40px rgba(124, 243, 199, 0.25)',
    },
  },
}
```

### Utility Classes Used Extensively
- **Flexbox**: `flex`, `flex-col`, `items-center`, `justify-between`, `gap-*`
- **Grid**: `grid`, `grid-cols-*`, `gap-*`
- **Spacing**: `p-*`, `px-*`, `py-*`, `m-*`, `mb-*`, `mt-*`
- **Text**: `text-*`, `font-*`, `uppercase`, `tracking-*`, `text-white`, `text-slate-*`
- **Colors**: Background utilities for gradients, text colors
- **Borders**: `border*`, `border-*`, `rounded-*`
- **Effects**: `shadow-*`, `backdrop-blur`, `opacity-*`
- **Responsive**: `sm:`, `lg:`, `xl:` prefixes
- **States**: `hover:`, `group-hover:`, `disabled:`, etc.
- **Transforms**: `translate-*`, `scale-*`, `rotate-*`
- **Transitions**: `transition`, `duration-*`, `ease-*`

---

## Responsive Breakpoints & Mobile Adaptations

### Sidebar
- Hidden on mobile, tablet: `hidden xl:block`

### Navbar
- Flex direction adapts: `flex-col md:flex-row`
- Padding responsive: `px-4 sm:px-6 lg:px-10`

### Cards Grid
- Base: Single column (100% width)
- `sm`: 2 columns
- `lg`: 3 columns
- `xl`: 4-5 columns (depending on section)

### Text Sizes
- Titles: `text-2xl` (Navbar), `text-lg` (Sections), `text-sm` (Labels)
- Large values: `text-3xl sm:text-4xl` (DataCard metrics)
- Small text: `text-xs` (Tracking & subtitles)

### Chart Heights
- Responsive: `h-72 sm:h-80` (288px → 320px)

### Padding & Spacing
- Container padding: `px-4 sm:px-6 lg:px-10` + `pb-10`
- Card padding: `p-4 sm:p-5` (16px → 20px)

---

## State Management & Hooks

### React Hooks Usage
- **useState**: Metrics, chart data, switch states, clock
- **useEffect**: Data fetching, interval timers, clock updates, API polling
- **useMemo**: Optimized data transformations (if needed)
- **useCallback**: Event handlers (toggles)
- **useLocation, useNavigate**: Router integration

### Mock Data Generation
**Functions in `data/mockData.js`:**
- `randomInRange(min, max, decimals)` - Random value generation
- `driftValue(prev, min, max, step, decimals)` - Incremental change simulation
- `clamp(value, min, max)` - Value boundary enforcement
- `timeLabel()` - Current time formatting
- `initialSeries(length, min, max, key)` - Time-series data creation
- `genSeries()`, `genBarData()` - Series generation utilities

### API Integration (`services/api.js`)
- `fetchMetrics()` - GET real-time energy metrics
- Backend URL: `http://localhost:5000/api/metrics` (default)
- Fallback to mock data on error
- CORS handling for development

---

## Performance Optimizations

1. **Vite Bundling**: ES6 modules, code splitting
2. **Tailwind PurgeCSS**: Only includes used styles in production
3. **React Components**: Functional components with hooks
4. **Lazy Loading**: Route-based code splitting (React Router)
5. **Chart Rendering**: Recharts ResponsiveContainer for responsive sizing
6. **Memoization**: useMemo for complex calculations
7. **Event Handling**: Event delegation for efficiency
8. **Interval Management**: Proper cleanup in useEffect returns

---

## Accessibility Considerations

1. **Semantic HTML**: Proper heading hierarchy
2. **Color Contrast**: Text and glow effects maintain WCAG standards
3. **Icon Labels**: All icons paired with descriptive text
4. **Focus States**: Keyboard navigation support via Tailwind focus utilities
5. **Responsive Design**: Works across all screen sizes
6. **Alt Text**: aria-hidden for decorative elements
7. **Form Controls**: Proper button semantics and states

---

## Development Workflow

### Build Commands
```bash
npm run dev      # Start dev server with HMR (Vite)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Development Server
- Port: 3000 (default Vite)
- HMR enabled for instant reload
- CORS proxy for backend API

### File Structure
```
src/
├── components/          # Reusable UI components
│   ├── Navbar.jsx      # Header with title & clock
│   ├── Sidebar.jsx     # Navigation menu
│   ├── DataCard.jsx    # Metric display card
│   ├── Charts.jsx      # Multi-chart section
│   ├── Controls.jsx    # Device control switches
│   ├── Cards/          # Extended card components
│   ├── Charts/         # Specialized chart components
│   └── Controls/       # Specialized control components
├── pages/              # Page routes
│   ├── Dashboard.jsx
│   ├── Monitoring.jsx
│   ├── Billing.jsx
│   ├── Statistics.jsx
│   ├── Alerts.jsx
│   └── Devices.jsx
├── services/           # API services
│   └── api.js
├── data/               # Mock data & utilities
│   └── mockData.js
├── styles/             # CSS modules (if used)
│   └── dashboard.css
├── App.jsx             # Main app with routing
├── main.jsx            # React DOM entry point
└── index.css           # Global styles
```

---

## Design Principles

1. **Glassmorphism**: Modern glass-like UI with blur effects
2. **Dark Theme**: Energy-efficient dark UI (especially for IoT displays)
3. **Real-time Updates**: Continuous data flow with smooth transitions
4. **Visual Hierarchy**: Clear distinction between primary and secondary information
5. **Responsive First**: Mobile-first approach with progressive enhancement
6. **Accessibility**: Inclusive design with proper contrast and semantics
7. **Performance**: Optimized rendering and bundle size
8. **Consistency**: Unified color palette, typography, and spacing
9. **Interactivity**: Smooth transitions and clear feedback on interactions
10. **Scalability**: Modular component structure for easy expansion

---

## Future Enhancement Opportunities

- Real-time WebSocket connection for live metrics
- Historical data persistence with database
- Advanced analytics machine learning
- Mobile app (React Native)
- Dark/Light theme toggle
- Custom dashboard widgets
- Alert notification system
- User authentication & multi-tenant support
- Energy efficiency recommendations
- Data export functionality (CSV, Excel)
- PWA capabilities for offline access
- Internationalization (i18n)
- Advanced permissions & role-based access
- Predictive analytics for energy consumption

---

## Summary

This IoT Energy Dashboard represents a **production-ready, modern energy management UI** combining:
- **Advanced Visual Design**: Glassmorphism with gradient accents
- **Responsive Architecture**: Mobile-first, works on all devices
- **Real-time Data Visualization**: Interactive charts with Recharts
- **Device Control Interface**: Intuitive toggle controls
- **Comprehensive Analytics**: Multi-page application with routing
- **Professional Development Stack**: React 19, Vite, Tailwind CSS
- **Scalable Structure**: Component-based, easily extensible

The application is designed as a **demo/reference implementation** for IoT energy systems, particularly optimized for Raspberry Pi deployments with backend Python APIs.
