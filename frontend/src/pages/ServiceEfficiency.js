import {
    ArrowDownIcon,
    ArrowTrendingDownIcon,
    ArrowTrendingUpIcon,
    ArrowUpIcon,
    CheckCircleIcon,
    ClockIcon,
    StarIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../services/api';

const ServiceEfficiency = () => {
  const [efficiencyData, setEfficiencyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const fetchEfficiencyData = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/service-efficiency/dashboard/overview?period=${selectedPeriod}`);
      setEfficiencyData(response.data);
    } catch (error) {
      console.error('Error fetching efficiency data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchEfficiencyData();
  }, [fetchEfficiencyData]);

  const MetricCard = ({ title, value, target, unit, icon: Icon, color = 'blue' }) => {
    const isAboveTarget = value >= target;
    const percentage = target > 0 ? ((value - target) / target) * 100 : 0;

    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      red: 'bg-red-50 text-red-600'
    };

    return (
      <div className="card p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}{unit}</p>
            <div className="flex items-center mt-1">
              <span className="text-sm text-gray-500">Target: {target}{unit}</span>
              <div className="ml-2 flex items-center">
                {isAboveTarget ? (
                  <ArrowUpIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ml-1 ${
                  isAboveTarget ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(percentage).toFixed(1)}%
                </span>
              </div>
            </div>
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

  const averages = efficiencyData?.teamAverages;
  const topPerformers = efficiencyData?.topPerformers || [];
  const needsImprovement = efficiencyData?.needsImprovement || [];

  // Sample data for charts
  const performanceData = [
    { metric: 'Response Time', current: averages?.responseTime || 15, target: 10, unit: 'min' },
    { metric: 'Resolution Time', current: averages?.resolutionTime || 4.2, target: 4, unit: 'hrs' },
    { metric: 'Satisfaction', current: averages?.satisfaction || 4.4, target: 4.5, unit: '/5' },
    { metric: 'First Call Resolution', current: averages?.firstCallResolution || 78, target: 85, unit: '%' }
  ];

  const technicianPerformance = [
    { name: 'Mike T.', tickets: 45, resolution: 4.2, satisfaction: 4.2, utilization: 85 },
    { name: 'Lisa E.', tickets: 38, resolution: 3.8, satisfaction: 4.6, utilization: 92 },
    { name: 'John S.', tickets: 42, resolution: 4.5, satisfaction: 4.1, utilization: 78 },
    { name: 'Sarah M.', tickets: 35, resolution: 3.9, satisfaction: 4.3, utilization: 88 }
  ];

  const categoryData = [
    { category: 'Network Issues', count: 15, avgTime: 3 },
    { category: 'Software Problems', count: 12, avgTime: 5 },
    { category: 'Hardware Failures', count: 8, avgTime: 6 },
    { category: 'Security Incidents', count: 5, avgTime: 4 },
    { category: 'Other', count: 5, avgTime: 7 }
  ];

  const radarData = [
    { metric: 'Response Time', A: 85, B: 100, fullMark: 100 },
    { metric: 'Resolution Time', A: 90, B: 100, fullMark: 100 },
    { metric: 'Satisfaction', A: 88, B: 100, fullMark: 100 },
    { metric: 'Utilization', A: 85, B: 100, fullMark: 100 },
    { metric: 'First Call Resolution', A: 78, B: 100, fullMark: 100 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Efficiency</h1>
          <p className="text-gray-600">Monitor technician performance and service delivery</p>
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
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Avg Response Time"
          value={averages?.responseTime || 0}
          target={10}
          unit=" min"
          icon={ClockIcon}
          color="yellow"
        />
        <MetricCard
          title="Avg Resolution Time"
          value={averages?.resolutionTime || 0}
          target={4}
          unit=" hrs"
          icon={CheckCircleIcon}
          color="blue"
        />
        <MetricCard
          title="Customer Satisfaction"
          value={averages?.satisfaction || 0}
          target={4.5}
          unit="/5"
          icon={StarIcon}
          color="green"
        />
        <MetricCard
          title="First Call Resolution"
          value={averages?.firstCallResolution || 0}
          target={85}
          unit="%"
          icon={ArrowTrendingUpIcon}
          color="green"
        />
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Tickets</span>
                <span className="font-semibold">{efficiencyData?.totalTickets || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Resolved Tickets</span>
                <span className="font-semibold">{efficiencyData?.resolvedTickets || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Resolution Rate</span>
                <span className="font-semibold text-green-600">
                  {efficiencyData?.resolutionRate ? `${efficiencyData.resolutionRate.toFixed(1)}%` : '0%'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Technicians</span>
                <span className="font-semibold">{efficiencyData?.totalTechnicians || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Radar</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar name="Current" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
              <Radar name="Target" dataKey="B" stroke="#10B981" fill="#10B981" fillOpacity={0.1} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technician Performance */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Technician Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={technicianPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="tickets" fill="#3B82F6" name="Tickets" />
              <Bar dataKey="satisfaction" fill="#10B981" name="Satisfaction" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ticket Categories */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8B5CF6" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
          <div className="space-y-4">
            {topPerformers.map((performer, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-medium text-sm">
                      {performer.technicianId?.firstName?.[0]}{performer.technicianId?.lastName?.[0]}
                    </span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {performer.technicianId?.firstName} {performer.technicianId?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{performer.technicianId?.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">
                    Satisfaction: {performer.metrics?.customerSatisfaction || 0}/5
                  </p>
                  <p className="text-sm text-gray-500">
                    Resolution: {performer.metrics?.averageResolutionTime || 0}h
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Needs Improvement */}
      {needsImprovement.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Needs Improvement</h3>
          <div className="space-y-4">
            {needsImprovement.map((technician, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 font-medium text-sm">
                      {technician.technicianId?.firstName?.[0]}{technician.technicianId?.lastName?.[0]}
                    </span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {technician.technicianId?.firstName} {technician.technicianId?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{technician.technicianId?.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-yellow-600">
                    Satisfaction: {technician.metrics?.customerSatisfaction || 0}/5
                  </p>
                  <p className="text-sm text-gray-500">
                    Resolution: {technician.metrics?.averageResolutionTime || 0}h
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics Table */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performanceData.map((metric, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {metric.metric}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {metric.current}{metric.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.target}{metric.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {metric.current >= metric.target ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                        Above Target
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
                        Below Target
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ServiceEfficiency;
