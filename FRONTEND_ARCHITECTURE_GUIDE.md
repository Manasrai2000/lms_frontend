FRONTEND ARCHITECTURE GUIDE

This document captures the frontend architecture, design system, coding conventions, and UI patterns of the PizzaExpert Next.js project so future projects can follow the same engineering standards.

PHASE 1: PROJECT AUDIT

1) Project Structure
- Root files: [package.json](package.json), [tsconfig.json](tsconfig.json), [postcss.config.mjs](postcss.config.mjs), [app/globals.css](app/globals.css)
- App routes: app/, subtree uses nested layouts for shop and admin: [app/(shop)/layout.tsx](app/(shop)/layout.tsx), [app/admin/layout.tsx](app/admin/layout.tsx), root layout [app/layout.tsx](app/layout.tsx)
- Components: components/ is grouped by domain (admin/, menu/, orders/, cart/, layout/, menu/...). Examples:
  - UI primitives & shadcn wrappers: [components/ui/button.tsx](components/ui/button.tsx), [components/ui/dialog.tsx](components/ui/dialog.tsx), [components/ui/sheet.tsx](components/ui/sheet.tsx), [components/ui/table.tsx](components/ui/table.tsx), [components/ui/sonner.tsx](components/ui/sonner.tsx)
  - Layout pieces: [components/layout/navigation.tsx](components/layout/navigation.tsx), [components/layout/footer.tsx](components/layout/footer.tsx), [components/layout/restaurant-navbar.tsx](components/layout/restaurant-navbar.tsx)
  - Admin features: [components/admin/orders/orders-table.tsx](components/admin/orders/orders-table.tsx), [app/admin/layout.tsx](app/admin/layout.tsx)
- Shared modules: lib/ contains utilities, types and store implementations: [lib/utils.ts](lib/utils.ts), [lib/store/cart.ts](lib/store/cart.ts), [lib/types.ts](lib/types.ts), [lib/supabase/client.ts](lib/supabase/client.ts)
- Public assets: public/images and public/menu used for static media

2) Technology Stack
- Next.js: 16.1.6 (see [package.json](package.json))
- React: 19.2.3
- TypeScript: ^5 with strict enabled ([tsconfig.json](tsconfig.json))
- TailwindCSS: Tailwind v4 dev dependency, configured by `app/globals.css` which imports shadcn/tailwind.css and tw-animate-css ([app/globals.css](app/globals.css), [postcss.config.mjs](postcss.config.mjs))
- ShadCN: `shadcn` package used to scaffold UI primitives and design tokens; wrapper components live under `components/ui` (see [components/ui/*](components/ui))
- Radix: `radix-ui` primitives used (Dialog/Sheet) wrapped in `components/ui` files
- Iconography: `lucide-react`
- Animations: `framer-motion`, `tw-animate-css`
- State: `zustand` persist middleware for client state (cart store at [lib/store/cart.ts](lib/store/cart.ts))
- Forms & validation: `react-hook-form` and `@hookform/resolvers`, `zod` for schemas (dependencies in [package.json](package.json))
- Charts: `recharts` used in admin dashboard ([components/admin/dashboard/revenue-chart.tsx](components/admin/dashboard/revenue-chart.tsx))
- Toasts: `sonner` wrapped at [components/ui/sonner.tsx](components/ui/sonner.tsx)
- Utilities: `clsx`, `tailwind-merge`, `class-variance-authority (cva)` for variant styling

3) Design System (tokens and core rules)
- Colors & tokens: Defined via CSS variables in [app/globals.css](app/globals.css). Primary tokens include `--primary`, `--accent`, `--muted`, `--destructive`, and many sidebar/chart tokens. Light and dark themes are toggled via `.dark` class.
  - Source: [app/globals.css](app/globals.css)
- Radii: `--radius` base with derived sizes `--radius-sm`, `--radius-md`, `--radius-lg`, etc.
  - Source: [app/globals.css](app/globals.css)
- Typography: Google fonts imported in [app/layout.tsx](app/layout.tsx). `Inter`, `Geist` families mapped to `--font-sans` and `--font-geist-mono` variables.
  - Source: [app/layout.tsx](app/layout.tsx), [app/globals.css](app/globals.css)
- Shadows: Lightweight `shadow-lg`, `shadow-2xl` used in components (sheet, dialog, modals)
- Container widths: use Tailwind `container mx-auto` in header and page areas (see [components/layout/navigation.tsx](components/layout/navigation.tsx))
- Grid systems: Tailwind `grid`, `grid-cols-*`, and custom `md:grid-cols-[1fr_1.5fr]` used across dialogs and detail views (see [components/admin/orders/orders-table.tsx](components/admin/orders/orders-table.tsx))

4) Spacing System (extracted from classes used across components)
- Page: `p-4 md:p-6` (admin main uses `p-4 md:p-6` in [app/admin/layout.tsx](app/admin/layout.tsx))
- Header: `h-16` with `px-4` (`components/layout/navigation.tsx`)
- Container: `container mx-auto px-4` (`components/layout/navigation.tsx`)
- Card: `rounded-xl border border-border p-4 bg-card/50` (see `orders-table` wrapper)
- Section: `space-y-6` or `gap-6` between blocks (see `orders-table` root)
- Form spacing: Input heights `h-7` and `h-10` for larger inputs; common spacing `px-2 py-0.5` on inputs ([components/ui/input.tsx](components/ui/input.tsx))
- Table spacing: table head rows `h-8` and cells `p-2`/`py-1.5` ([components/admin/orders/orders-table.tsx], [components/ui/table.tsx](components/ui/table.tsx))
- Modal / Dialog spacing: dialog content `p-4`, dialog layouts often `max-w-sm` or `max-w-2xl` with inner `p-4` sections ([components/ui/dialog.tsx](components/ui/dialog.tsx))
- Drawer/Sheet spacing: sheet header/footer `p-6` and sheet content paddings (`components/ui/sheet.tsx`)

Representative spacing guide (literal patterns found in code):
- Page: `p-4 md:p-6` ([app/admin/layout.tsx](app/admin/layout.tsx))
- Container/header: `container mx-auto px-4` ([components/layout/navigation.tsx](components/layout/navigation.tsx))
- Card: `rounded-xl border border-border/50 bg-card/50 p-4` ([components/admin/orders/orders-table.tsx](components/admin/orders/orders-table.tsx))
- Section: `space-y-6` ([components/admin/orders/orders-table.tsx](components/admin/orders/orders-table.tsx))
- Input: `h-7 w-full px-2 py-0.5` ([components/ui/input.tsx](components/ui/input.tsx))
- Dialog: `max-w-sm p-4 rounded-xl` ([components/ui/dialog.tsx](components/ui/dialog.tsx))
- Sheet: `p-6` header/footer, `w-3/4` for side sheets ([components/ui/sheet.tsx](components/ui/sheet.tsx))

5) Responsive Rules
- Breakpoints: default Tailwind breakpoints used (mobile-first). Patterns indicate `md:` and `lg:` used heavily. Examples:
  - Navigation hides on mobile with `hidden md:flex` and mobile menu uses `Sheet` (`components/layout/navigation.tsx`).
  - Admin layout uses `lg:flex` for desktop sidebar and `lg:hidden` for mobile header (`app/admin/layout.tsx`).
- Tables: tables wrap in `overflow-x-auto` containers, with `min-w-[800px]` used to preserve columns and allow horizontal scroll on small screens (`components/admin/orders/orders-table.tsx`). The table cell spacing uses `whitespace-nowrap` and min width to keep layout stable.
- Forms: inputs stack naturally (use `grid` with `md:grid-cols-*` for multi-column forms). Dialogs use `max-w-sm` or `max-w-2xl` and remain centered on mobile with `max-w-[calc(100%-2rem)]`.
- Cards: use responsive widths such as `w-full` and shrink/grow inside flex containers. Side sheets use `data-[side=left]:sm:max-w-sm` to constrain on small screens.

6) ShadCN Usage Analysis
- Pattern: ShadCN primitives are wrapped with Radix primitives + Tailwind classes inside `components/ui/*` (see `button.tsx`, `dialog.tsx`, `sheet.tsx`, `table.tsx`, `input.tsx`).
- Components used: Button, Dialog, Sheet, Table, Input, Badge, Input, Select (similar), ScrollArea, Separator, DropdownMenu, Toaster (sonner wrapper)
- Variants: Buttons use `cva` (class-variance-authority) with `variant` and `size` variants in `components/ui/button.tsx`.
- Dialog/Sheet: built using Radix primitives with consistent `data-slot` attributes and `className` patterns.
- Dropdown/Menu/Badge: follow shadcn style — variant props and small utility wrappers.

Files: [components/ui/button.tsx](components/ui/button.tsx), [components/ui/dialog.tsx](components/ui/dialog.tsx), [components/ui/sheet.tsx](components/ui/sheet.tsx), [components/ui/table.tsx](components/ui/table.tsx), [components/ui/sonner.tsx](components/ui/sonner.tsx)

7) Component Standards
- Naming convention: PascalCase for React components (e.g., `OrdersTable`, `ThemeProvider`, `Navigation`) file names snake/kebab lower-case with `.tsx` in `components/*`.
- Props pattern: components accept `className` and spread remaining props via `...props`. Many components declare explicit prop unions with `React.ComponentProps<"element">` or Radix types.
- TypeScript: Strict typing with explicit interfaces (see [lib/types.ts](lib/types.ts)) and `Readonly` used in layout props.
- Hooks: `useCartStore` (zustand) for client state; `useEffect` used to defer mount behavior; `useTheme` from `next-themes` in `sonner.tsx`.
- File naming: `components/ui/<component>.tsx` for shared primitives; `components/<domain>/<feature>.tsx` for domain components.

8) UX Standards
- Loading states: `skeletons` not heavily used; loading typically uses `Loader` icons or `animate-spin` on icons and `animate-in` classes
- Empty states: present with icons and text, e.g., cart empty in `navigation.tsx`, tables show a centered message ([components/layout/navigation.tsx], [components/admin/orders/orders-table.tsx])
- Error states: `toast.error` via `sonner` used in actions; optimistic updates revert with full reload in some places
- Success messages: `toast.success` with descriptions; toasts shown via Toaster at root ([app/layout.tsx] uses `<Toaster />`)
- Toast usage: consistent `sonner` wrapper with theme mapping in [components/ui/sonner.tsx](components/ui/sonner.tsx)

PHASE 2: PROJECT BLUEPRINT (summary outputs for teams)

1) Frontend Architecture Guide (summary):
- Next 16 app router with nested layouts per domain: root layout -> `(shop)` layout -> `admin` layout.
- UI primitives centralized under `components/ui` as ShadCN/Radix wrappers.
- Domain components grouped under `components/<domain>`.
- Utilities and types under `lib/` and `types.ts`.
- Client state in `lib/store` using `zustand` with `persist` for cart

2) Design System Documentation (extracted tokens):
- Color tokens: see [app/globals.css](app/globals.css) for full list. Use CSS variables in component styles: `bg-primary`, `text-primary-foreground`, etc.
- Radii: `--radius` and derived `--radius-md` etc.
- Font: `Inter` and `Geist` families mapped via CSS variables in [app/layout.tsx](app/layout.tsx)
- Spacing: follow Tailwind utility classes and the spacing guide above

3) Reusable Component Guidelines (rules):
- All base UI primitives go to `components/ui` as wrappers over Radix + ShadCN styles.
- Accept `className` and spread `...props` (strongly typed with `React.ComponentProps` or specific Radix prop types).
- Use `data-slot` attributes on wrapper elements to aid testing and theming.
- Use `cva` for components with variants (buttons).
- Keep domain-specific components in `components/<domain>` and import common UI primitives from `components/ui`.

4) Responsive Guidelines
- Mobile-first design. Use `md:` and `lg:` breakpoints. Prefer `overflow-x-auto` for wide tables.
- Sidebars: `lg:` based presentational switch (hidden for small screens; `Sheet` mobile fallback).
- Keep dialogs centered with `max-w-[calc(100%-2rem)]` for mobile fit.

5) Naming Conventions
- Component files: `components/ui/button.tsx` -> export `Button`
- Domain components: `components/admin/orders/orders-table.tsx` -> export `OrdersTable`
- Types in `lib/types.ts` with descriptive interfaces.

6) Folder Structure Template
- app/
- components/
  - ui/
  - admin/
  - menu/
  - layout/
- lib/
- public/
- styles (app/globals.css kept at app/)

7) Tailwind Usage Rules
- Use utility classes for layout/spacings. Use `container mx-auto px-4` for centered content.
- Use `bg-<token>`, `text-<token>-foreground` mapped to CSS variables.
- Use `shadow-lg`, `rounded-xl`, `border-border/50` as card defaults.

8) ShadCN Usage Rules
- Wrap Radix primitives and export named components from `components/ui`.
- Use `slot`/`data-slot` attributes for consistent automation and theming.
- Use `cva` for variant-driven components (buttons)

PHASE 3: STARTER TEMPLATE

A minimal starter skeleton was added under `/starter` following the exact conventions (UI wrappers, layout, utilities). Files include:
- starter/app/layout.tsx
- starter/components/layout/sidebar-layout.tsx
- starter/components/layout/dashboard-layout.tsx
- starter/components/page-header.tsx
- starter/components/data-table.tsx
- starter/components/form-wrapper.tsx
- starter/components/modal-wrapper.tsx
- starter/components/drawer-wrapper.tsx
- starter/components/loading.tsx
- starter/components/empty-state.tsx
- starter/components/error-state.tsx
- starter/lib/utils.ts
- starter/types/index.ts

(These files mirror the style, props patterns, and Tailwind tokens used in the main project so they can be used as a drop-in starting point.)

CONCLUSION & NEXT STEPS
- This guide captures the live conventions and source references so teams can extend or scaffold new projects with identical engineering patterns.

References (key source files used for this audit):
- [app/layout.tsx](app/layout.tsx)
- [app/globals.css](app/globals.css)
- [app/(shop)/layout.tsx](app/(shop)/layout.tsx)
- [app/admin/layout.tsx](app/admin/layout.tsx)
- [components/ui/button.tsx](components/ui/button.tsx)
- [components/ui/dialog.tsx](components/ui/dialog.tsx)
- [components/ui/sheet.tsx](components/ui/sheet.tsx)
- [components/ui/table.tsx](components/ui/table.tsx)
- [components/ui/sonner.tsx](components/ui/sonner.tsx)
- [components/layout/navigation.tsx](components/layout/navigation.tsx)
- [components/admin/orders/orders-table.tsx](components/admin/orders/orders-table.tsx)
- [lib/utils.ts](lib/utils.ts)
- [lib/store/cart.ts](lib/store/cart.ts)

If you want, I can now run a deeper pass to extract all component props and generate a JSON schema of the design tokens and their usages. Let me know which next step you prefer.
