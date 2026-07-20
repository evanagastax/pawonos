# PawonOS v1.0.0 - Production Release

Food Production ERP for Catering Businesses

## Features

### Core (26 Modules)
- Auth, Ingredients, Suppliers, Packaging, Recipes
- Menu Items, Meal Templates, Meal Calendar
- Customers, Orders, Production, Inventory
- Purchasing, Delivery, Cost Engine

### Finance
- Expenses, Cash Flow, P&L Reports
- Invoices & Payment Tracking
- Payroll Management

### Intelligence
- Analytics Dashboard
- AI Forecast (Demand, Ingredients, Revenue)
- CRM (Segmentation, Top Customers)

### Sales & Portals
- POS (Walk-in Orders)
- Customer Portal
- Supplier Portal

### Infrastructure
- Docker Production Config
- CI/CD (GitHub Actions)
- Health Checks
- Backup/Restore Scripts
- Security (Helmet, Rate Limiting)

## Tech Stack
- Frontend: Next.js 15, React 19, TailwindCSS, shadcn/ui
- Backend: NestJS, Prisma, PostgreSQL
- Infra: Docker, Caddy, MinIO

## Quick Start
```bash
git clone https://github.com/evanagastax/pawonos.git
cd pawonos
npm install
npm run db:push
npm run db:seed
npm run dev
```

Login: admin@pawonos.com / admin123