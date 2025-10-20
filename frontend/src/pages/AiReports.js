import { Dialog, Transition } from '@headlessui/react';
import {
    ArrowDownIcon,
    ArrowUpIcon,
    EyeIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    StarIcon
} from '@heroicons/react/24/outline';
import React, { Fragment, useEffect, useState } from 'react';
import api from '../services/api';

const AiReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ai-reports');
      setReports(response.data.reports);
    } catch (error) {
      console.error('Error fetching AI reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleFeedback = async (reportId, rating, comment) => {
    try {
      await api.post(`/ai-reports/${reportId}/feedback`, { rating, comment });
      fetchReports();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleRecommendationUpdate = async (reportId, recId, status) => {
    try {
      await api.put(`/ai-reports/${reportId}/recommendations/${recId}`, { status });
      fetchReports();
    } catch (error) {
      console.error('Error updating recommendation:', error);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || report.type === typeFilter;
    const matchesPriority = !priorityFilter || report.priority === priorityFilter;
    
    return matchesSearch && matchesType && matchesPriority;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-yellow-100 text-yellow-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'financial_analysis': return '💰';
      case 'performance_review': return '📊';
      case 'predictive_insights': return '🔮';
      case 'recommendations': return '💡';
      case 'risk_assessment': return '⚠️';
      default: return '📄';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Reports</h1>
          <p className="text-gray-600">AI-generated insights and recommendations</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Types</option>
            <option value="financial_analysis">Financial Analysis</option>
            <option value="performance_review">Performance Review</option>
            <option value="predictive_insights">Predictive Insights</option>
            <option value="recommendations">Recommendations</option>
            <option value="risk_assessment">Risk Assessment</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button className="btn-outline flex items-center justify-center">
            <FunnelIcon className="h-5 w-5 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => (
          <div key={report._id} className="card p-6 hover:shadow-medium transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{getTypeIcon(report.type)}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {report.title}
                  </h3>
                  <p className="text-sm text-gray-500 capitalize">
                    {report.type.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(report.priority)}`}>
                  {report.priority}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                  {report.status}
                </span>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {report.summary}
            </p>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>{new Date(report.generatedAt).toLocaleDateString()}</span>
              <div className="flex items-center">
                <EyeIcon className="h-4 w-4 mr-1" />
                {report.views || 0}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => handleViewReport(report)}
                className="btn-primary text-sm"
              >
                View Report
              </button>
              <div className="flex items-center">
                {report.feedback && report.feedback.length > 0 && (
                  <div className="flex items-center mr-2">
                    <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="text-sm">
                      {(report.feedback.reduce((sum, f) => sum + f.rating, 0) / report.feedback.length).toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Report Detail Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  {selectedReport && (
                    <>
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        {selectedReport.title}
                      </Dialog.Title>
                      
                      <div className="mt-4 space-y-6">
                        {/* Report Info */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Type: {selectedReport.type.replace('_', ' ')}</span>
                          <span>Priority: {selectedReport.priority}</span>
                          <span>Status: {selectedReport.status}</span>
                          <span>Generated: {new Date(selectedReport.generatedAt).toLocaleDateString()}</span>
                        </div>

                        {/* Summary */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                          <p className="text-gray-600">{selectedReport.summary}</p>
                        </div>

                        {/* Key Findings */}
                        {selectedReport.keyFindings && selectedReport.keyFindings.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Key Findings</h4>
                            <div className="space-y-2">
                              {selectedReport.keyFindings.map((finding, index) => (
                                <div key={index} className="flex items-start">
                                  <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                                    finding.impact === 'positive' ? 'bg-green-500' :
                                    finding.impact === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                                  }`} />
                                  <div>
                                    <p className="text-gray-900">{finding.finding}</p>
                                    <p className="text-sm text-gray-500">
                                      Confidence: {finding.confidence}%
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommendations */}
                        {selectedReport.recommendations && selectedReport.recommendations.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                            <div className="space-y-3">
                              {selectedReport.recommendations.map((rec, index) => (
                                <div key={index} className="border rounded-lg p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h5 className="font-medium text-gray-900">{rec.title}</h5>
                                      <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                                      <div className="flex items-center mt-2 space-x-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                          rec.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                          rec.priority === 'high' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-green-100 text-green-800'
                                        }`}>
                                          {rec.priority} priority
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          Impact: {rec.estimatedImpact}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          Effort: {rec.effort}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          Timeline: {rec.timeline}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="ml-4">
                                      <select
                                        value={rec.status}
                                        onChange={(e) => handleRecommendationUpdate(selectedReport._id, rec._id, e.target.value)}
                                        className="text-xs border rounded px-2 py-1"
                                      >
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="rejected">Rejected</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Metrics */}
                        {selectedReport.data?.metrics && selectedReport.data.metrics.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Key Metrics</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {selectedReport.data.metrics.map((metric, index) => (
                                <div key={index} className="bg-gray-50 rounded-lg p-3">
                                  <p className="text-sm font-medium text-gray-900">{metric.name}</p>
                                  <p className="text-lg font-semibold text-gray-900">
                                    {metric.value}{metric.unit}
                                  </p>
                                  <div className="flex items-center mt-1">
                                    {metric.trend === 'up' ? (
                                      <ArrowUpIcon className="h-4 w-4 text-green-500" />
                                    ) : metric.trend === 'down' ? (
                                      <ArrowDownIcon className="h-4 w-4 text-red-500" />
                                    ) : (
                                      <div className="h-4 w-4 bg-gray-400 rounded-full" />
                                    )}
                                    <span className="text-xs text-gray-500 ml-1 capitalize">
                                      {metric.trend}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Feedback */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Rate this Report</h4>
                          <div className="flex items-center space-x-2">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                onClick={() => handleFeedback(selectedReport._id, rating, '')}
                                className="text-yellow-400 hover:text-yellow-500"
                              >
                                <StarIcon className="h-6 w-6" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button
                          onClick={() => setIsModalOpen(false)}
                          className="btn-secondary"
                        >
                          Close
                        </button>
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default AiReports;
