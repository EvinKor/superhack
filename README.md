# MSP Platform - AI-Driven Financial Growth & Service Efficiency

A comprehensive full-stack web application for Managed Service Providers (MSPs) and IT teams to improve financial growth and service efficiency through AI-driven insights and analytics.

## 🚀 Features

### Frontend (React.js + Tailwind CSS)
- **Modern Dashboard** with real-time KPIs and charts
- **Client Management** with comprehensive client profiles
- **Financial Insights** with AI-powered recommendations
- **Service Efficiency** monitoring and technician performance tracking
- **AI Reports** with predictive analytics and actionable insights
- **Responsive Design** optimized for desktop and tablet
- **Clean UI** inspired by Notion, Linear, and SuperOps

### Backend (Node.js + Express + MongoDB)
- **RESTful API** with comprehensive CRUD operations
- **JWT Authentication** with bcrypt password hashing
- **MongoDB Integration** with optimized schemas
- **Activity Logging** for audit trails
- **AI Insights Generation** (mocked for demo)
- **Rate Limiting** and security middleware

### Database Collections
- `users` - User credentials and roles
- `clients` - Client information and status
- `financialInsights` - Revenue, expenses, profit margins, AI suggestions
- `serviceEfficiency` - Technician productivity and performance metrics
- `aiReports` - AI-generated summaries and forecasts
- `activityLogs` - User actions and system events

## 🛠️ Tech Stack

### Frontend
- **React.js** 18.2.0
- **Tailwind CSS** 3.3.6
- **React Router** 6.20.1
- **Recharts** 2.8.0 (for charts)
- **Headless UI** 1.7.17 (for modals)
- **Heroicons** 2.0.18 (for icons)
- **Axios** 1.6.2 (for API calls)

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Helmet** for security
- **Express Rate Limit** for API protection
- **CORS** for cross-origin requests

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp env.example .env
   ```

4. **Configure environment variables:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/msp-platform
   JWT_SECRET=your-super-secret-jwt-key-here
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start the backend server:**
   ```bash
   npm run dev
   ```

6. **Seed the database (optional):**
   ```bash
   npm run seed
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 🔐 Demo Credentials

The seeded database includes the following demo accounts:

- **Admin:** admin@msp-platform.com / admin123
- **Manager:** manager@msp-platform.com / manager123
- **Technician:** tech1@msp-platform.com / tech123
- **Viewer:** viewer@msp-platform.com / viewer123

## 📊 Sample Data

The application comes pre-loaded with:
- 4 sample clients with different tiers and statuses
- Financial insights with AI recommendations
- Service efficiency metrics for technicians
- AI reports with actionable insights
- Activity logs for audit trails

## 🎨 Design System

### Color Palette
- **Primary:** #1E3A8A (Deep Blue)
- **Secondary:** #3B82F6 (Electric Blue)
- **Neutral:** #F3F4F6 (Soft Gray)
- **Success:** #10B981 (Green)
- **Warning:** #F59E0B (Yellow)
- **Error:** #EF4444 (Red)

### Typography
- **Font:** Inter (Google Fonts)
- **Weights:** 300, 400, 500, 600, 700

### Components
- Reusable UI components with Tailwind CSS
- Consistent spacing and shadows
- Responsive grid layouts
- Modern form controls and buttons

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `PUT /api/auth/profile` - Update profile

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients/:id` - Get client by ID
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client
- `GET /api/clients/stats/overview` - Client statistics

### Financial Insights
- `GET /api/financial-insights` - Get financial insights
- `GET /api/financial-insights/dashboard/summary` - Dashboard summary
- `POST /api/financial-insights` - Create insight
- `PUT /api/financial-insights/:id` - Update insight

### Service Efficiency
- `GET /api/service-efficiency` - Get efficiency data
- `GET /api/service-efficiency/dashboard/overview` - Dashboard overview
- `POST /api/service-efficiency` - Create efficiency record

### AI Reports
- `GET /api/ai-reports` - Get AI reports
- `GET /api/ai-reports/dashboard/insights` - Dashboard insights
- `POST /api/ai-reports/:id/feedback` - Add feedback
- `PUT /api/ai-reports/:id/recommendations/:recId` - Update recommendation

### Activity Logs
- `GET /api/activity-logs` - Get activity logs (Admin/Manager only)
- `GET /api/activity-logs/dashboard/summary` - Activity summary
- `GET /api/activity-logs/export` - Export logs

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB instance
2. Configure environment variables for production
3. Deploy to platforms like Heroku, Railway, or DigitalOcean
4. Set up SSL certificates and domain

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or AWS S3
3. Configure environment variables for API endpoints

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Helmet security headers
- Input validation and sanitization
- Activity logging for audit trails

## 📈 Performance Features

- Optimized MongoDB queries with indexes
- Responsive design for all screen sizes
- Efficient chart rendering with Recharts
- Lazy loading and code splitting
- Caching strategies for API calls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔮 Future Enhancements

- Real-time notifications with WebSockets
- Advanced AI integration with OpenAI/Claude
- Mobile app with React Native
- Advanced reporting and analytics
- Integration with popular MSP tools
- Multi-tenant architecture
- Advanced security features

---

**Built with ❤️ for the MSP community**