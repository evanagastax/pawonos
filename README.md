# PawonOS

**Food Production ERP for Catering Businesses**

PawonOS is a comprehensive ERP system designed specifically for catering businesses. It manages the complete workflow from customer orders to production, delivery, and financial analysis.

## Features

### Core Modules
- **Authentication** - JWT-based auth with roles & permissions
- **Ingredients** - Master data with categories, units, suppliers
- **Recipes** - Versioned recipes with ingredient tracking
- **Menu Items** - Customer-facing products linked to recipes
- **Meal Templates** - Reusable meal bundles
- **Meal Calendar** - Production scheduling

### Operations
- **Customers** - CRM with order history
- **Orders** - Full lifecycle management
- **Production** - Batch generation & tracking
- **Inventory** - Stock management with transactions
- **Purchasing** - PO management & receiving
- **Delivery** - Tracking & status updates

### Finance
- **Cost Engine** - HPP calculation (Standard, Actual, Forecast)
- **Finance** - Expenses, cash flow, P&L reports
- **Invoices** - Invoice generation & payment tracking
- **Payroll** - Employee salary management

### Intelligence
- **Analytics** - Business insights & reports
- **AI Forecast** - Demand prediction & optimization
- **CRM** - Customer segmentation & analysis
- **POS** - Walk-in order management

### Portals
- **Customer Portal** - Order tracking
- **Supplier Portal** - PO visibility

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TailwindCSS, shadcn/ui |
| Backend | NestJS, Prisma, PostgreSQL |
| Auth | JWT, Passport |
| Infrastructure | Docker, Caddy, MinIO |

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- npm 10+

### Installation

```bash
# Clone repository
git clone https://github.com/evanagastax/pawonos.git
cd pawonos

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Push database schema
npm run db:push

# Seed initial data
npm run db:seed

# Start development servers
npm run dev
```

### Default Login
- **Email:** admin@pawonos.com
- **Password:** admin123

## Project Structure

```
pawonos/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   ├── database/     # Prisma schema
│   ├── types/        # Shared TypeScript types
│   ├── validation/   # Zod schemas
│   └── utils/        # Utility functions
├── docker/           # Docker configs
└── scripts/          # Deployment scripts
```

## API Documentation

Swagger docs available at: `http://localhost:4000/docs`

## Deployment

### Docker Production

```bash
# Setup environment
cp .env.production .env
# Edit .env with production values

# Deploy
./scripts/deploy.sh
```

### Manual Deployment

```bash
# Build
npm run build

# Start
npm run start
```

## Development

### Commands

```bash
npm run dev          # Start dev servers
npm run build        # Build for production
npm run db:push      # Push schema changes
npm run db:seed      # Seed database
npm run lint         # Run linter
npm run test         # Run tests
```

### Adding a Module

1. Create module in `apps/api/src/modules/`
2. Add to `AppModule` imports
3. Create frontend page in `apps/web/src/app/dashboard/`
4. Add to sidebar navigation

## License

MIT

## Support

https://github.com/evanagastax/pawonos/issues