# 🐛 Debug Client Save Issue

## Step 1: Restart Backend with Logging

```powershell
# Stop backend (Ctrl+C)
# Then restart:
cd C:\Users\Craaazyyyy\Documents\www\superhack
npm run dev
```

## Step 2: Try to Save a Client

1. Open http://localhost:3000
2. Go to Clients page
3. Click "Add Client"
4. Fill in the form
5. Click "Save"

## Step 3: Check Server Logs

In the terminal where `npm run dev` is running, you'll see detailed logs like:

```
[INFO] Received client creation request: {
  "name": "...",
  "email": "...",
  "company": "...",
  ...
}

[INFO] Parsed fields - clientName: ..., contactPerson: ..., email: ..., phone: ...
```

**Look for:**
- What data is being received
- Which fields are missing
- Any error messages

## Step 4: Share the Logs

Copy the error message from the server logs and share it so I can see exactly what's wrong.

---

## Quick Fix If It's Still Not Working

The backend now accepts these field combinations:

**For client name:**
- `clientName` OR `company` OR `name`

**For contact person:**
- `contactPerson` OR `primaryContact.name` OR `name`

**For email:**
- `email` OR `primaryContact.email`

**For phone:**
- `phone` OR `primaryContact.phone` (defaults to '000-000-0000')

**Minimum required:**
- Company name (any of the above)
- Email address

---

## Alternative: Quick Test via API

Test the backend directly to see if it's working:

```powershell
$body = @{
    company = "Test Corp"
    email = "test@example.com"
    phone = "555-1234"
    industry = "Technology"
    primaryContact = @{
        name = "John Doe"
        email = "test@example.com"
        phone = "555-1234"
    }
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/clients" `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -Headers @{Authorization = "Bearer YOUR_TOKEN_HERE"}
```

If this works, the backend is fine and it's a frontend issue.
If this fails, check the error message for details.

---

**Next:** Restart backend and check the server logs when trying to save!

