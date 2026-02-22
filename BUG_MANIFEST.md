# Bug Manifest — Buggy Airbnb Clone

This document catalogs 10 intentionally planted bugs across 4 categories. Each bug is designed to be subtle, look like a genuine developer mistake, and only surface under specific conditions — never on the happy path.

---

## Category 1: API & Data Bugs

### Bug 1 — User Data Leak in Listing Detail API

| Field | Detail |
|-------|--------|
| **File** | `services/listing.ts` — `getListingById()` |
| **Line** | ~117 |
| **Change** | Changed `user: { select: { name: true, image: true } }` to `user: true` |
| **Looks like** | A developer simplifying the Prisma query ("we might need more host fields later"). `include: { user: true }` is the most common Prisma pattern. |
| **Trigger** | Visit any listing detail page |
| **Symptom** | Server response includes the host's full User object — password hash, email, all favoriteIds, createdAt, updatedAt. The UI only renders `name` and `image`, so nothing changes visually. |
| **Detection** | Network response inspection (DevTools → Network tab → examine RSC payload) |

---

### Bug 2 — Pagination Duplicates When Category Filter Is Active

| Field | Detail |
|-------|--------|
| **File** | `services/listing.ts` — `getListings()` |
| **Lines** | ~83–89 |
| **Change** | Made cursor `skip: 1` conditional on whether filters are present. When `where` has filter keys, `skip` is omitted. |
| **Looks like** | A developer "optimizing" filtered pagination — reasoning that skipping the cursor item is unnecessary when filters are active. Includes a plausible code comment. |
| **Trigger** | Browse with any category filter active, then scroll down to trigger "Load More" |
| **Symptom** | Last listing on page N reappears as first listing on page N+1 (duplicate cards in the grid) |
| **Detection** | Visual (duplicate cards) or comparing listing IDs across paginated results |

---

### Bug 3 — Double-Booking Race Condition (No Transaction)

| Field | Detail |
|-------|--------|
| **File** | `services/reservation.ts` — `createReservation()` |
| **Lines** | ~91–105 |
| **Change** | Added an overlap validation query BEFORE `db.listing.update`, but outside a database transaction |
| **Looks like** | Proper double-booking prevention. The overlap detection logic is 100% correct. A reviewer would praise it. The problem is purely a timing issue — no `$transaction` wrapper means two concurrent requests can both pass the check. |
| **Trigger** | Two users simultaneously book the same listing for overlapping dates (e.g., two Stripe webhooks completing at nearly the same time) |
| **Symptom** | Both reservations are created. Database contains overlapping bookings. |
| **Detection** | Database inspection after concurrent booking attempts |

---

## Category 2: UI & Frontend Bugs

### Bug 4 — Stale Closure Sends Wrong Price to Stripe

| Field | Detail |
|-------|--------|
| **File** | `app/listings/[listingId]/_components/ListingClient.tsx` |
| **Lines** | ~80–98 |
| **Change** | Wrapped `onCreateReservation` in `useCallback` with dependency array `[id, user]` — missing `dateRange`, `totalPrice`, `router`, and `startTransition`. Includes `eslint-disable` comment. |
| **Looks like** | A standard React performance optimization. The eslint-disable comment is ubiquitous in React codebases. `id` and `user` look like the "important" deps. |
| **Trigger** | Visit a listing → change the date range (which updates `totalPrice` in the UI) → click "Reserve" |
| **Symptom** | The UI correctly shows the updated total (e.g., $500 for 5 nights), but Stripe receives the INITIAL price ($100 for 1 night — the default from first render). User sees the right number, pays the wrong amount. |
| **Detection** | Compare the displayed total vs the actual Stripe checkout amount |

---

### Bug 5 — Search Filters Don't Clear Previous Country Selection

| Field | Detail |
|-------|--------|
| **File** | `components/modals/SearchModal.tsx` — `onSubmit()` |
| **Lines** | ~87–93 |
| **Change** | Changed from unconditionally setting `country: location?.label` in the spread (where `undefined` gets cleaned by `skipNull`) to conditionally setting it only when a location IS selected |
| **Looks like** | "Defensive coding" — only set the field if there's a real value. A reviewer would see this as cleaner than assigning undefined. |
| **Trigger** | Search with country="UK" → see results → open search modal again → search with just dates/guest counts (don't pick a country) → submit |
| **Symptom** | Results still filtered by "UK" because the old `country=UK` URL param from `currentQuery` persists (never overridden). Visible in the URL bar. |
| **Detection** | Observe URL params after searching without selecting a location |

---

### Bug 6 — Favorites Lost During Rapid Multi-Listing Favoriting

| Field | Detail |
|-------|--------|
| **File** | `services/favorite.ts` — `updateFavorite()` |
| **Lines** | ~46–53 |
| **Change** | Inserted a `db.listing.findUnique()` call between reading the favorites array and writing the updated array |
| **Looks like** | Validating that a listing exists before adding it to favorites — genuinely good defensive practice. No reviewer would question this check. |
| **Trigger** | Rapidly favorite 2–3 different listings within ~1 second (clicking hearts on different cards quickly) |
| **Symptom** | One or more favorites "vanish." Hearts show filled (optimistic UI), but refreshing reveals only some were saved. Both writes read the same initial array; the second write overwrites the first. |
| **Detection** | Refresh favorites page after rapid favoriting; compare expected vs actual |

---

## Category 3: Auth & Session Bugs

### Bug 7 — Reservations Page Accessible Without Auth via URL Parameter

| Field | Detail |
|-------|--------|
| **Files** | `middleware.ts` + `app/reservations/page.tsx` |
| **Changes** | (1) Removed `/reservations` from middleware matcher array. (2) Page now accepts `userId` from `searchParams`, falling back to session user. |
| **Looks like** | (1) A developer who decided "the page component handles auth, middleware is redundant." (2) Adding "admin view" or "shareable reservations link" functionality. The fallback to `user?.id` looks like proper defensive coding. |
| **Trigger** | Visit `/reservations?userId=<anyUserId>` without being logged in (or logged in as a different user) |
| **Symptom** | Shows all reservations for the target user. Anyone can see anyone's booking data. No authentication required because middleware no longer protects the route. |
| **Detection** | Access the URL with a different user's ID; observe their reservation data |

---

### Bug 8 — Orphaned Reservations Crash Trips Page After Listing Deletion

| Field | Detail |
|-------|--------|
| **File** | `prisma/schema.prisma` — Reservation model |
| **Line** | ~77 |
| **Change** | Removed `onDelete: Cascade` from the `listing` relation on the Reservation model |
| **Looks like** | A developer who removed cascade delete thinking "I don't want deleting a listing to silently destroy reservation records — I'll handle cleanup explicitly." A real architectural opinion. But they never implemented the explicit cleanup. |
| **Trigger** | A host creates a listing → a guest books it → the host deletes the listing → the guest visits `/trips` |
| **Symptom** | The `/trips` page crashes (500 error). The reservation still exists with a `listingId` pointing to a deleted listing. `getReservations` with `include: { listing: true }` returns null for the listing. Code then accesses `listing.title`, `listing.price`, etc. → null reference error. |
| **Detection** | Guest visits /trips after their booked listing was deleted |

---

## Category 4: Edge Case Bugs

### Bug 9 — Timezone Shift Causes Booking Dates Off by One Day

| Field | Detail |
|-------|--------|
| **File** | `services/reservation.ts` — `createPaymentSession()` |
| **Lines** | ~218–219 |
| **Change** | Changed date serialization in Stripe metadata from `String(date)` to `date.toISOString().split('T')[0]` |
| **Looks like** | The most common date-to-string pattern in JavaScript. `.toISOString().split('T')[0]` produces clean ISO 8601 date-only strings. Every JS dev has written this. |
| **Trigger** | Any user in a timezone west of UTC (all of the Americas) makes a booking |
| **Symptom** | Reservation dates stored in DB are one day earlier than selected. User picks Jan 15–18, sees Jan 14–17 on their trips page. The ECMAScript spec parses date-only strings (`"2024-01-15"`) as UTC midnight, which is the previous day in western timezones. |
| **Detection** | Compare selected dates with stored dates, or observe wrong dates on /trips |

---

### Bug 10 — Search Availability Filter Misses Fully-Contained Bookings

| Field | Detail |
|-------|--------|
| **File** | `services/listing.ts` — `getListings()` (date overlap filter) |
| **Lines** | ~55–74 |
| **Change** | Replaced overlap detection with logic that checks if either END of a reservation falls within the search range — but misses the case where a reservation FULLY CONTAINS the search range |
| **Looks like** | "Exclude listings where any reservation's start or end falls within the search range." The two-condition OR structure looks thorough. But it misses `reservation.start < search.start AND reservation.end > search.end` (reservation wraps the search window). |
| **Trigger** | Search for dates fully inside a long existing reservation (e.g., listing booked Jan 1–31, search for Jan 10–20) |
| **Symptom** | The fully-booked listing appears as "available" in search results. |
| **Detection** | Search for dates within an existing long reservation; the booked listing shouldn't appear but does |

---

## Detection Method Matrix

| Bug | UI Visible | Network/API | Server Logs | Database State |
|-----|-----------|-------------|-------------|----------------|
| 1. Data leak | No | **Yes** | No | No |
| 2. Pagination dupes | **Yes** | Yes | No | No |
| 3. Double booking | No | No | No | **Yes** |
| 4. Stale price | No | **Yes** (Stripe) | No | Yes |
| 5. Stale search | **Yes** (URL) | No | No | No |
| 6. Lost favorites | **Yes** (on refresh) | No | No | **Yes** |
| 7. Auth bypass | **Yes** | Yes | No | No |
| 8. Orphan crash | **Yes** (500 error) | Yes | **Yes** | **Yes** |
| 9. Date shift | **Yes** (wrong dates) | No | No | **Yes** |
| 10. Missed overlap | **Yes** (wrong results) | No | No | No |

---

## Notes

- All bugs are designed to pass static code analysis and code review
- The happy path (browsing listings, viewing details, basic navigation) is completely unaffected
- Each bug requires a specific user flow or edge case to trigger
- Bugs span the full stack: Prisma schema, server actions, React components, middleware
