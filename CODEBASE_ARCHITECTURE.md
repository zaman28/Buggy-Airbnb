# Buggy Airbnb - Complete Codebase Architecture

## Overview

A full-stack Airbnb clone ("VacationHub") built with Next.js 14 App Router, TypeScript, Tailwind CSS, MongoDB (via Prisma), NextAuth, Stripe, and EdgeStore. The app supports property listing, search/filter, booking with payments, favorites, and OAuth authentication.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 14.2 (App Router) | SSR, RSC, server actions |
| Language | TypeScript 5 | Type safety |
| Styling | Tailwind CSS 3 + Framer Motion | UI + animations |
| Database | MongoDB + Prisma 5 | NoSQL + ORM |
| Auth | NextAuth 4 (JWT strategy) | OAuth + credentials |
| Payments | Stripe | Checkout sessions + webhooks |
| File Storage | EdgeStore | Image uploads |
| State | React Query 4 | Client-side cache + infinite queries |
| Forms | React Hook Form 7 | Uncontrolled form management |
| Maps | Leaflet + React-Leaflet | Interactive maps |
| UI | React Icons, React Hot Toast, React Loading Skeleton | Icons, notifications, loading states |

---

## Directory Structure

```
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # Root layout (Providers, Navbar, fonts)
│   ├── page.tsx                   # Home page (listings grid + pagination)
│   ├── globals.css                # Global styles
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth handler (GET/POST)
│   │   ├── edgestore/[...edgestore]/ # EdgeStore file upload handler
│   │   └── webhooks/stripe/       # Stripe webhook (POST)
│   ├── listings/[listingId]/
│   │   ├── page.tsx               # Listing detail page
│   │   ├── loading.tsx            # Skeleton loading state
│   │   └── _components/           # ListingHead, ListingInfo, ListingClient, ListingReservation, ListingCategory
│   ├── favorites/page.tsx         # User's favorited listings (protected)
│   ├── properties/page.tsx        # User's created properties (protected)
│   ├── reservations/page.tsx      # Incoming reservations on user's properties (protected)
│   └── trips/page.tsx             # User's bookings (protected)
│
├── components/
│   ├── Provider.tsx               # Root providers (QueryClient, Session, EdgeStore, Toaster)
│   ├── navbar/
│   │   ├── index.tsx              # Main navbar (server component, fetches user)
│   │   ├── Logo.tsx               # Home link
│   │   ├── Search.tsx             # Search bar (reads URL params, opens SearchModal)
│   │   ├── Categories.tsx         # Horizontal category filter (Swiper, home page only)
│   │   ├── CategoryBox.tsx        # Individual category button (toggles URL param)
│   │   ├── UserMenu.tsx           # User dropdown (auth menu items + modals)
│   │   └── MenuItem.tsx           # Menu item wrapper
│   ├── modals/
│   │   ├── Modal.tsx              # Compound component (Trigger, Window, WindowHeader)
│   │   ├── AuthModal.tsx          # Login/Signup toggle form
│   │   ├── SearchModal.tsx        # Multi-step search (location → dates → counts)
│   │   └── RentModal.tsx          # Multi-step listing creation (6 steps)
│   ├── inputs/
│   │   ├── Input.tsx              # Text input with floating label + RHF integration
│   │   ├── Counter.tsx            # Increment/decrement counter
│   │   ├── CountrySelect.tsx      # Country dropdown (react-select + countries.json)
│   │   └── CategoryButton.tsx     # Category selection button
│   ├── ListingCard.tsx            # Property card (image, price, location, heart)
│   ├── ListingMenu.tsx            # Context menu (delete property/cancel reservation)
│   ├── HeartButton.tsx            # Favorite toggle (optimistic + debounced)
│   ├── LoadMore.tsx               # Infinite scroll (useInfiniteQuery + IntersectionObserver)
│   ├── Map.tsx                    # Leaflet map display
│   ├── Calender.tsx               # Date range picker (react-date-range)
│   ├── Image.tsx                  # Next.js Image wrapper with fade-in + zoom effects
│   ├── ImageUpload.tsx            # Drag-and-drop image upload to EdgeStore
│   ├── EmptyState.tsx             # "No results" placeholder
│   ├── BackButton.tsx             # Router.back() button
│   ├── Button.tsx                 # Styled button (small/large, outline variant)
│   ├── Avatar.tsx                 # User avatar with fallback
│   ├── ConfirmDelete.tsx          # Delete confirmation dialog
│   ├── Heading.tsx                # Page heading with optional back button
│   ├── Loader.tsx                 # Spinner component
│   └── Menu.tsx                   # Compound dropdown menu (Toggle, List, Button)
│
├── services/                      # Server actions ("use server")
│   ├── user.ts                    # getCurrentUser() - session retrieval
│   ├── auth.ts                    # registerUser() - registration with bcrypt
│   ├── listing.ts                 # getListings(), getListingById(), createListing()
│   ├── reservation.ts             # getReservations(), createReservation(), deleteReservation(), createPaymentSession()
│   ├── favorite.ts                # getFavorites(), updateFavorite(), getFavoriteListings()
│   └── properties.ts              # getProperties(), deleteProperty()
│
├── lib/
│   ├── db.ts                      # Prisma client singleton
│   ├── auth.ts                    # NextAuth config (providers, callbacks, JWT)
│   ├── stripe.ts                  # Stripe SDK initialization
│   └── edgestore.ts               # EdgeStore client provider + hook
│
├── hooks/
│   ├── useLoadMore.ts             # IntersectionObserver for infinite scroll (240px margin)
│   ├── useKeyPress.ts             # Global keyboard listener (e.g., Escape)
│   ├── useOutsideClick.ts         # Click-outside detection for modals/menus
│   ├── useIsClient.ts             # SSR guard (prevents hydration mismatch)
│   └── useMoveBack.ts             # router.back() wrapper
│
├── utils/
│   ├── constants.ts               # categories (15), LISTINGS_BATCH (16), menuItems
│   ├── helper.ts                  # formatPrice() (Intl.NumberFormat), cn() (clsx + tw-merge)
│   └── motion.ts                  # Framer Motion variants (fadeIn, slideIn, zoomIn)
│
├── types/
│   ├── index.ts                   # Category interface {label, icon, description}
│   └── next-auth.d.ts             # Extends NextAuth JWT + Session with user.id
│
├── data/
│   └── countries.json             # Country data for location picker
│
├── prisma/
│   └── schema.prisma              # MongoDB schema (User, Account, Listing, Reservation)
│
├── middleware.ts                   # NextAuth route protection
├── next.config.js                 # Image domains config
├── tailwind.config.ts             # Tailwind theme extensions
└── package.json                   # Dependencies and scripts
```

---

## Database Schema (MongoDB via Prisma)

### User
| Field | Type | Notes |
|-------|------|-------|
| id | ObjectId | Primary key |
| name | String? | Display name |
| email | String? (unique) | Login identifier |
| password | String? | Bcrypt hash (null for OAuth users) |
| image | String? | Profile picture URL |
| favoriteIds | ObjectId[] | Array of favorite listing IDs |
| emailVerified | DateTime? | Email verification timestamp |
| createdAt | DateTime | Auto-set |
| updatedAt | DateTime | Auto-updated |

**Relations**: accounts[], listings[], reservations[]

### Account (NextAuth OAuth)
| Field | Type | Notes |
|-------|------|-------|
| id | ObjectId | Primary key |
| userId | ObjectId | FK → User (cascade delete) |
| type, provider | String | OAuth provider info |
| providerAccountId | String | Provider's user ID |
| access_token, refresh_token, id_token | String? | OAuth tokens |
| expires_at | Int? | Token expiry |

**Unique**: [provider, providerAccountId]

### Listing
| Field | Type | Notes |
|-------|------|-------|
| id | ObjectId | Primary key |
| title | String | Property name |
| description | String | Property description |
| imageSrc | String | Image URL (EdgeStore) |
| category | String | One of 15 categories |
| roomCount | Int | Number of rooms |
| bathroomCount | Int | Number of bathrooms |
| guestCount | Int | Max guest capacity |
| price | Int | Nightly price (whole number) |
| country | String? | Country name |
| region | String? | Region/state |
| latlng | Int[] | [latitude, longitude] |
| userId | ObjectId | FK → User (cascade delete) |
| createdAt | DateTime | Auto-set |

**Relations**: user, reservations[]

### Reservation
| Field | Type | Notes |
|-------|------|-------|
| id | ObjectId | Primary key |
| userId | ObjectId | FK → User (guest, cascade delete) |
| listingId | ObjectId | FK → Listing (cascade delete) |
| startDate | DateTime | Check-in date |
| endDate | DateTime | Check-out date |
| totalPrice | Int | Total booking price |
| createdAt | DateTime | Auto-set |

**Relations**: user, listing

---

## Authentication System

### Providers (lib/auth.ts)
1. **GitHub OAuth** — env: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
2. **Google OAuth** — env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
3. **Credentials** — email/password with bcrypt (12 salt rounds)

### Session Strategy: JWT
- JWT callback merges user data (including `id`) into token
- Session callback exposes `user.id`, `user.name`, `user.email`
- Secret: `NEXTAUTH_SECRET` env variable

### Route Protection
**Middleware** (`middleware.ts`): Protects `/favorites`, `/properties`, `/reservations`, `/trips`
- Uses NextAuth default middleware export
- Redirects unauthenticated users to `/` (signIn page)

**Server-side double-check**: Each protected page also calls `getCurrentUser()` and renders an unauthorized message if null.

### Registration Flow
```
AuthModal (signup mode) → registerUser() server action
  → bcrypt.hash(password, 12) → db.user.create()
  → returns {id, email, name} (no password)
  → switches to login mode
```

### Login Flow
```
AuthModal (login mode) → signIn("credentials", {email, password})
  → NextAuth authorize(): db.user.findUnique(email) → bcrypt.compare()
  → JWT issued → httpOnly cookie set
  → router.refresh() re-renders server components
```

---

## Key Data Flows

### 1. Search Flow
```
User clicks Search bar → SearchModal opens (3 steps: location → dates → counts)
  → onSubmit builds query string: ?country=UK&startDate=...&endDate=...&guestCount=2
  → router.push(url) navigates to filtered home page
  → app/page.tsx receives searchParams
  → getListings(searchParams) builds Prisma WHERE clause:
      - country exact match
      - roomCount/guestCount/bathroomCount >= values
      - NOT reservations overlapping date range
  → Returns paginated results (16 per page, cursor-based)
```

### 2. Booking/Reservation Flow
```
Listing detail page → ListingClient selects dates
  → useEffect calculates totalPrice = (dayCount + 1) × nightly price
  → User clicks "Reserve"
  → createPaymentSession() server action:
      - Validates listing exists + user authenticated
      - Creates Stripe Product + Checkout Session
      - Metadata: {listingId, startDate, endDate, totalPrice, userId}
  → Redirects to Stripe hosted checkout
  → After payment: Stripe sends webhook to /api/webhooks/stripe
  → Webhook verifies signature, extracts metadata
  → Calls createReservation() → db.listing.update with nested reservation create
  → User redirected to /trips
```

### 3. Favorites Flow
```
HeartButton click → checks auth via useSession()
  → Optimistic UI: immediately toggles heart fill
  → Debounced (300ms): useMutation calls updateFavorite() server action
  → Server: reads current favoriteIds, adds/removes listingId, updates user record
  → revalidatePath("/", "/favorites", "/listings/{id}")
  → On error: reverts optimistic update + toast
```

### 4. Pagination Flow
```
Home page initial load: getListings() returns 16 listings + nextCursor
  → If nextCursor exists: renders <LoadMore> component
  → LoadMore uses useInfiniteQuery with cursor-based pagination
  → useLoadMore hook: IntersectionObserver (240px margin) triggers fetchNextPage
  → Each page: getListings({...filters, cursor}) → next 16 items
  → Continues until nextCursor is null
```

### 5. Listing Creation Flow
```
UserMenu → "Share your home" → RentModal (6 steps):
  Step 0: Category selection (15 options)
  Step 1: Location (CountrySelect + Map)
  Step 2: Counts (guests, rooms, bathrooms)
  Step 3: Image upload (EdgeStore)
  Step 4: Title + Description
  Step 5: Price
  → createListing() server action:
      - Validates all fields present
      - getCurrentUser() auth check
      - parseInt(price, 10)
      - db.listing.create()
  → Invalidates React Query cache
  → Navigates to /listings/{newId}
```

---

## Service Layer Detail

### services/user.ts
- `getCurrentUser()` — calls `getServerSession(authOptions)`, returns `session?.user`

### services/auth.ts
- `registerUser({name, email, password})` — validates presence, bcrypt hash, db.user.create, returns {id, email, name}

### services/listing.ts
- `getListings(query?)` — complex filtering (category, counts, country, date availability), cursor pagination (batch 16), returns {listings, nextCursor}
- `getListingById(id)` — includes user {name, image} and reservations {startDate, endDate}
- `createListing(data)` — validates all fields, auth check, parseInt price, db.listing.create

### services/reservation.ts
- `getReservations({userId?, listingId?, authorId?, cursor?})` — flexible query, includes listing data, cursor pagination
- `createReservation({listingId, startDate, endDate, totalPrice, userId})` — nested create via listing.update, revalidates listing page
- `deleteReservation(reservationId)` — auth check, allows guest OR property owner to cancel, revalidates multiple paths
- `createPaymentSession({listingId, startDate, endDate, totalPrice})` — creates Stripe product + checkout session, returns {url}

### services/favorite.ts
- `getFavorites()` — returns current user's favoriteIds array (or [])
- `updateFavorite({listingId, favorite})` — adds/removes from array, db.user.update, revalidates paths
- `getFavoriteListings()` — fetches full Listing objects for favoriteIds

### services/properties.ts
- `getProperties({userId, cursor?})` — listings by owner, cursor pagination
- `deleteProperty(listingId)` — auth check, must own listing, db.listing.deleteMany, revalidates all paths

---

## Component Architecture

### Server vs Client Components

**Server Components** (no "use client" directive):
- Navbar, Logo, Avatar, Button, Input, Heading, EmptyState, ListingCard, ListingHead, ListingInfo, ListingCategory, ListingReservation, ConfirmDelete, Loader
- All page.tsx files (fetch data server-side)

**Client Components** ("use client"):
- HeartButton, LoadMore, ListingClient, ListingMenu, ImageUpload, Image
- All modals (Modal, AuthModal, SearchModal, RentModal)
- All navbar interactive parts (Search, Categories, CategoryBox, UserMenu, MenuItem)
- Menu compound component, BackButton
- Provider.tsx (wraps QueryClient, Session, EdgeStore, Toaster)

### State Management Patterns

| Pattern | Where | Purpose |
|---------|-------|---------|
| React Query useInfiniteQuery | LoadMore | Pagination with cursor |
| React Query useMutation | HeartButton, ListingMenu | Server action calls |
| React Hook Form | AuthModal, SearchModal, RentModal | Form state |
| useState + useRef | HeartButton | Optimistic updates with rollback |
| useState | Modal, Menu, ListingClient, RentModal | UI state (steps, open/close) |
| useTransition | AuthModal, RentModal, ListingClient, ListingMenu | Async loading states |
| Context API | Modal, Menu | Compound component state sharing |
| NextAuth useSession | HeartButton, AuthModal | Client-side auth status |

### Provider Stack (components/Provider.tsx)
```
QueryClientProvider (staleTime: 60s)
  └── SessionProvider (NextAuth)
      └── EdgeStoreProvider (file uploads)
          └── Toaster (bottom-right)
              └── {children}
```

### Modal System (Compound Component)
```tsx
<Modal>
  <Modal.Trigger name="Login">    // Sets openName state
    <button>Log In</button>
  </Modal.Trigger>
  <Modal.Window name="Login">     // Renders when openName matches
    <Modal.WindowHeader title="Login" />
    <AuthModal />
  </Modal.Window>
</Modal>
```
- Portal rendering (document.body)
- Escape key closes (useKeyPress)
- Outside click closes (useOutsideClick)
- Body scroll lock when open
- Framer Motion animations (fadeIn + slideIn)

### Menu System (Compound Component)
```tsx
<Menu>
  <Menu.Toggle id="menu-1">      // Toggles openId
    <button>...</button>
  </Menu.Toggle>
  <Menu.List>                     // Visible when openId matches
    <Menu.Button onClick={fn}>Action</Menu.Button>
  </Menu.List>
</Menu>
```
- Escape key closes, outside click closes
- Framer Motion zoomIn animation

---

## API Routes

### POST /api/auth/[...nextauth]
NextAuth handler — manages OAuth callbacks, credential login, session management.

### GET/POST /api/edgestore/[...edgestore]
EdgeStore handler — manages file upload to public bucket.

### POST /api/webhooks/stripe
Stripe webhook handler:
1. Verifies `stripe-signature` header against `STRIPE_WEBHOOK_SECRET`
2. Listens for `checkout.session.completed` events
3. Extracts metadata: listingId, startDate, endDate, totalPrice, userId
4. Calls `createReservation()` to persist booking
5. Returns `{result: event, ok: true}` or error response

---

## Price Calculation

```
Client-side (ListingClient):
  dayCount = differenceInCalendarDays(endDate, startDate)
  totalPrice = (dayCount + 1) × price   // +1 includes both start and end date

Stripe:
  unit_amount = totalPrice × 100        // Convert to cents

Database:
  Stores totalPrice as integer (not cents)

Display:
  formatPrice(price) → Intl.NumberFormat("en-US") → "1,500"
```

---

## Date Availability Filtering

### In getListings (search filtering):
```typescript
where.NOT = {
  reservations: {
    some: {
      OR: [
        { endDate: { gte: startDate }, startDate: { lte: startDate } },  // Overlaps start
        { startDate: { lte: endDate }, endDate: { gte: endDate } },      // Overlaps end
      ]
    }
  }
}
```

### In ListingClient (calendar disabled dates):
```typescript
disabledDates = reservations.flatMap(reservation =>
  eachDayOfInterval({ start: reservation.startDate, end: reservation.endDate })
)
```

---

## Performance Optimizations

- **Cursor-based pagination** — efficient for MongoDB, no offset skipping
- **Dynamic imports** — Calendar, Map, SearchModal loaded with `ssr: false`
- **Debouncing** — HeartButton favorite toggle (300ms)
- **Throttling** — Categories scroll listener (150ms)
- **React Query caching** — 60s staleTime, query deduplication
- **IntersectionObserver** — lazy pagination trigger (240px margin)
- **useMemo** — Search duration calculation, Map dependency in RentModal
- **useCallback** — HeartButton debounced handler
- **Prisma singleton** — prevents connection pool exhaustion in dev
- **Image optimization** — Next.js Image component for all listing images

---

## Environment Variables

```
DATABASE_URL=mongodb+srv://...          # MongoDB connection
NEXTAUTH_SECRET=...                     # JWT signing secret
GITHUB_CLIENT_ID=...                    # GitHub OAuth
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...                    # Google OAuth
GOOGLE_CLIENT_SECRET=...
EDGE_STORE_ACCESS_KEY=...               # EdgeStore file uploads
EDGE_STORE_SECRET_KEY=...
STRIPE_PUBLIC_KEY=pk_...                # Stripe public key
STRIPE_SECRET_KEY=sk_...                # Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...         # Stripe webhook verification
NEXT_PUBLIC_SERVER_URL=http://localhost:3000  # App URL (for Stripe redirects)
GA_MEASUREMENT_ID=...                   # Google Analytics (optional)
```

---

## Image Domain Allowlist (next.config.js)
- `res.cloudinary.com` — Cloudinary CDN
- `lh3.googleusercontent.com` — Google OAuth avatars
- `avatars.githubusercontent.com` — GitHub OAuth avatars
- `files.edgestore.dev` — EdgeStore uploads
