# 🔗 Frontend-Backend Integration Guide

## ✅ What I Just Fixed

### Issue 1: Registration Failing
**Problem**: Backend expects `name`, `role`, and `company` fields, but frontend was sending `firstName` and `lastName`.

**Solution**: Updated `AuthContext.js` to transform the data:
```javascript
const registerData = {
  name: `${firstName} ${lastName}`,
  email: email,
  password: password,
  role: role || 'Technician',
  company: company
};
```

### Issue 2: Page Auto-Refreshing on Login
**Problem**: Form submission wasn't properly preventing default behavior and missing redirect on success.

**Solution**: 
- Added `e.preventDefault()` and `e.stopPropagation()`
- Added redirect to `/dashboard` on successful login/register
- Added better error handling with console logging

### Issue 3: Missing Registration Fields
**Problem**: Registration form didn't have `role` and `company` fields.

**Solution**: Added these fields to the registration form

---

## 🧪 How to Test Now

### Test Registration (Step by Step)

1. **Open your browser**: http://localhost:3000/login

2. **Click "create a new account"**

3. **Fill in the registration form**:
   - First Name: `John`
   - Last Name: `Doe`
   - Company: `Test Company`
   - Role: `Technician` (or IT_Manager/Admin)
   - Email: `john.doe@test.com`
   - Password: `password123` (minimum 6 characters)

4. **Click "Create account"**

5. **You should**:
   - See a loading spinner briefly
   - Be automatically redirected to `/dashboard`
   - See your user data in the dashboard

### Test Login

1. **After registering, logout** (or open in incognito)

2. **Go to**: http://localhost:3000/login

3. **Fill in the login form**:
   - Email: `john.doe@test.com`
   - Password: `password123`

4. **Click "Sign in"**

5. **You should be redirected to the dashboard**

---

## 🔍 Debugging Tips

### Check Browser Console

Open Chrome DevTools (F12) and check:

1. **Console Tab** - Look for:
   ```
   Registration error: {...}  // Shows backend error details
   Login error: {...}         // Shows login error details
   ```

2. **Network Tab** - Check:
   - Request to `http://localhost:5000/api/auth/register` or `login`
   - Status code (should be 200 or 201 for success)
   - Response body (shows token and user data)

### Common Errors and Solutions

#### Error: "Email is required"
- Make sure you fill in the email field

#### Error: "Password must be at least 6 characters"
- Use a password with 6+ characters

#### Error: "User already exists"
- This email is already registered
- Try a different email or use login instead

#### Error: "Missing credentials"
- Both email and password are required

#### Error: Network Error / CORS
- Make sure backend is running: `curl http://localhost:5000/health`
- Check backend console for CORS errors

---

## 📝 Backend API Requirements (Reference)

### Registration Endpoint: `POST /api/auth/register`

**Required Fields:**
```json
{
  "name": "John Doe",           // Full name (string, 1-100 chars)
  "email": "john@example.com",  // Valid email
  "password": "password123",    // Minimum 6 characters
  "role": "Technician",         // Admin | IT_Manager | Technician
  "company": "Test Company"     // Company name (string, 1-100 chars)
}
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Technician",
    "company": "Test Company",
    "createdAt": "2024-01-20T..."
  }
}
```

**Error Response (400):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Please provide a valid email",
      "value": "invalid-email"
    }
  ]
}
```

### Login Endpoint: `POST /api/auth/login`

**Required Fields:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Technician",
    "company": "Test Company",
    "lastLogin": "2024-01-20T..."
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials",
  "details": "Email or password is incorrect"
}
```

---

## 🎯 What to Expect

### After Successful Registration:
1. User account is created in MongoDB
2. JWT token is generated and saved to localStorage
3. User is automatically logged in
4. Redirected to `/dashboard`
5. Can now access all protected routes

### After Successful Login:
1. JWT token is validated
2. Token saved to localStorage
3. User data loaded
4. Redirected to `/dashboard`
5. Token automatically included in all API requests

### Token Management:
- Token is stored in `localStorage` with key `token`
- Token is automatically added to all API requests via interceptor
- Token expires after 7 days (configured in backend)
- On 401 error, user is redirected to `/login`

---

## 🛠️ Manual API Testing (Using cURL)

### Test Registration:
```powershell
curl -Method POST `
  -Uri "http://localhost:5000/api/auth/register" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"name":"Test User","email":"test@example.com","password":"password123","role":"Technician","company":"Test Co"}'
```

### Test Login:
```powershell
curl -Method POST `
  -Uri "http://localhost:5000/api/auth/login" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"test@example.com","password":"password123"}'
```

### Test Protected Endpoint:
```powershell
# Replace YOUR_TOKEN with the token from login response
curl -Method GET `
  -Uri "http://localhost:5000/api/clients" `
  -Headers @{"Authorization"="Bearer YOUR_TOKEN"}
```

---

## 📱 Frontend Flow

```
User fills form → Submit button clicked
    ↓
handleSubmit() called
    ↓
e.preventDefault() - Stops page refresh
    ↓
Validation (frontend)
    ↓
Call login() or register() from AuthContext
    ↓
API request to backend
    ↓
Backend validates & processes
    ↓
Success: Returns token + user data
    ↓
Store token in localStorage
    ↓
Redirect to /dashboard
```

---

## 🎉 Try It Now!

1. Open http://localhost:3000/login
2. Click "create a new account"
3. Fill in all fields
4. Click "Create account"
5. You should be redirected to the dashboard!

If you see any errors, check the browser console (F12) for detailed error messages.

---

**Your login and registration should now work perfectly!** 🚀

