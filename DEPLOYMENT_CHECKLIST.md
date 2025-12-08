# Production Deployment Checklist

**Application**: Open Data Hub Dashboard
**Current Version**: Phase 1 Complete
**Security Grade**: B+ (85/100)
**Production Ready**: 85% ✅

---

## Pre-Deployment Checklist

### 🔐 Security Configuration

#### Environment Variables
- [ ] **Generate new JWT secret for production**
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
  ```
- [ ] **Set strong JWT_SECRET in production .env**
  - Never reuse development secret
  - Store securely (AWS Secrets Manager, Vault, etc.)

- [ ] **Configure production MONGODB_URI**
  - Use MongoDB Atlas or production cluster
  - Enable authentication on MongoDB
  - Use strong database password
  - Whitelist only necessary IP addresses

- [ ] **Set production GEMINI_API_KEY**
  - Use production-specific API key
  - Set usage limits/quotas in Google Cloud
  - Enable billing alerts

- [ ] **Configure CORS_ORIGIN**
  - Set to actual frontend domain
  - Never use wildcard (*) in production
  ```bash
  CORS_ORIGIN=https://yourdomain.com
  ```

- [ ] **Set NODE_ENV=production**
  ```bash
  NODE_ENV=production
  ```

#### Authentication & Authorization
- [ ] **Verify JWT expiration time is appropriate**
  - Current: 24h
  - Consider shorter expiration for high-security environments
  - Implement refresh token mechanism if needed

- [ ] **Test authentication on all endpoints**
  ```bash
  # All protected endpoints should return 401 without token
  curl https://api.yourdomain.com/api/projects
  # Should return: {"error":"No token provided"}
  ```

- [ ] **Verify rate limiting is active**
  - General API: 100 req/15min
  - Chat endpoint: 10 req/1min
  - Adjust if needed based on expected traffic

#### Input Validation
- [ ] **Verify validation on all routes**
  - Test invalid inputs return 400 errors
  - Check validation error messages are not too verbose
  - Ensure no sensitive info in error messages

---

### 💾 Database Configuration

#### MongoDB Setup
- [ ] **Enable authentication**
  ```javascript
  use admin
  db.createUser({
    user: "odhAdmin",
    pwd: "<strong-password>",
    roles: [{ role: "readWrite", db: "odh-workflows" }]
  })
  ```

- [ ] **Create database indexes**
  - Verify all model indexes are created
  - Check for slow queries
  - Add compound indexes if needed

- [ ] **Configure connection pooling**
  - Current settings:
    ```javascript
    maxPoolSize: 10
    minPoolSize: 5
    maxIdleTimeMS: 30000
    ```
  - Adjust based on expected load

- [ ] **Set up database backups**
  - Daily automated backups
  - Test restore procedure
  - Store backups in different region/datacenter

- [ ] **Enable MongoDB monitoring**
  - Set up alerts for high CPU/memory
  - Monitor slow queries
  - Track connection pool usage

---

### 🌐 Network & Infrastructure

#### SSL/TLS
- [ ] **Install SSL certificate**
  - Use Let's Encrypt or commercial certificate
  - Configure auto-renewal

- [ ] **Force HTTPS**
  - Redirect all HTTP to HTTPS
  - Set HSTS headers
  ```javascript
  app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });
  ```

#### Reverse Proxy
- [ ] **Configure Nginx/Apache**
  - Set up reverse proxy to Node.js
  - Configure request size limits
  - Enable gzip compression
  - Set proper security headers

- [ ] **Rate limiting at proxy level**
  - Additional layer of protection
  - Consider Cloudflare or similar CDN

---

### 📝 Logging & Monitoring

#### Application Logging
- [ ] **Replace console.log with Winston** (Phase 2)
  - Configure log levels
  - Set up log rotation
  - Store logs in centralized location

- [ ] **Set up error tracking**
  - Sentry, DataDog, or similar
  - Configure error alerting
  - Test error reporting

#### Monitoring
- [ ] **Set up application monitoring**
  - Health check endpoint (/health) responding
  - Monitor response times
  - Track error rates

- [ ] **Set up infrastructure monitoring**
  - CPU, memory, disk usage
  - Network traffic
  - Database connections

- [ ] **Configure alerts**
  - High error rate (>1%)
  - Slow response times (>2s)
  - Database connection errors
  - Rate limit violations
  - Failed authentication attempts

---

### 🧪 Testing

#### Pre-Deployment Tests
- [ ] **Run security tests**
  ```bash
  # Test authentication
  curl -X POST https://api.yourdomain.com/api/chat \
    -d '{"message":"test"}'
  # Should return 401
  ```

- [ ] **Test validation**
  ```bash
  # Get token
  TOKEN=$(curl -s -X POST https://api.yourdomain.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"<prod-password>"}' | \
    jq -r '.token')

  # Test invalid input
  curl -X POST https://api.yourdomain.com/api/models \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"ab"}' # Should return 400
  ```

- [ ] **Load testing**
  - Test with expected traffic levels
  - Test rate limiting under load
  - Verify database performance

- [ ] **Failover testing**
  - Test database connection loss
  - Test API key failure
  - Verify fallback mechanisms

---

### 🚀 Deployment Steps

#### Pre-Deployment
- [ ] **Create production .env file**
  ```bash
  cp .env.example .env.production
  # Edit with production values
  ```

- [ ] **Install dependencies**
  ```bash
  npm ci --production
  ```

- [ ] **Build frontend**
  ```bash
  npm run build
  ```

- [ ] **Run database migrations** (if any)

#### Deployment
- [ ] **Deploy to production server**
  - Use PM2, systemd, or container orchestration
  - Configure auto-restart on failure

- [ ] **Start application**
  ```bash
  # Using PM2
  pm2 start server/server.js --name odh-api
  pm2 save
  pm2 startup

  # Using systemd
  sudo systemctl start odh-api
  sudo systemctl enable odh-api
  ```

- [ ] **Verify health endpoint**
  ```bash
  curl https://api.yourdomain.com/health
  # Should return: {"status":"ok","timestamp":"..."}
  ```

#### Post-Deployment
- [ ] **Monitor logs for errors**
  ```bash
  pm2 logs odh-api
  # OR
  journalctl -u odh-api -f
  ```

- [ ] **Test critical endpoints**
  - Login
  - List projects
  - Create model
  - Chat endpoint (with auth)

- [ ] **Check monitoring dashboards**
  - Application metrics
  - Error rates
  - Response times

- [ ] **Verify database connections**
  - Check connection pool metrics
  - No connection errors in logs

---

### 🔒 Security Hardening

#### Server Security
- [ ] **Update OS and packages**
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```

- [ ] **Configure firewall**
  ```bash
  # Allow only necessary ports
  sudo ufw allow 22/tcp    # SSH
  sudo ufw allow 80/tcp    # HTTP
  sudo ufw allow 443/tcp   # HTTPS
  sudo ufw enable
  ```

- [ ] **Disable unnecessary services**

- [ ] **Set up SSH key authentication**
  - Disable password authentication

- [ ] **Configure fail2ban**
  - Protect against brute force attacks

#### Application Security
- [ ] **Set security headers**
  ```javascript
  app.use(helmet());
  ```

- [ ] **Disable X-Powered-By header**
  ```javascript
  app.disable('x-powered-by');
  ```

- [ ] **Configure CORS properly**
  - Restrict to known origins only

- [ ] **Review and minimize dependencies**
  ```bash
  npm audit
  npm audit fix
  ```

---

### 📋 Documentation

- [ ] **Update README with production info**
  - Deployment instructions
  - Environment variable reference
  - Troubleshooting guide

- [ ] **Document API endpoints**
  - Create OpenAPI/Swagger spec
  - Document authentication requirements
  - Include example requests

- [ ] **Create runbook**
  - Common issues and solutions
  - Rollback procedures
  - Emergency contacts

- [ ] **Update team knowledge base**
  - Architecture overview
  - Security measures
  - Monitoring dashboards

---

### 🔄 Rollback Plan

#### Prepare Rollback
- [ ] **Keep previous version available**
  - Tag current version in git
  - Keep previous deployment package

- [ ] **Document rollback procedure**
  ```bash
  # Example rollback with PM2
  pm2 stop odh-api
  git checkout v1.0.0
  npm ci --production
  pm2 restart odh-api
  ```

- [ ] **Test rollback in staging**

#### Rollback Triggers
- [ ] **Define rollback criteria**
  - Error rate > 5%
  - Response time > 5 seconds
  - Authentication failures > 10%
  - Database connection errors

---

### 📊 Success Criteria

#### Performance Metrics
- [ ] **Response time < 500ms** (p95)
- [ ] **Error rate < 1%**
- [ ] **Uptime > 99.5%**
- [ ] **Database queries < 100ms** (p95)

#### Security Metrics
- [ ] **No failed security tests**
- [ ] **Rate limiting active and effective**
- [ ] **All authentication working**
- [ ] **No validation bypasses**

---

## Post-Deployment Monitoring (First 24 Hours)

### Hour 1-2: Critical Monitoring
- [ ] Monitor error logs continuously
- [ ] Watch response times
- [ ] Check database connections
- [ ] Verify authentication working

### Hour 2-8: Active Monitoring
- [ ] Check logs every 30 minutes
- [ ] Monitor error rates
- [ ] Review user feedback
- [ ] Check rate limiting effectiveness

### Hour 8-24: Regular Monitoring
- [ ] Check logs every 2 hours
- [ ] Review metrics dashboards
- [ ] Analyze slow queries
- [ ] Plan optimizations if needed

---

## Emergency Contacts

### Technical Issues
- **DevOps Lead**: [Contact Info]
- **Backend Lead**: [Contact Info]
- **Security Team**: [Contact Info]

### Service Providers
- **MongoDB Atlas**: [Support Link]
- **Google Cloud (Gemini API)**: [Support Link]
- **Hosting Provider**: [Support Link]

---

## Deployment Validation

After completing all checklist items, run this validation:

```bash
#!/bin/bash

echo "=== Deployment Validation ==="

# 1. Health check
echo "1. Testing health endpoint..."
curl -s https://api.yourdomain.com/health | jq

# 2. Authentication test
echo "2. Testing authentication..."
curl -s https://api.yourdomain.com/api/projects | jq
# Should return 401

# 3. Login test
echo "3. Testing login..."
TOKEN=$(curl -s -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"PROD_PASSWORD"}' | jq -r '.token')

if [ "$TOKEN" != "null" ]; then
  echo "✅ Login successful"
else
  echo "❌ Login failed"
  exit 1
fi

# 4. Authenticated request test
echo "4. Testing authenticated request..."
curl -s -H "Authorization: Bearer $TOKEN" \
  https://api.yourdomain.com/api/projects | jq '.total'

# 5. Validation test
echo "5. Testing input validation..."
RESPONSE=$(curl -s -X POST https://api.yourdomain.com/api/models \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"ab"}')

if echo "$RESPONSE" | grep -q "Validation failed"; then
  echo "✅ Validation working"
else
  echo "❌ Validation not working"
  exit 1
fi

# 6. Rate limiting test
echo "6. Testing rate limiting..."
# Check headers
curl -s -I https://api.yourdomain.com/api/projects | grep -i ratelimit

echo ""
echo "=== Validation Complete ==="
```

---

## Sign-Off

- [ ] **Technical Lead Approval**: _________________ Date: _______
- [ ] **Security Review Approval**: _________________ Date: _______
- [ ] **DevOps Approval**: _________________ Date: _______
- [ ] **Product Owner Approval**: _________________ Date: _______

---

**Deployment Date**: ______________
**Deployed By**: ______________
**Version**: ______________
**Rollback Plan Tested**: [ ] Yes [ ] No

---

**Notes**:
