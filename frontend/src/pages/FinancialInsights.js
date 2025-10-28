import {
  ArrowDownIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ArrowUpIcon,
  CurrencyDollarIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../services/api';

const FinancialInsights = () => {
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const fetchFinancialData = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/financial-insights/dashboard/summary?period=${selectedPeriod}`);
      setFinancialData(response.data);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  const MetricCard = ({ title, value, change, changeType, icon: Icon, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      red: 'bg-red-50 text-red-600',
      yellow: 'bg-yellow-50 text-yellow-600'
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
                <span className="text-sm text-gray-500 ml-1">vs previous {selectedPeriod}</span>
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

  const current = financialData?.current;
  const trends = financialData?.trends;

  // Sample data for charts (replace with real data from API)
  const revenueData = [
    { month: 'Jan', revenue: 120000, expenses: 80000, profit: 40000 },
    { month: 'Feb', revenue: 125000, expenses: 82000, profit: 43000 },
    { month: 'Mar', revenue: 130000, expenses: 85000, profit: 45000 },
    { month: 'Apr', revenue: 135000, expenses: 88000, profit: 47000 },
    { month: 'May', revenue: 140000, expenses: 90000, profit: 50000 },
    { month: 'Jun', revenue: 145000, expenses: 92000, profit: 53000 }
  ];

  const expenseBreakdown = [
    { name: 'Labor', value: 45000, color: '#3B82F6' },
    { name: 'Infrastructure', value: 15000, color: '#10B981' },
    { name: 'Software', value: 10000, color: '#F59E0B' },
    { name: 'Marketing', value: 5000, color: '#EF4444' },
    { name: 'Other', value: 5000, color: '#8B5CF6' }
  ];

  const clientRevenue = [
    { client: 'TechCorp', revenue: 50000, percentage: 40 },
    { client: 'HealthPlus', revenue: 40000, percentage: 32 },
    { client: 'FinanceFirst', revenue: 35000, percentage: 28 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Insights</h1>
          <p className="text-gray-600">Analyze your financial performance and trends</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input-field"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={current ? `$${(current.revenue?.total || 0).toLocaleString()}` : '$0'}
          change={trends?.revenue ? `${trends.revenue.toFixed(1)}%` : null}
          changeType={trends?.revenue > 0 ? 'increase' : 'decrease'}
          icon={CurrencyDollarIcon}
          color="green"
        />
        <MetricCard
          title="Total Expenses"
          value={current ? `$${(current.expenses?.total || 0).toLocaleString()}` : '$0'}
          change={trends?.expenses ? `${trends.expenses.toFixed(1)}%` : null}
          changeType={trends?.expenses > 0 ? 'increase' : 'decrease'}
          icon={ArrowTrendingDownIcon}
          color="red"
        />
        <MetricCard
          title="Net Profit"
          value={current ? `$${(current.netProfit || 0).toLocaleString()}` : '$0'}
          change={trends?.profit ? `${trends.profit.toFixed(1)}%` : null}
          changeType={trends?.profit > 0 ? 'increase' : 'decrease'}
          icon={ArrowTrendingUpIcon}
          color="green"
        />
        <MetricCard
          title="Profit Margin"
          value={current ? `${current.profitMargin || 0}%` : '0%'}
          change={trends?.profit ? `${trends.profit.toFixed(1)}%` : null}
          changeType={trends?.profit > 0 ? 'increase' : 'decrease'}
          icon={CurrencyDollarIcon}
          color="blue"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Trend */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
              <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
              <Area type="monotone" dataKey="expenses" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {expenseBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue by Client */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Client</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={clientRevenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="client" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
            <Bar dataKey="revenue" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* AI Suggestions */}
      {current?.aiSuggestions && current.aiSuggestions.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <LightBulbIcon className="h-6 w-6 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
          </div>
          <div className="space-y-4">
            {current.aiSuggestions.map((suggestion, index) => (
              <div key={index} className="border-l-4 border-primary-500 bg-primary-50 p-4 rounded-r-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        suggestion.potentialImpact === 'high' ? 'bg-red-100 text-red-800' :
                        suggestion.potentialImpact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {suggestion.potentialImpact} impact
                      </span>
                      <span className="text-xs text-gray-500">
                        Confidence: {suggestion.confidence}%
                      </span>
                      {suggestion.estimatedSavings && (
                        <span className="text-xs text-green-600 font-medium">
                          Potential savings: ${suggestion.estimatedSavings.toLocaleString()}
                        </span>
                      )}
                      {suggestion.estimatedRevenue && (
                        <span className="text-xs text-blue-600 font-medium">
                          Potential revenue: ${suggestion.estimatedRevenue.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    suggestion.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    suggestion.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    suggestion.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {suggestion.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forecasts */}
      {current?.forecasts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Month Forecast</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Revenue</span>
                <span className="font-medium">${current.forecasts.nextMonth?.revenue?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expenses</span>
                <span className="font-medium">${current.forecasts.nextMonth?.expenses?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-gray-900 font-medium">Net Profit</span>
                <span className="font-bold text-green-600">${current.forecasts.nextMonth?.profit?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Quarter Forecast</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Revenue</span>
                <span className="font-medium">${current.forecasts.nextQuarter?.revenue?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expenses</span>
                <span className="font-medium">${current.forecasts.nextQuarter?.expenses?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-gray-900 font-medium">Net Profit</span>
                <span className="font-bold text-green-600">${current.forecasts.nextQuarter?.profit?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialInsights;
