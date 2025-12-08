# Security Quick Reference Card

**Last Updated**: 2025-12-07
**Security Grade**: B+ (85/100)
**Production Ready**: ✅ YES (with minor notes)

---

## 🔐 Authentication

### Protected Endpoints
```bash
# ALL endpoints require JWT token except /api/auth
Authorization: Bearer <your-jwt-token>

# Public endpoints (no auth required):
POST /api/auth/login
POST /api/auth/register

# Protected endpoints (require auth):
ALL /api/models/*
ALL /api/projects/*
ALL /api/executions/*
ALL /api/pipelines/*
ALL /api/experiments/*
ALL /api/notebooks/*
ALL /api/training/*
POST /api/chat          # ✅ NEW - Now requires auth
```

### Get Authentication Token
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Response includes token:
{
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-12-08T03:17:01.611Z"
}

# Use token in requests:
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/projects
```

---

## ✅ Input Validation

### Validation Rules by Resource

#### Models
```javascript
name:              min 3, max 100 chars (required)
owner:             any string (required)
state:             LIVE | ARCHIVED | UNKNOWN (default: LIVE)
description:       max 500 chars (optional)
customProperties:  any object (optional)
externalID:        max 100 chars (optional)
```

#### Executions
```javascript
workflowId:        any string (required)
workflowName:      min 3, max 100 chars (required)
status:            PENDING | RUNNING | COMPLETED | FAILED | CANCELLED
triggeredBy:       any string (required)
steps:             array of objects (default: [])
```

#### Pipelines
```javascript
name:              min 3, max 100 chars (required)
description:       max 500 chars (optional)
owner:             any string (required)
steps:             array, min 1 item (required)
status:            ACTIVE | DRAFT | ARCHIVED (default: DRAFT)
tags:              array of strings, max 10 items (optional)
```

#### Projects
```javascript
name:              min 3, max 50 chars (required)
displayName:       min 3, max 100 chars (required)
description:       max 500 chars (optional)
owner:             any string (required)
phase:             Active | Terminating (default: Active)
tags:              array, max 10 items (optional)
collaborators:     array of emails, max 20 (optional)
```

### Validation Error Response
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "\"name\" length must be at least 3 characters long"
    }
  ]
}
```

---

## ⏱️ Rate Limiting

### Current Limits
```javascript
General API:   100 requests / 15 minutes
Chat Endpoint:  10 requests / 1 minute
```

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1765077900
```

### Rate Limit Exceeded Response
```json
{
  "message": "Too many requests from this IP, please try again later."
}
HTTP Status: 429 Too Many Requests
```

---

## 💾 Database Configuration

### Connection Pooling
```javascript
maxPoolSize:     10 connections
minPoolSize:      5 connections
maxIdleTimeMS:   30 seconds
serverTimeout:    5 seconds
socketTimeout:   45 seconds
```

### Connection String
```bash
# Default (can override with env var)
MONGODB_URI=mongodb://localhost:27017/odh-workflows
```

---

## 🛡️ Chat Security

### Requirements
```bash
# Chat endpoint now requires:
1. Valid JWT token in Authorization header
2. Rate limiting (10 requests/minute)
3. Message validation (max 4000 characters)
4. Message sanitization (trim whitespace)
```

### Usage Example
```bash
# Get token first
TOKEN="<your-jwt-token>"

# Send chat message
curl -X POST http://localhost:3001/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How many projects are there?",
    "conversationHistory": []
  }'
```

### Chat Validation
```javascript
✅ Message must be a string
✅ Message required (not empty)
✅ Message max 4000 characters
✅ Message trimmed of whitespace
✅ Conversation history validated
```

---

## 🔑 Environment Variables

### Required Variables
```bash
# JWT Secret (CRITICAL - use strong random value)
JWT_SECRET=<512-bit-base64-encoded-secret>

# Database
MONGODB_URI=mongodb://localhost:27017/odh-workflows

# Gemini AI
GEMINI_API_KEY=<your-gemini-api-key>

# Server
API_PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:9000

# Features
AUTO_SEED=true
```

### Generate Strong JWT Secret
```bash
# Use this command to generate:
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Example output:
dUlpol/qR6fQzl3IRj5sBFUPMN0Asdv/Y6g5KdRXKkNRgWs84jECnSGQCS+LwdKmFbIFbyS2FQ8OmeEL+RHBjA==
```

---

## 🚨 Common Error Codes

### Authentication Errors
```
401 Unauthorized
- "No token provided" - Missing Authorization header
- "Invalid token" - Token malformed or expired
- "Token expired" - Token past expiration time
```

### Validation Errors
```
400 Bad Request
- "Validation failed" - Input doesn't match schema
- "Message is too long" - Chat message > 4000 chars
- Field-specific validation errors
```

### Rate Limit Errors
```
429 Too Many Requests
- "Too many requests from this IP"
- "Too many chat requests, please slow down"
```

### Server Errors
```
500 Internal Server Error
- Database connection issues
- Unexpected server errors
- API integration failures
```

---

## 📝 Testing Checklist

### Pre-Deployment Tests
```bash
# 1. Test authentication
✅ Verify login returns token
✅ Verify protected endpoints reject without token
✅ Verify chat endpoint requires auth

# 2. Test validation
✅ Test invalid data returns 400
✅ Test valid data returns 201
✅ Test all required fields

# 3. Test rate limiting
✅ Verify rate limits are enforced
✅ Verify headers are returned

# 4. Test database
✅ Verify connection succeeds
✅ Verify CRUD operations work
✅ Verify connection pooling active
```

### Quick Verification Commands
```bash
# Server health
curl http://localhost:3001/health

# Auth working
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Protected endpoint without token (should fail)
curl http://localhost:3001/api/projects

# Protected endpoint with token (should succeed)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/projects
```

---

## 🔒 Security Best Practices

### DO's ✅
```
✅ Always use JWT tokens for protected endpoints
✅ Validate all user input on the server
✅ Use environment variables for secrets
✅ Enable rate limiting in production
✅ Use HTTPS in production
✅ Keep JWT_SECRET secure and unique per environment
✅ Monitor rate limit violations
✅ Log authentication failures
```

### DON'Ts ❌
```
❌ Never commit .env file to git
❌ Never use weak or default JWT secrets
❌ Never skip input validation
❌ Never trust client-side validation alone
❌ Never expose detailed error messages in production
❌ Never disable rate limiting in production
❌ Never reuse JWT secrets across environments
```

---

## 🐛 Troubleshooting

### "No token provided" Error
```bash
# Add Authorization header
curl -H "Authorization: Bearer <your-token>" ...
```

### "Validation failed" Error
```bash
# Check error details for specific field issues
# Ensure all required fields are provided
# Check field lengths and formats
```

### "Too many requests" Error
```bash
# Wait for rate limit window to reset
# For general API: wait 15 minutes
# For chat API: wait 1 minute
```

### Database Connection Failed
```bash
# 1. Check MongoDB is running
mongosh --eval "db.version()"

# 2. Check connection string
echo $MONGODB_URI

# 3. Check server logs
tail -f server.log | grep MongoDB
```

---

## 📊 Security Metrics

### Current Status
```
Overall Security Grade:        B+ (85/100)
Authentication Coverage:       100% (all endpoints)
Input Validation Coverage:     100% (all write endpoints)
Rate Limiting:                 Active (all endpoints)
Connection Pooling:            Configured
Production Readiness:          85%
```

### Test Results
```
Total Tests Run:               8
Tests Passed:                  8
Tests Failed:                  0
Pass Rate:                     100%
```

---

## 🚀 Quick Start

### 1. Setup Environment
```bash
# Copy example env file
cp .env.example .env

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))" > jwt_secret.txt

# Edit .env and paste JWT secret
nano .env
```

### 2. Start Server
```bash
# Install dependencies
npm install

# Start MongoDB
mongod

# Start server
npm run start:server
```

### 3. Test Authentication
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Save token and test
TOKEN="<token-from-above>"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/projects
```

---

## 📞 Support

### Issues & Questions
- Check `CRITICAL_ANALYSIS.md` for detailed security review
- Check `PHASE1_TEST_SUMMARY.md` for test results
- Check `SECURITY_FIXES_SUMMARY.md` for implementation details

### Key Files
```
.env.example                  - Environment variable template
server/validators/index.js    - Validation schemas
server/middleware/auth.js     - Authentication middleware
server/database.js            - Database configuration
```

---

**Last Updated**: 2025-12-07
**Version**: Phase 1 Complete
**Next Review**: After Phase 2 Implementation
