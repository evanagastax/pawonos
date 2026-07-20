# PawonOS Deployment Guide

## Option 1: Coolify (Recommended)

### Prerequisites
- VPS with Docker installed
- Domain pointed to VPS
- Coolify instance running

### Steps

1. **Create New Project in Coolify**
   - Name: `pawonos`
   - Environment: `production`

2. **Add PostgreSQL Service**
   - Image: `postgres:16-alpine`
   - Database: `pawonos`
   - User: `pawonos`
   - Password: (generate secure password)

3. **Add Application**
   - Source: GitHub Repository
   - Repo: `evanagastax/pawonos`
   - Branch: `master`
   - Build Pack: Docker Compose
   - Docker Compose File: `docker-compose.prod.yml`

4. **Environment Variables**
   ```
   POSTGRES_PASSWORD=your_secure_password
   JWT_SECRET=your_jwt_secret_min_32_chars
   APP_URL=https://your-domain.com
   NODE_ENV=production
   ```

5. **Deploy**
   - Click Deploy
   - Wait for build
   - Run database migration: `npx prisma db push`

---

## Option 2: VPS Manual Deploy

### Prerequisites
- Ubuntu 22.04+ VPS
- Docker & Docker Compose installed
- Domain pointed to VPS

### Steps

1. **SSH into VPS**
   ```bash
   ssh root@your-vps-ip
   ```

2. **Clone Repository**
   ```bash
   cd /opt
   git clone https://github.com/evanagastax/pawonos.git
   cd pawonos
   ```

3. **Setup Environment**
   ```bash
   cp .env.production .env
   nano .env
   # Edit with your values
   ```

4. **Deploy**
   ```bash
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh
   ```

5. **Setup SSL (Caddy auto-handles)**
   - Point domain to VPS IP
   - Caddy will auto-provision SSL

6. **Setup Backups**
   ```bash
   # Add to crontab
   crontab -e
   # Add: 0 2 * * * /opt/pawonos/scripts/backup.sh
   ```

---

## Option 3: Docker Compose (Local/Dev)

```bash
# Clone
git clone https://github.com/evanagastax/pawonos.git
cd pawonos

# Start
docker compose up -d

# Migrate
docker compose exec api npx prisma db push

# Seed
docker compose exec api npx prisma seed

# Access
# Web: http://localhost:3000
# API: http://localhost:4000
```

---

## Post-Deploy Checklist

- [ ] Change default admin password
- [ ] Setup SSL certificate
- [ ] Configure backups
- [ ] Setup monitoring
- [ ] Test all critical flows
- [ ] Configure email (future)
- [ ] Setup CDN (future)