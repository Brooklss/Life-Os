## Life-OS

Life-OS is a quarterly habit tracker and personal operating system that helps you plan, execute, and review your life in 13-week cycles. It focuses on clear goals, measurable habits, and tight feedback loops so you can make consistent progress without overwhelm.

### What it does
- **Quarterly planning**: Define a theme and 3–5 focus goals per quarter.
- **Habit tracking**: Create habits tied to your goals; track completion daily with streaks and flexible schedules.
- **Weekly reviews**: Reflect on wins, challenges, and blockers; adjust plans for the upcoming week.
- **Dashboards**: See progress at a glance—completion rates, streaks, and trends per goal/habit.
- **Notes & reflections**: Capture insights, decisions, and lessons learned throughout the quarter.
- **Lightweight tasking**: Add small tasks aligned to goals to keep execution grounded.

### How it works (user flow)
1. **Start a quarter**: Set a quarterly theme and your top goals.
2. **Design habits**: For each goal, add 1–3 supporting habits with schedules (daily/weekly), targets (e.g., minutes, reps), and preferred days.
3. **Track daily**: Check off habits; partial credit and backfill allowed if you miss a day.
4. **Review weekly**: Log a short review, tag blockers, and choose one focus for the next week.
5. **Reflect and reset**: At the end of the quarter, review outcomes and roll forward what matters.

### Core concepts
- **Quarter**: A 13-week cycle with a theme and timebox for goals.
- **Goal**: An outcome for the quarter, measured via habits and milestones.
- **Habit**: A repeatable behavior with schedule/target; contributes to one goal.
- **Entry**: A dated log of habit completion (with optional notes/metrics).
- **Review**: Weekly reflection with ratings, notes, and next-week commitments.

### Why quarterly?
Thirteen weeks is long enough to make real progress and short enough to prevent drift. The cadence creates natural check-in points (weekly) and strategic resets (quarterly), reducing scope creep and improving focus.

### Tech stack
- Next.js 15, React 19, TypeScript 5
- Supabase JS v2 (auth + client)
- Tailwind CSS v4, PostCSS, Autoprefixer
- Radix UI, shadcn-style components, `lucide-react`, `cmdk`, `vaul`, `embla-carousel-react`, `recharts`, `react-day-picker`, `sonner`
- Utilities: `date-fns`, `@vercel/analytics`, `geist`

Note: The dependency list also includes entries for Vue/Svelte/Remix which are not used by the default Next.js app. They can be safely removed if not needed.

### Getting started
#### 1) Prerequisites
- Node.js 18+ (or the active LTS)
- A Supabase project (URL + Publishable/Anon key)

#### 2) Install dependencies
```bash
pnpm install
# or
npm install
```

#### 3) Configure environment
Create a `.env.local` file in the project root with:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_or_anon_key
# Optional legacy support:
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 4) Run the app
```bash
pnpm dev
# or
npm run dev
```
Visit `http://localhost:3000`.

### Development scripts
```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Start production server (after build)
pnpm start

# Lint (ESLint is ignored during build by default config)
pnpm lint
```

### Project structure (selected)
```
app/
  layout.tsx          # Root layout (providers, theming, global styles)
  page.tsx            # Home page
  auth/
    callback/page.tsx # OAuth callback handler
    auth-code-error/page.tsx # Auth error handler
components/
  ui/*                # Reusable UI components (Radix/shadcn style)
  theme-provider.tsx  # next-themes provider
  AuthButton.tsx      # Sign-in/out UX patterns
  AuthRedirector.tsx  # Route gating/redirect helper
lib/
  supabase-client.ts  # Supabase client initialization (PKCE)
styles/
  globals.css         # Additional global styles
```

### Auth usage examples
- Show a sign-in/out button using the shipped `AuthButton` pattern.
- Protect a route by checking the Supabase session on mount and redirecting via `AuthRedirector`.
- Handle OAuth provider flows by configuring redirect URLs in Supabase to point to `/auth/callback`.

### Theming
- `next-themes` persists the chosen theme; UI components adapt automatically via Tailwind and Radix token usage.

### Production notes
- `next.config.mjs` is set to ignore TypeScript and ESLint errors during build and to use unoptimized images. Adjust for stricter CI.
- Ensure environment variables are present in your hosting provider (e.g., Vercel) and match `.env.local`.

### Troubleshooting
- Blank page after auth: verify `NEXT_PUBLIC_SUPABASE_URL` and key values are correct and the Supabase redirect URL matches `/auth/callback`.
- Styling looks off: confirm Tailwind is building (no PostCSS errors) and global styles are imported in `app/layout.tsx`.
- Components not found: check imports use the `@/*` alias configured in `tsconfig.json`.

### License
This project is provided as-is without a specified license. Add your preferred license file if you plan to distribute.


