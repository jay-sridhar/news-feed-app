# Research: Settings Page with Category Personalisation (006)

## Decision 1 — Settings navigation pattern

**Decision**: Boolean flag `isSettingsOpen` in `CategoryContext` (not a new `ActiveTab` value like `'settings'`)

**Rationale**: Settings is not a news category. Using a boolean overlay flag:
- Preserves `activeCategory` state so the correct tab is restored on close
- Avoids polluting the `CategoryId | 'bookmarks'` union type with a non-content tab
- Mirrors common mobile app patterns (settings as a modal/overlay rather than a peer tab)

**Alternatives considered**:
- `activeCategory = 'settings'` — rejected: couples navigation to category routing; requires restoring previous tab on close; type pollution
- Dedicated `SettingsContext` — rejected: `isSettingsOpen` and `enabledCategories` are tightly coupled to `activeCategory` (auto-switch-on-deselect logic); keeping them in the same context avoids cross-context coupling

---

## Decision 2 — Enabled-categories state location

**Decision**: Extend `CategoryContext` with `enabledCategories: CategoryId[]`, `toggleCategory(id)`, `isSettingsOpen`, `openSettings()`, `closeSettings()`

**Rationale**: `enabledCategories` directly drives which tabs are rendered and must react in sync with `activeCategory` (auto-switch-on-deselect). Placing both in the same context avoids a cross-context `useEffect` dependency.

**Alternatives considered**:
- New `SettingsContext` — rejected: auto-switch logic (`if activeCategory no longer enabled → setActiveCategory(first enabled)`) would need to subscribe to both contexts; adds complexity with no benefit
- `App.tsx` local state — rejected: violates constitution IV (state in context, not ad-hoc component state passed as props)

---

## Decision 3 — Persistence

**Decision**: `localStorage` key `newsflow_enabled_categories` stores a JSON array of enabled `CategoryId` strings. Initialised once on `CategoryProvider` mount; written on every `toggleCategory` call.

**Rationale**: Existing features (bookmarks: `newsflow_bookmarks`, dark mode: `newsflow_theme`) use the same localStorage pattern — consistent and zero-dependency.

**Alternatives considered**:
- `sessionStorage` — rejected: spec requires persistence across reloads (FR-007, SC-002)
- Cookie — rejected: unnecessary complexity, same-device scope sufficient for this feature

---

## Decision 4 — Min-one guard

**Decision**: `toggleCategory` checks: if the category is currently enabled AND it is the only enabled one, do nothing (ignore the toggle). The UI can visually disable the last enabled toggle to communicate this constraint.

**Rationale**: Simplest guard — no error state, no toast, no modal. The visual affordance (disabled toggle) is clear enough at 5 categories.

**Alternatives considered**:
- Show an inline error message — considered (spec scenario 3 says "a message explains"), will show a brief inline note "At least one category must remain selected" below the toggle row when the guard fires
- Prevent UI interaction (disabled=true on the last toggle) — will also do this for clarity

---

## Decision 5 — Dark mode in Settings

**Decision**: Move the dark mode toggle from the TabBar header row into the Settings screen. The gear icon replaces the sun/moon icon in the header. The ThemeContext toggle is reused as-is.

**Rationale**: FR-008 says Settings is "a central preference hub". Moving dark mode there keeps the header cleaner (single icon: gear) and avoids duplication. Users who relied on the header toggle will naturally discover Settings.

**Alternatives considered**:
- Keep both (header toggle + Settings toggle) — rejected: duplication, confusing two sources of truth for the same preference
- Header toggle stays, Settings shows an additional toggle — rejected: same duplication issue

---

## Decision 6 — Settings icon placement

**Decision**: Gear (⚙) icon in the app-name row of TabBar, replacing the sun/moon icon that moves to Settings.

**Rationale**: FR-001 and US3 require Settings to be reachable from every tab. The header row is the only always-visible location. Gear icon is universally understood as "settings".
