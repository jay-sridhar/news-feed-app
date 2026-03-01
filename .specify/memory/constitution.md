<!-- SYNC IMPACT REPORT
  Version Change: [TEMPLATE] → 1.0.0
  Status: Initial ratification — constitution created from template

  Modified Principles: N/A (first ratification; all sections new)

  Added Sections:
    - Core Principles (5 principles)
    - Technology Stack
    - Development Workflow
    - Governance

  Removed Sections: N/A

  Templates Requiring Updates:
    - .specify/templates/plan-template.md       ✅ aligned
      (Constitution Check section is generic; filled per-feature by /speckit.plan)
    - .specify/templates/spec-template.md       ✅ aligned
      (No principle-specific mandatory sections to add)
    - .specify/templates/tasks-template.md      ✅ aligned
      (Task phases and structure match principle-driven workflow)
    - .specify/templates/agent-file-template.md ✅ aligned
      (Generic placeholder; populated per feature — no changes needed)

  Deferred TODOs: None
-->

# News Feed App Constitution

## Core Principles

### I. Client-Side Only

All data fetching MUST occur client-side. No custom backend server, serverless functions, or
API proxy routes are permitted. External data sources are limited to the GNews free API tier
and Google News RSS feeds. Any feature requiring server-side logic is out of scope unless
this principle is explicitly amended via the governance procedure below.

**Rationale**: Keeps infrastructure cost at zero, aligns with Vercel free-tier static
deployment, and eliminates backend maintenance overhead for a read-only news aggregation app.

### II. TypeScript Everywhere

All source files under `src/` MUST use the `.ts` or `.tsx` extension. Plain `.js` files are
not permitted. TypeScript strict mode MUST be enabled (`"strict": true` in `tsconfig.json`).
The `any` type MUST NOT be used; prefer `unknown` with type guards or explicit typed
interfaces when the shape of external data is uncertain.

**Rationale**: Type safety prevents entire classes of runtime errors in API response handling
and component prop drilling — the primary error sources in a client-side data-fetching SPA.

### III. Mobile-First Responsive Design

All UI components MUST be designed for mobile viewports first (baseline: 375px width), then
enhanced for larger screens using Tailwind CSS responsive prefixes (`sm:`, `md:`, `lg:`).
No feature is considered complete until it renders correctly at 375px. Desktop layouts are
progressive enhancements only.

**Rationale**: News consumption is predominantly mobile. Mobile-first guarantees the primary
use case is never degraded by desktop-first assumptions baked in during development.

### IV. React Context for State — No External State Libraries

Application state MUST be managed using React Context and built-in hooks (`useState`,
`useReducer`, `useEffect`). Introducing external state management libraries (Redux, Zustand,
Jotai, MobX, Recoil, or equivalents) requires an explicit constitution amendment. Context
providers MUST be colocated with their consumers and scoped to the minimum necessary subtree
— no single root-level "mega-provider" for unrelated state domains.

**Rationale**: React Context is sufficient for a read-only, single-user news feed with no
complex cross-cutting state. Adding an external state library introduces unjustified
dependency weight and conceptual overhead.

### V. Simplicity and Free-Tier Compliance

Features MUST respect the GNews API free-tier limit (100 requests/day). Paid APIs and usage
beyond free tiers are prohibited without explicit constitution amendment. YAGNI applies:
implement only what the current feature spec requires. Complexity MUST be justified in the
Complexity Tracking table of `plan.md` whenever a simpler alternative was considered and
rejected.

**Rationale**: The app must remain deployable and operable at zero cost. Over-engineering
risks exhausting API quotas and complicates what is fundamentally a simple, read-only,
client-rendered news aggregator.

## Technology Stack

- **Framework**: React 18+ with Vite (SPA — no SSR, no SSG)
- **Language**: TypeScript (strict mode, all source files)
- **Styling**: Tailwind CSS (utility-first, mobile-first)
- **State Management**: React Context + built-in hooks only
- **Data Sources**: GNews API (free tier) + Google News RSS feeds (client-side fetch)
- **Deployment**: Vercel free tier (static output from `vite build`)
- **Authentication**: None — no user accounts, no login or session flows
- **Testing**: Optional per feature spec; Vitest is the preferred framework if added

## Development Workflow

- Features are developed on branches named `###-feature-name` and merged via pull request.
- A feature spec (`specs/###-feature-name/spec.md`) MUST exist before implementation begins.
- Every pull request MUST include a completed Constitution Check in `plan.md`, confirming
  compliance with all five principles prior to implementation.
- Vercel preview deployments serve as the primary environment for UI/UX review and approval.
- Force-pushes to `main` are prohibited. Squash merge is preferred to maintain readable history.

## Governance

This constitution supersedes all other practices, style guides, and conventions in the
repository. Where a conflict exists, the constitution takes precedence.

**Amendment Procedure**:
1. Open a pull request with the proposed edit to `.specify/memory/constitution.md`.
2. Increment the version number per the versioning policy below.
3. Update the Sync Impact Report HTML comment at the top of the file.
4. Propagate any required changes to affected `.specify/templates/` files in the same PR.
5. Merge only after all template updates are confirmed complete.

**Compliance Review**: All plan reviews MUST verify the Constitution Check section in
`plan.md` passes before implementation starts. Complexity violations MUST be documented
in the Complexity Tracking table of `plan.md` with a justification and a description of
the simpler alternative that was rejected.

**Versioning Policy**:
- **MAJOR**: Removal or redefinition of an existing principle (backward incompatible change).
- **MINOR**: New principle or section added; material expansion of existing guidance.
- **PATCH**: Clarifications, typo fixes, or non-semantic wording refinements.

**Version**: 1.0.0 | **Ratified**: 2026-03-01 | **Last Amended**: 2026-03-01
