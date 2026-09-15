# Skill: add-entity
# ────────────────
# Invoke: "Use the add-entity skill" or "/skill add-entity"
# Owner: @backend-eng (primary), @frontend-eng (UI), @qa-tester (tests)
# Use when: adding a new entity to PropertyEase (Property, Unit, Tenant,
#           Lease, Payment, MaintenanceTask, Lead, Campaign)

## Purpose
Walk through every file that must be touched when adding a new entity
to the data model. This is a checklist — the order matters.

## Pre-flight

1. Read `CLAUDE.md` §6 (the 10 rules)
2. Read `AGENTS.md` for your role contract
3. Read `memory/MEMORY.md` (especially `decisions/`)
4. Read `contracts/api-envelope.md` (response shape)
5. Read `contracts/i18n-keys.md` (string handling)
6. Confirm the entity belongs in v1 (vs. v2) per ADR-002 (Qatar-only v1)

## Procedure

### Step 1: Prisma schema (@backend-eng)

File: `propertyease/prisma/schema.prisma`

```prisma
model NewEntity {
  id          String   @id @default(cuid())
  ownerId     String
  // ... fields ...
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  owner       User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  @@index([ownerId])
}
```

- Add to Prisma schema
- Run `npx prisma format`
- Run `npx prisma generate`
- Run `npx prisma migrate dev --name add-new-entity`
- Commit the migration

### Step 2: API routes (@backend-eng)

For each standard operation:

- `POST /api/new-entities` — create
- `GET /api/new-entities` — list (with filters)
- `GET /api/new-entities/[id]` — read
- `PATCH /api/new-entities/[id]` — update
- `DELETE /api/new-entities/[id]` — delete

All routes MUST:
- Validate input with zod
- Return the standard envelope (`{ ok, data, error }`)
- Check auth (session required)
- Filter by `ownerId` (users only see their own data)

### Step 3: Database helpers (@backend-eng)

File: `propertyease/src/lib/database.ts`

Add to the `Db` object:
- `newEntity.create(data)`
- `newEntity.list(filter)`
- `newEntity.get(id)`
- `newEntity.update(id, data)`
- `newEntity.delete(id)`

Each helper returns the standard envelope or throws.

### Step 4: i18n strings (@frontend-eng)

File: `propertyease/src/lib/i18n.ts`

Add to BOTH `en` and `ar` blocks:
- `addNewEntity`, `editNewEntity`, `deleteNewEntity`
- `newEntityCreated`, `newEntityUpdated`, `newEntityDeleted`
- `newEntityName`, `newEntityRequired`, etc.

### Step 5: UI page (@frontend-eng)

File: `propertyease/src/app/(dashboard)/new-entities/page.tsx`

- Server component fetches list
- Client component handles modals
- RTL-safe layout
- Empty state (using `t('noData')`)

### Step 6: Form modal (@frontend-eng)

File: `propertyease/src/components/modals/AddNewEntityModal.tsx`

Follow `memory/patterns/form-modal.md` exactly.

### Step 7: Tests (@qa-tester)

Files:
- `propertyease/__tests__/api/new-entities.test.ts` — API contract tests
- `propertyease/__tests__/components/AddNewEntityModal.test.tsx` — UI test
- Manual QA checklist in `docs/TESTING.md`

### Step 8: Documentation (@product-owner)

- Add to `propertyease/README.md` (feature list)
- Add to `docs/ARCHITECTURE.md` (data model diagram)
- Add to `CHANGELOG.md`
- Update `memory/MEMORY.md` if a new decision was made

### Step 9: Handoff

Write a completion note in `memory/handoffs/YYYY-MM-DD-from-A-to-B.md`
if multiple agents were involved.

## Definition of done

- [ ] All 8 steps complete
- [ ] All tests pass
- [ ] Both EN and AR strings added
- [ ] RTL layout tested
- [ ] CHANGELOG updated
- [ ] Conventional commit message

## Out of scope

- Do NOT add new payment rails in this skill
- Do NOT add new countries (Qatar-only v1)
- Do NOT add new auth providers (NextAuth only)
- Do NOT add new charts or visualizations (recharts only)
