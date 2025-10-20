# 🚀 MSP Platform - Quick Start Guide

## ✅ Backend is READY!

Your TypeScript backend is fully configured and running on **http://localhost:5000**

---

## 📊 Current Status

### Backend Server
- ✅ **Running**: Port 5000
- ✅ **MongoDB**: Connected to `aiopsDB`
- ✅ **Database**: Seeded with sample data
- ✅ **API Endpoints**: All operational
- ✅ **Authentication**: JWT configured

### Sample Data Loaded
- 👥 **4 Users**: Admin, IT Manager, 2 Technicians
- 🏢 **5 Clients**: Various industries
- 💰 **4 Financial Insights**: With AI recommendations
- ⚡ **4 Service Efficiency Records**: Performance metrics
- 🤖 **5 AI Reports**: Smart recommendations
- 📝 **10 Activity Logs**: Audit trail

---

## 🔗 API Endpoints Available

### Base URL: `http://localhost:5000/api`

#### Authentication Endpoints
```
POST   /api/auth/register        Register new user
POST   /api/auth/login           User login
GET    /api/auth/me              Get current user profile
PUT    /api/auth/me              Update user profile
PUT    /api/auth/change-password Change password
POST   /api/auth/logout          Logout
```

#### Users Endpoints
```
GET    /api/users                List all users (paginated)
GET    /api/users/:id            Get user by ID
POST   /api/users                Create user (Admin only)
PUT    /api/users/:id            Update user
DELETE /api/users/:id            Delete user (Admin only)
GET    /api/users/stats/overview User statistics
```

#### Clients Endpoints
```
GET    /api/clients              List all clients
GET    /api/clients/:id          Get client by ID
POST   /api/clients              Create client
PUT    /api/clients/:id          Update client
DELETE /api/clients/:id          Delete client
GET    /api/clients/stats/overview Client statistics
GET    /api/clients/industry/:industry Get clients by industry
```

#### Financial Insights Endpoints
```
GET    /api/financial-insights   List all insights
GET    /api/financial-insights/:id Get insight by ID
POST   /api/financial-insights   Create insight
PUT    /api/financial-insights/:id Update insight
DELETE /api/financial-insights/:id Delete insight
GET    /api/financial-insights/analytics/profit-trends Profit trends
GET    /api/financial-insights/stats/overview Financial stats
GET    /api/financial-insights/analytics/monthly-summary Monthly summary
```

#### Service Efficiency Endpoints
```
GET    /api/service-efficiency   List all records
GET    /api/service-efficiency/:id Get record by ID
POST   /api/service-efficiency   Create record
PUT    /api/service-efficiency/:id Update record
DELETE /api/service-efficiency/:id Delete record
GET    /api/service-efficiency/analytics/technician-performance Technician metrics
GET    /api/service-efficiency/analytics/weekly-trends Weekly trends
GET    /api/service-efficiency/stats/overview Efficiency stats
```

#### AI Reports Endpoints
```
GET    /api/ai-reports           List all reports
GET    /api/ai-reports/:id       Get report by ID
POST   /api/ai-reports           Create report
PUT    /api/ai-reports/:id       Update report
DELETE /api/ai-reports/:id       Delete report
GET    /api/ai-reports/target/:type/:id Reports by target
GET    /api/ai-reports/analytics/overview Report analytics
GET    /api/ai-reports/analytics/recommendations High-confidence recommendations
```

#### Activity Logs Endpoints
```
GET    /api/activity-logs        List all logs
GET    /api/activity-logs/:id    Get log by ID
POST   /api/activity-logs        Create log
PUT    /api/activity-logs/:id    Update log
DELETE /api/activity-logs/:id    Delete log
GET    /api/activity-logs/feed/recent Recent activity feed
GET    /api/activity-logs/analytics/user-activity/:userId User activity
GET    /api/activity-logs/stats/overview Activity statistics
GET    /api/activity-logs/analytics/trends Activity trends
```

---

## 🎯 React.js Integration Guide

### Step 1: Install Axios in Your React App

```bash
npm install axios
```

### Step 2: Create API Service File

Create `src/services/api.js`:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Step 3: Example React Components

#### Login Component

```javascript
import { useState } from 'react';
import api from './services/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.details || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {error && <p style={{color: 'red'}}>{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
}

export default Login;
```

#### Register Component

```javascript
import { useState } from 'react';
import api from './services/api';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Technician',
    company: ''
  });
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/register', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.details || 'Registration failed');
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <input 
        type="text" 
        value={formData.name} 
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        placeholder="Full Name"
      />
      <input 
        type="email" 
        value={formData.email} 
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        placeholder="Email"
      />
      <input 
        type="password" 
        value={formData.password} 
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        placeholder="Password"
      />
      <select 
        value={formData.role}
        onChange={(e) => setFormData({...formData, role: e.target.value})}
      >
        <option value="Technician">Technician</option>
        <option value="IT_Manager">IT Manager</option>
        <option value="Admin">Admin</option>
      </select>
      <input 
        type="text" 
        value={formData.company} 
        onChange={(e) => setFormData({...formData, company: e.target.value})}
        placeholder="Company"
      />
      {error && <p style={{color: 'red'}}>{error}</p>}
      <button type="submit">Register</button>
    </form>
  );
}

export default Register;
```

#### Clients List Component

```javascript
import { useState, useEffect } from 'react';
import api from './services/api';

function ClientsList() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/clients?page=${page}&limit=10`);
        setClients(response.data.clients);
        setTotalPages(response.data.pagination.totalPages);
      } catch (err) {
        setError(err.response?.data?.details || 'Failed to fetch clients');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [page]);

  if (loading) return <div>Loading clients...</div>;
  if (error) return <div style={{color: 'red'}}>{error}</div>;

  return (
    <div>
      <h2>Clients</h2>
      <div>
        {clients.map(client => (
          <div key={client._id} style={{border: '1px solid #ccc', padding: '10px', margin: '10px 0'}}>
            <h3>{client.clientName}</h3>
            <p><strong>Industry:</strong> {client.industry}</p>
            <p><strong>Contact:</strong> {client.contactPerson} ({client.email})</p>
            <p><strong>Status:</strong> {client.status}</p>
          </div>
        ))}
      </div>
      <div>
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span> Page {page} of {totalPages} </span>
        <button 
          onClick={() => setPage(p => p + 1)}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default ClientsList;
```

#### Dashboard Component

```javascript
import { useState, useEffect } from 'react';
import api from './services/api';

function Dashboard() {
  const [stats, setStats] = useState({
    clients: 0,
    users: 0,
    insights: 0,
    reports: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [clientsRes, usersRes, insightsRes, reportsRes] = await Promise.all([
          api.get('/clients/stats/overview'),
          api.get('/users/stats/overview'),
          api.get('/financial-insights/stats/overview'),
          api.get('/ai-reports/analytics/overview')
        ]);

        setStats({
          clients: clientsRes.data.totalClients,
          users: usersRes.data.totalUsers,
          insights: insightsRes.data.totalInsights,
          reports: reportsRes.data.totalReports
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h1>MSP Platform Dashboard</h1>
      <div style={{display: 'flex', gap: '20px'}}>
        <div style={{border: '1px solid #ccc', padding: '20px', borderRadius: '8px'}}>
          <h3>Total Clients</h3>
          <p style={{fontSize: '32px', fontWeight: 'bold'}}>{stats.clients}</p>
        </div>
        <div style={{border: '1px solid #ccc', padding: '20px', borderRadius: '8px'}}>
          <h3>Total Users</h3>
          <p style={{fontSize: '32px', fontWeight: 'bold'}}>{stats.users}</p>
        </div>
        <div style={{border: '1px solid #ccc', padding: '20px', borderRadius: '8px'}}>
          <h3>Financial Insights</h3>
          <p style={{fontSize: '32px', fontWeight: 'bold'}}>{stats.insights}</p>
        </div>
        <div style={{border: '1px solid #ccc', padding: '20px', borderRadius: '8px'}}>
          <h3>AI Reports</h3>
          <p style={{fontSize: '32px', fontWeight: 'bold'}}>{stats.reports}</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
```

---

## 🧪 Testing the API

### Using cURL (PowerShell)

```powershell
# Register a new user
curl -Method POST -Uri "http://localhost:5000/api/auth/register" -Headers @{"Content-Type"="application/json"} -Body '{"name":"Test User","email":"test@example.com","password":"password123","role":"Technician","company":"Test Company"}'

# Login
curl -Method POST -Uri "http://localhost:5000/api/auth/login" -Headers @{"Content-Type"="application/json"} -Body '{"email":"test@example.com","password":"password123"}'

# Get clients (replace TOKEN with your JWT token)
curl -Method GET -Uri "http://localhost:5000/api/clients" -Headers @{"Authorization"="Bearer YOUR_TOKEN_HERE"}
```

---

## 📁 Project Structure

```
superhack/
├── server/                    ← Backend (TypeScript)
│   ├── src/
│   │   ├── models/           ← Mongoose models
│   │   ├── routes/           ← API endpoints
│   │   ├── middleware/       ← Auth, validation, errors
│   │   ├── utils/            ← DB connection, logger
│   │   └── server.ts         ← Main server file
│   ├── scripts/
│   │   ├── data/             ← Seed JSON files
│   │   └── seed.ts           ← Database seeding
│   ├── .env                  ← Environment variables
│   └── package.json
│
└── frontend/                  ← React.js (your frontend)
    ├── src/
    │   ├── services/
    │   │   └── api.js        ← API client (create this!)
    │   ├── components/       ← React components
    │   └── App.js
    └── package.json
```

---

## 🎯 Next Steps

1. ✅ **Backend**: Running on port 5000
2. 📱 **Create** `src/services/api.js` in your React app
3. 🔐 **Build** Login/Register components
4. 📊 **Fetch** data from API endpoints
5. 🎨 **Design** beautiful UI with your existing React setup

---

## 💡 Tips

- All API routes (except register/login) require JWT authentication
- Store JWT token in `localStorage` after login
- Include token in Authorization header: `Bearer YOUR_TOKEN`
- Use React hooks (useState, useEffect) to manage API data
- Handle loading states and errors in your components

---

## 🐛 Troubleshooting

**Backend not starting?**
```bash
cd server
npm run dev
```

**Database not connecting?**
Check `.env` file in server folder has correct `MONGODB_URI`

**Port 5000 already in use?**
```powershell
Get-Process -Name node | Stop-Process -Force
```

---

**🎉 Your backend is ready! Start building your React frontend now!**

