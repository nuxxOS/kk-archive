# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

Unofficial KlangKuenstler fan hub — shows archive, tour globe, discography, stats, sets, ID
hunter. Nuxt 4 + Vue 3 + TypeScript, statically generated. No backend: all data is JSON in
`app/data/` (shows/releases real, sets/ids sample), kept fresh by Node scripts in `scripts/`.
Globe via globe.gl. See README.md for data notes and script docs.

**Package manager**: pnpm only — npm 10.9.2 hits an arborist bug on this machine.

## Commands

```bash
pnpm dev        # dev server
pnpm generate   # static build for Vercel
pnpm sync       # RA + Songkick + promoter watchlist → shows.json → .ics → Telegram post
```

## Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

## Code Generation Rules

These rules exist because generated code keeps violating them. Every one is checked in review.

### No Unnecessary Wrappers

```ts
// WRONG — ref for a value that never changes
const maxItems = ref(5)
// CORRECT
const maxItems = 5

// WRONG — computed for a static object
const config = computed(() => ({ label: 'Name', key: 'name' }))
// CORRECT
const config = { label: 'Name', key: 'name' }

// Prefer Promise.all for independent calls
await Promise.all([fetchStats(), fetchProducts()])
```

### Error Handling: One Pattern, No try/catch Spray

Handle errors through one channel at the call site, every time. Never wrap calls in try/catch
as a reflex, and never add error handling for impossible scenarios (local JSON imports cannot
fail).

### Conditions: Name the Booleans

Never inline calculations in an `if`. No nested ternary chains — use `if-else`.

```ts
// WRONG
if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay))
  age--

// CORRECT
const isBeforeBirthMonth = currentMonth < birthMonth
const isBeforeBirthDay = currentMonth === birthMonth && currentDay < birthDay
const hasNotHadBirthdayYet = isBeforeBirthMonth || isBeforeBirthDay
```

Name booleans after the condition, not the caller (`isUnder18`, not `isTooYoungForCovid`).

### Component Communication

Emits, not function props. Parent passes data down, child emits events up.

```ts
// CORRECT
const emit = defineEmits<{ select: [id: string] }>()

// WRONG — function as prop
defineProps<{ onSelect: (id: string) => void }>()
```

`defineProps` / `defineEmits` always use TypeScript generic syntax, never runtime object syntax.

### Component Layers

Each layer has one job. Do not skip layers or merge responsibilities.

| Layer | Example | Responsibility | Rules |
|---|---|---|---|
| Page | `pages/shows/index.vue` | Layout + top-level data | Imports sections, no business logic |
| Section | `components/ShowsList.vue` | Smart — consumes composables | Owns a slice of the UI |
| Leaf | `components/ShowRow.vue` | Dumb — props in, emits out | No composable calls, no API calls |

### Composables vs Utils

- The `use` prefix belongs on the exported FUNCTION, never on the filename. Files are
  kebab-case nouns: `composables/show-filters.ts` exports `useShowFilters()`.
- `composables/` + a `use` function is ONLY for real composables — functions that own
  reactivity or lifecycle. Anything non-reactive is a util: plain module in `utils/`, no
  accessor function, consts and helpers exported directly (see `utils/archive.ts`; Nuxt
  auto-imports named exports from both dirs).
- A shared module exports only what MULTIPLE consumers use. A derivation with a single
  consumer is defined locally in that consumer, not exported.
- Real composables: one composable = one noun (`useShowFilters`).
- Under 60 lines = ideal. Over 200 = must split.
- Logic lives in the composable/module, not in components.

### Lifecycle Hooks

Call named methods inside hooks, not inline logic.

```ts
onMounted(() => { initGlobe() })
```

### Never Derive State From Display Text

```ts
// WRONG: a copy tweak silently breaks the styling
const isError = computed(() => hintText.value.includes('❌'))

// CORRECT: read the actual state
const isError = computed(() => !!errors.value.birthDate)
```

### Icons: Never Inside Strings

Icon components/SVG in templates, never emoji glyphs baked into user-facing strings. Emoji
ignore `color`, render in the OS emoji font, can't be sized, and announce as "check mark
button" to screen readers.

### Dates: Don't Mix UTC and Local

`new Date('YYYY-MM-DD')` parses as **UTC midnight**; `getFullYear`/`getMonth`/`getDate` read
**local time**. Mixing them is off by a day in UTC-negative timezones.

```ts
// CORRECT: plain integers, no Date semantics left to reason about
const [year, month, day] = dateString.split('-').map(Number)
```

## Naming Conventions

- `.vue` files → `PascalCase`. `.ts` files → `kebab-case` or `camelCase` (composables); never `PascalCase`.
- Folders → always `kebab-case`.
- Events → imperative verb form: `click`, `select`, `close`. Never past tense.
- Methods → named by what they do, not when they run (`resetFilters`, not `onClick`).
- Image imports → suffix `Img` (jpeg/png) or `Svg` (svg): `placeholderImg`, `LogoSvg`.
- CSS classes → `kebab-case`, minimum 2 words, first word ties element to parent
  (`shows-wrap`, not `wrap`). **No BEM** — no `__`/`--`: `nav-item-active`, not `nav-item--active`.
- Slot names → `camelCase`.

## Commits & Code Comments

- Commits: imperative mood — "Add show filters", not "Added show filters".
- `// TODO: explain what needs to be done`
- `// POSTPONED: mention reason for delay`
- `// DEPRECATED: mention replacement and when this can be deleted`
