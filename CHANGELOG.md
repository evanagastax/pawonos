# Changelog

All notable changes to PawonOS will be documented in this file.

## [1.0.0] - 2026-07-20

### Added

#### Core Modules
- Authentication (JWT, roles, permissions)
- Ingredients management (CRUD, categories, units)
- Suppliers management
- Packaging management
- Recipes with versioning
- Menu Items
- Meal Templates
- Meal Calendar

#### Operations
- Customers management
- Orders with full lifecycle
- Production batch generation
- Inventory management (stock, reservations, transactions)
- Purchasing (PO, receiving, suggestions)
- Delivery tracking

#### Finance
- Cost Engine (Standard, Actual, Forecast HPP)
- Expenses management
- Cash flow & P&L reports
- Invoices & payment tracking
- Payroll management

#### Intelligence
- Analytics dashboard
- AI Forecast (demand, ingredients, revenue)
- CRM (segmentation, top customers)

#### Sales
- POS (walk-in orders)

#### Portals
- Customer Portal
- Supplier Portal

#### Infrastructure
- Docker production config
- CI/CD (GitHub Actions)
- Health checks
- Backup/restore scripts
- Security (helmet, rate limiting)
- Swagger API documentation
- PWA support

### Technical
- Next.js 15 + React 19 frontend
- NestJS backend
- Prisma ORM + PostgreSQL
- TailwindCSS + shadcn/ui
- Unit tests (Vitest)
- E2E tests (Playwright)