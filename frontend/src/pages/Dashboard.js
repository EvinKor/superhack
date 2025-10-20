import {
    ArrowDownIcon,
    ArrowTrendingDownIcon,
    ArrowTrendingUpIcon,
    ArrowUpIcon,
    ChartBarIcon,
    CpuChipIcon,
    CurrencyDollarIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../services/api';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    financial: null,
    clients: null,
    efficiency: null,
    aiReports: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch financial summary
      const financialResponse = await api.get('/financial-insights/dashboard/summary?period=monthly');
      
      // Fetch client stats
      const clientsResponse = await api.get('/clients/stats/overview');
      
      // Fetch service efficiency overview
      const efficiencyResponse = await api.get('/service-efficiency/dashboard/overview?period=monthly');
      
      // Fetch AI insights
      const aiResponse = await api.get('/ai-reports/dashboard/insights');
      
      setDashboardData({
        financial: financialResponse.data,
        clients: clientsResponse.data,
        efficiency: efficiencyResponse.data,
        aiReports: aiResponse.data
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, changeType, icon: Icon, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      purple: 'bg-purple-50 text-purple-600'
    };

    return (
      <div className="card p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {change && (
              <div className="flex items-center mt-1">
                {changeType === 'increase' ? (
                  <ArrowUpIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {change}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last month</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const financial = dashboardData.financial?.current;
  const clients = dashboardData.clients?.overview;
  const efficiency = dashboardData.efficiency;
  const aiReports = dashboardData.aiReports;

  // Sample chart data (replace with real data from API)
  const revenueData = [
    { month: 'Jan', revenue: 120000, expenses: 80000 },
    { month: 'Feb', revenue: 125000, expenses: 82000 },
    { month: 'Mar', revenue: 130000, expenses: 85000 },
    { month: 'Apr', revenue: 135000, expenses: 88000 },
    { month: 'May', revenue: 140000, expenses: 90000 },
    { month: 'Jun', revenue: 145000, expenses: 92000 }
  ];

  const clientTierData = [
    { name: 'Platinum', value: 1, color: '#8B5CF6' },
    { name: 'Gold', value: 1, color: '#F59E0B' },
    { name: 'Silver', value: 1, color: '#6B7280' },
    { name: 'Bronze', value: 1, color: '#CD7F32' }
  ];

  const efficiencyData = [
    { metric: 'Response Time', current: 15, target: 10, unit: 'min' },
    { metric: 'Resolution Time', current: 4.2, target: 4, unit: 'hrs' },
    { metric: 'Satisfaction', current: 4.4, target: 4.5, unit: '/5' },
    { metric: 'First Call Resolution', current: 78, target: 85, unit: '%' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your MSP platform performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Monthly Revenue"
          value={financial ? `$${(financial.revenue?.total || 0).toLocaleString()}` : '$0'}
          change={financial?.trends?.revenue ? `${financial.trends.revenue.toFixed(1)}%` : null}
          changeType={financial?.trends?.revenue > 0 ? 'increase' : 'decrease'}
          icon={CurrencyDollarIcon}
          color="green"
        />
        <StatCard
          title="Active Clients"
          value={clients?.active || 0}
          change={clients?.total ? `${((clients.active / clients.total) * 100).toFixed(1)}%` : null}
          changeType="increase"
          icon={UserGroupIcon}
          color="blue"
        />
        <StatCard
          title="Avg Response Time"
          value={efficiency?.teamAverages?.responseTime ? `${efficiency.teamAverages.responseTime} min` : 'N/A'}
          change={efficiency?.teamAverages?.responseTime < 15 ? '5%' : null}
          changeType={efficiency?.teamAverages?.responseTime < 15 ? 'increase' : 'decrease'}
          icon={ChartBarIcon}
          color="yellow"
        />
        <StatCard
          title="AI Insights"
          value={aiReports?.stats?.completed || 0}
          change={aiReports?.stats?.total ? `${((aiReports.stats.completed / aiReports.stats.total) * 100).toFixed(1)}%` : null}
          changeType="increase"
          icon={CpuChipIcon}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Client Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={clientTierData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {clientTierData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Service Efficiency Metrics */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Efficiency Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {efficiencyData.map((metric, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.metric}</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {metric.current}{metric.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Target: {metric.target}{metric.unit}</p>
                  <div className={`text-sm font-medium ${
                    metric.current >= metric.target ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.current >= metric.target ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 inline" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 inline" />
                    )}
                    {Math.abs(((metric.current - metric.target) / metric.target) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent AI Insights */}
      {aiReports?.recentReports && aiReports.recentReports.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent AI Insights</h3>
          <div className="space-y-4">
            {aiReports.recentReports.slice(0, 3).map((report, index) => (
              <div key={index} className="border-l-4 border-primary-500 bg-primary-50 p-4 rounded-r-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{report.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{report.summary}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    report.priority === 'critical' ? 'bg-red-100 text-red-800' :
                    report.priority === 'high' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {report.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
