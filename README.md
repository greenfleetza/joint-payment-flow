# ZakaPay — Joint Payment Flow

A multi-source payment orchestration platform that lets merchants accept a single successful payment while buyers split the cost across contributors or multiple cards.

## Architecture

- **Frontend**: React 19 + TanStack Start (file-based routing) + Tailwind CSS + Framer Motion
- **Backend**: Convex (realtime database + server functions)
- **Auth**: Clerk (merchant authentication)
- **Payments**: Stripe (PaymentIntents with manual capture)
- **Email**: Resend (transactional emails)
- **Observability**: Sentry (error tracking) + PostHog (analytics)

## Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
# Convex
VITE_CONVEX_URL=https://your-deployment.convex.cloud/
CONVEX_DEPLOYMENT=dev:your-deployment|your-key

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Resend
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# App
VITE_APP_URL=http://localhost:3000
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Convex**:
   ```bash
   npx convex dev
   ```
   This will push the schema to your Convex deployment and generate the API.

3. **Start the dev server**:
   ```bash
   npm run dev
   ```

4. **Open the app**:
   Navigate to `http://localhost:3000`

## Checkout Flows

### Contributor Split
1. Merchant creates a session and adds contributors
2. Each contributor receives a unique payment link
3. Contributors pay their share via secure signed links
4. Merchant sees one successful payment when all contributors have paid

### Multi-Card Split
1. Buyer selects multiple payment methods
2. Amount is allocated across selected cards/wallets
3. Methods are authorized sequentially
4. All methods are captured atomically

## Key Features

- **Real-time progress tracking** with live status updates
- **Share links** for contributor invitations
- **Payment method management** (add/remove cards and wallets)
- **Split evenly** functionality for quick allocation
- **Email notifications** via Resend for invitations and reminders
- **Stripe PaymentIntents** with manual capture for secure payments
- **Merchant dashboard** with session management and analytics
- **Responsive design** with glassmorphism UI

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── checkout-shell.tsx    # Checkout page layout
│   ├── dashboard-shell.tsx   # Dashboard layout with sidebar
│   ├── payment-method-picker.tsx
│   ├── payment-method-sheet.tsx
│   └── processing-card.tsx   # Card flip animation
├── routes/              # File-based routing
│   ├── checkout.$sessionId.*.tsx  # Checkout flow screens
│   ├── _authenticated/          # Dashboard pages
│   └── auth.tsx                 # Authentication
├── lib/                 # Utilities and stores
│   ├── tx-store.ts            # In-memory transaction store
│   ├── email-templates.ts     # HTML email templates
│   └── convex.tsx             # Convex provider setup
└── integrations/        # Third-party integrations
    ├── clerk/                 # Clerk auth provider
    └── supabase/              # Supabase client (legacy)
convex/
├── schema.ts            # Database schema
├── sessions.ts          # Session CRUD operations
└── email.ts             # Resend email + Stripe actions
```

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run preview` — Preview production build
- `npm run lint` — Run ESLint
- `npm run format` — Format with Prettier

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run lint` and `npm run build`
4. Submit a pull request

## License

MIT © ZakaPay
