# PawonOS Monitoring Configuration

# Health Check Endpoints
# GET /api/health - Full health check with DB, memory
# GET /api/health/ready - Readiness probe
# GET /api/health/live - Liveness probe

# Recommended Monitoring Stack:
# 1. Uptime Kuma - Simple uptime monitoring
# 2. Grafana + Prometheus - Metrics
# 3. Loki - Log aggregation

# Docker Health Checks (already in docker-compose)
# postgres: pg_isready
# api: curl /api/health
# web: curl /

# Alerting Thresholds:
# - API response time > 2s
# - Error rate > 5%
# - Database connection failures
# - Memory usage > 80%
# - Disk usage > 90%

# Log Levels:
# - error: System errors, failures
# - warn: Slow queries, high memory
# - info: Request logs, business events
# - debug: Detailed debugging (dev only)