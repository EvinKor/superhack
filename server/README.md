# MSP Platform Backend API

A comprehensive TypeScript backend API for AI-driven MSP (Managed Service Provider) platforms, built with Express.js, MongoDB, and JWT authentication.

## 🚀 Features

- **Complete CRUD Operations** for all collections
- **JWT Authentication** with role-based authorization
- **Advanced Filtering & Pagination** for all endpoints
- **Comprehensive Analytics** and reporting
- **TypeScript** for type safety and better development experience
- **MongoDB** with Mongoose ODM
- **Input Validation** using express-validator
- **Error Handling** with detailed error responses
- **Rate Limiting** and security middleware
- **Seed Data Script** for development and testing

## 📊 Database Overview

### Database: `aiopsDB`

The platform uses MongoDB with 6 main collections:

#### 1. **Users** (`users`)
- **Purpose**: System users (Admin, IT_Manager, Technician)
- **Key Fields**: name, email, role, company, passwordHash, lastLogin
- **Indexes**: email (unique), role
- **Relationships**: Referenced by activityLogs.userId, serviceEfficiency.technicianId

#### 2. **Clients** (`clients`)
- **Purpose**: MSP client organizations
- **Key Fields**: clientName, industry, contactPerson, email, phone, status
- **Indexes**: clientName, status
- **Relationships**: Referenced by financialInsights.clientId, serviceEfficiency.clientId, aiReports.generatedForId

#### 3. **Financial Insights** (`financialInsights`)
- **Purpose**: Monthly financial data and AI recommendations
- **Key Fields**: clientId, month, revenue, expenses, profitMargin, spendBreakdown, aiRecommendations
- **Indexes**: clientId, month, clientId+month (unique)
- **Relationships**: clientId → clients._id

#### 4. **Service Efficiency** (`serviceEfficiency`)
- **Purpose**: Weekly technician performance metrics
- **Key Fields**: technicianId, clientId, tasksCompleted, avgResponseTime, avgResolutionTime, aiSuggestions
- **Indexes**: technicianId, week, clientId, technicianId+week, clientId+week
- **Relationships**: technicianId → users._id, clientId → clients._id

#### 5. **AI Reports** (`aiReports`)
- **Purpose**: AI-generated reports and recommendations
- **Key Fields**: reportType, generatedForId, generatedForType, summary, recommendations, confidenceScore
- **Indexes**: reportType, createdAt, generatedForId+generatedForType, reportType+createdAt
- **Relationships**: Polymorphic - generatedForId can reference clients._id OR users._id

#### 6. **Activity Logs** (`activityLogs`)
- **Purpose**: System activity tracking and audit trail
- **Key Fields**: userId, action, details, timestamp, ipAddress
- **Indexes**: userId, timestamp, userId+timestamp, action+timestamp
- **Relationships**: userId → users._id

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Atlas or local instance)
- npm or yarn

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Environment Configuration
Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Update `.env` with your configuration:
```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://superhack:superhack%401209@cluster0.gdlgoft.mongodb.net/aiopsDB?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Setup

#### Option A: Using Seed Script (Recommended for Development)
```bash
# Run the seed script to populate the database
npm run seed
```

#### Option B: Manual MongoDB Atlas Import
1. Navigate to your MongoDB Atlas cluster
2. Go to the Collections tab
3. Create a new database named `aiopsDB`
4. Import the JSON files from `scripts/data/` into their respective collections:
   - `users.json` → `users` collection
   - `clients.json` → `clients` collection
   - `financialInsights.json` → `financialInsights` collection
   - `serviceEfficiency.json` → `serviceEfficiency` collection
   - `aiReports.json` → `aiReports` collection
   - `activityLogs.json` → `activityLogs` collection

#### Option C: Using mongoimport (Command Line)
```bash
# Import each collection
mongoimport --uri="your-mongodb-uri" --db=aiopsDB --collection=users --file=scripts/data/users.json --jsonArray
mongoimport --uri="your-mongodb-uri" --db=aiopsDB --collection=clients --file=scripts/data/clients.json --jsonArray
mongoimport --uri="your-mongodb-uri" --db=aiopsDB --collection=financialInsights --file=scripts/data/financialInsights.json --jsonArray
mongoimport --uri="your-mongodb-uri" --db=aiopsDB --collection=serviceEfficiency --file=scripts/data/serviceEfficiency.json --jsonArray
mongoimport --uri="your-mongodb-uri" --db=aiopsDB --collection=aiReports --file=scripts/data/aiReports.json --jsonArray
mongoimport --uri="your-mongodb-uri" --db=aiopsDB --collection=activityLogs --file=scripts/data/activityLogs.json --jsonArray
```

### 4. Start the Server

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm run build
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints Overview

#### 🔐 Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /me` - Get current user profile
- `PUT /me` - Update user profile
- `PUT /change-password` - Change password
- `POST /logout` - Logout (client-side token removal)

#### 👥 Users (`/api/users`)
- `GET /` - Get all users (Admin/IT_Manager only)
- `GET /:id` - Get user by ID
- `POST /` - Create user (Admin only)
- `PUT /:id` - Update user
- `DELETE /:id` - Delete user (Admin only)
- `GET /stats/overview` - Get user statistics (Admin only)

#### 🏢 Clients (`/api/clients`)
- `GET /` - Get all clients
- `GET /:id` - Get client by ID
- `POST /` - Create client
- `PUT /:id` - Update client
- `DELETE /:id` - Delete client
- `GET /stats/overview` - Get client statistics
- `GET /industry/:industry` - Get clients by industry

#### 💰 Financial Insights (`/api/financial-insights`)
- `GET /` - Get all financial insights
- `GET /:id` - Get financial insight by ID
- `POST /` - Create financial insight
- `PUT /:id` - Update financial insight
- `DELETE /:id` - Delete financial insight
- `GET /analytics/profit-trends` - Get profit margin trends
- `GET /stats/overview` - Get financial overview statistics
- `GET /analytics/monthly-summary` - Get monthly financial summary

#### ⚡ Service Efficiency (`/api/service-efficiency`)
- `GET /` - Get all service efficiency records
- `GET /:id` - Get service efficiency record by ID
- `POST /` - Create service efficiency record
- `PUT /:id` - Update service efficiency record
- `DELETE /:id` - Delete service efficiency record
- `GET /analytics/technician-performance` - Get technician performance analytics
- `GET /analytics/weekly-trends` - Get weekly performance trends
- `GET /stats/overview` - Get service efficiency overview statistics
- `GET /analytics/client-efficiency/:clientId` - Get client-specific efficiency metrics

#### 🤖 AI Reports (`/api/ai-reports`)
- `GET /` - Get all AI reports
- `GET /:id` - Get AI report by ID
- `POST /` - Create AI report
- `PUT /:id` - Update AI report
- `DELETE /:id` - Delete AI report
- `GET /target/:type/:id` - Get AI reports by target (client or user)
- `GET /analytics/overview` - Get AI reports analytics
- `GET /analytics/recommendations` - Get high-confidence recommendations

#### 📊 Activity Logs (`/api/activity-logs`)
- `GET /` - Get all activity logs
- `GET /:id` - Get activity log by ID
- `POST /` - Create activity log
- `PUT /:id` - Update activity log
- `DELETE /:id` - Delete activity log
- `GET /feed/recent` - Get recent activity feed
- `GET /analytics/user-activity/:userId` - Get user activity summary
- `GET /stats/overview` - Get activity statistics
- `GET /analytics/trends` - Get activity trends

### Query Parameters

#### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sortBy` - Field to sort by
- `sortOrder` - Sort order (asc/desc)

#### Filtering Examples
- `GET /api/clients?status=active&industry=Healthcare`
- `GET /api/financial-insights?clientId=507f1f77bcf86cd799439021&month=2024-01`
- `GET /api/service-efficiency?technicianId=507f1f77bcf86cd799439013&week=2024-W04`
- `GET /api/ai-reports?reportType=Financial Forecast&generatedForType=client`

## 🔒 Authorization

### Roles
- **Admin**: Full access to all operations
- **IT_Manager**: Access to most operations, cannot change user roles
- **Technician**: Limited access to assigned tasks and reports

### Protected Routes
- All routes except `/api/auth/register` and `/api/auth/login` require authentication
- Role-based restrictions apply to user management and administrative functions

## 📈 Sample Data

The seed script includes sample data for:
- **4 Users** (1 Admin, 1 IT_Manager, 2 Technicians)
- **5 Clients** across different industries
- **4 Financial Insights** with AI recommendations
- **4 Service Efficiency** records
- **5 AI Reports** with high-confidence recommendations
- **10 Activity Logs** showing system usage

### Demo Credentials
```
Admin: admin@msp-platform.com
IT Manager: sarah.manager@msp-platform.com
Technician: mike.tech@msp-platform.com
Technician: lisa.support@msp-platform.com
Password: (use the register endpoint or check seed data)
```

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start           # Start production server
npm run seed        # Run database seed script
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint errors
npm run format      # Format code with Prettier
```

### Project Structure
```
server/
├── src/
│   ├── models/           # Mongoose models
│   ├── routes/           # Express route handlers
│   ├── middleware/       # Authentication, validation, error handling
│   ├── utils/           # Database connection, logging
│   └── server.ts         # Main server file
├── scripts/
│   ├── data/            # Seed data JSON files
│   └── seed.ts          # Database seeding script
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
PORT=5000
CORS_ORIGIN=https://your-frontend-domain.com
```

### Build and Deploy
```bash
npm run build
npm start
```

## 📝 API Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... },
  "pagination": { ... } // For paginated responses
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "path": "/api/endpoint",
  "method": "GET"
}
```

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Verify MONGODB_URI is correct
   - Check network connectivity
   - Ensure MongoDB Atlas IP whitelist includes your IP

2. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure Authorization header format: `Bearer <token>`

3. **Validation Errors**
   - Check request body format
   - Verify required fields are provided
   - Ensure data types match schema requirements

4. **Permission Denied**
   - Verify user role has required permissions
   - Check if user is authenticated
   - Ensure resource ownership (where applicable)

## 📞 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the API documentation
3. Check server logs for detailed error information
4. Verify environment configuration

## 📄 License

MIT License - see LICENSE file for details.
