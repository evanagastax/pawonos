# Contributing to PawonOS

Thank you for your interest in contributing to PawonOS!

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Submit a pull request

## Development Setup

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/pawonos.git
cd pawonos

# Install
npm install

# Setup env
cp .env.example .env

# Database
npm run db:push
npm run db:seed

# Dev
npm run dev
```

## Code Style

- TypeScript strict mode
- ESLint + Prettier
- Follow existing patterns
- No comments unless necessary

## Commits

Follow Conventional Commits:
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `style:` formatting
- `refactor:` code refactor
- `test:` adding tests
- `chore:` maintenance

## Pull Requests

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Keep PRs focused and small

## Architecture

```
apps/
├── web/          # Next.js frontend
└── api/          # NestJS backend

packages/
├── database/     # Prisma schema
├── types/        # Shared types
├── validation/   # Zod schemas
└── utils/        # Utilities
```

## Adding a Module

1. Create module in `apps/api/src/modules/`
2. Add to `AppModule` imports
3. Create service, controller, DTOs
4. Create frontend page in `apps/web/src/app/dashboard/`
5. Add to sidebar navigation

## Questions?

Open an issue on GitHub.