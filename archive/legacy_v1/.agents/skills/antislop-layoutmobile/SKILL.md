---
name: antislop-layoutmobile
description: Mobile & responsive layout filter. Enforces fluid reflow across screen widths, minimum 44x44px touch targets on mobile viewports, prevents horizontal overflow, and ensures mobile dialogs and forms stay usable.
---

# antislop-layoutmobile (Mobile & Responsive Filter)

## Key Rules
- **Viewport Fluidity:** Layout must gracefully reflow from 360px mobile viewports up to 4K desktop workstation screens.
- **Touch Target Sizing:** Minimum 44x44px tap targets for mobile interactive buttons (especially on Mobile JKN binary response buttons).
- **No Overflow Clipping:** Prevent horizontal layout breaks (`overflow-x-hidden` or horizontal scroll containers for dense data tables and graph views).
- **Dense Data Accommodation:** Workstation interfaces must scale density appropriately: single-column stack on small screens, 2-column or 3-column split on desktop viewports.
