// pages/dashboard.js - Enterprise monitoring dashboard for DAM Butler MCP
// Real-time analytics and system health monitoring

import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function MonitoringDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [timeframe, selectedMetric]);

  const loadDashboardData = async () => {
    try {
      const [analyticsRes, healthRes] = await Promise.all([
        fetch(`/api/analytics?timeframe=${timeframe}&metric=${selectedMetric}`),
        fetch('/api/health')
      ]);

      const analyticsData = await analyticsRes.json();
      const healthData = await healthRes.json();

      setAnalytics(analyticsData);
      setHealthStatus(healthData);
      setLoading(false);
    } catch (error) {
      console.error('Dashboard load error:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading DAM Butler Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>DAM Butler MCP - Monitoring Dashboard</title>
        <meta name="description" content="Enterprise monitoring dashboard for DAM Butler MCP" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">DAM Butler MCP</h1>
                <p className="text-sm text-gray-600">Enterprise Asset Discovery Platform</p>
              </div>
              <div className="flex items-center space-x-4">
                <HealthIndicator status={healthStatus} />
                <TimeframeSelector value={timeframe} onChange={setTimeframe} />
              </div>
            </div>
          </div>
        </header>

        {/* Main Dashboard */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Total Requests"
              value={analytics?.overview?.total_requests?.toLocaleString() || '0'}
              change="+12%"
              positive={true}
              icon="📊"
            />
            <MetricCard
              title="Success Rate"
              value={`${Math.round((analytics?.overview?.success_rate || 0) * 100)}%`}
              change="+2.3%"
              positive={true}
              icon="✅"
            />
            <MetricCard
              title="Avg Response Time"
              value={`${analytics?.overview?.avg_response_time_ms || 0}ms`}
              change="-15ms"
              positive={true}
              icon="⚡"
            />
            <MetricCard
              title="OpenAI Integration"
              value="95.3%"
              change="+1.2%"
              positive={true}
              icon="🧠"
            />
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'intent_parsing', label: 'AI Intelligence', icon: '🧠' },
                { id: 'regional_performance', label: 'Regional Performance', icon: '🌍' },
                { id: 'asset_categories', label: 'Asset Analytics', icon: '📁' },
                { id: 'error_tracking', label: 'Error Tracking', icon: '🚨' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedMetric(tab.id)}
                  className={`flex items-center px-3 py-2 font-medium text-sm rounded-md ${
                    selectedMetric === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Dynamic Content Based on Selected Metric */}
          <div className="space-y-6">
            {selectedMetric === 'overview' && (
              <OverviewDashboard analytics={analytics} />
            )}
            {selectedMetric === 'intent_parsing' && (
              <IntentParsingDashboard analytics={analytics} />
            )}
            {selectedMetric === 'regional_performance' && (
              <RegionalDashboard analytics={analytics} />
            )}
            {selectedMetric === 'asset_categories' && (
              <AssetDashboard analytics={analytics} />
            )}
            {selectedMetric === 'error_tracking' && (
              <ErrorTrackingDashboard analytics={analytics} />
            )}
          </div>
        </main>
      </div>
    </>
  );
}

// Component: Health Indicator
function HealthIndicator({ status }) {
  if (!status) return null;

  const isHealthy = status.status === 'healthy';
  const statusColor = isHealthy ? 'green' : 'red';
  const statusIcon = isHealthy ? '🟢' : '🔴';

  return (
    <div className="flex items-center space-x-2">
      <span>{statusIcon}</span>
      <span className={`text-sm font-medium text-${statusColor}-600`}>
        {status.status?.toUpperCase()}
      </span>
      {status.openai_status && (
        <span className="text-xs text-gray-500">
          | OpenAI: {status.openai_status}
        </span>
      )}
    </div>
  );
}

// Component: Timeframe Selector
function TimeframeSelector({ value, onChange }) {
  const options = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24h' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' }
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

// Component: Metric Card
function MetricCard({ title, value, change, positive, icon }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
      {change && (
        <div className="mt-2">
          <span className={`text-sm font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
            {change}
          </span>
          <span className="text-sm text-gray-500 ml-1">vs last period</span>
        </div>
      )}
    </div>
  );
}

// Component: Overview Dashboard
function OverviewDashboard({ analytics }) {
  const data = analytics?.overview;
  if (!data) return <div>Loading overview...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Products */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Products</h3>
        <div className="space-y-3">
          {data.top_products?.map((product, index) => (
            <div key={product.model} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.model}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-blue-600">
                {product.requests.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Regional Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🌍 Regional Distribution</h3>
        <div className="space-y-3">
          {Object.entries(data.regional_breakdown || {}).map(([region, info]) => (
            <div key={region} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{region}</p>
                  <p className="text-xs text-gray-500">{info.brand} branding</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {info.requests.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Use Cases */}
      <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Popular Use Cases</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.top_use_cases?.map((useCase) => (
            <div key={useCase.use_case} className="text-center p-4 border rounded-lg">
              <p className="text-sm font-medium text-gray-900 capitalize">
                {useCase.use_case.replace('_', ' ')}
              </p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {useCase.count.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Component: Intent Parsing Dashboard  
function IntentParsingDashboard({ analytics }) {
  const data = analytics?.intent_parsing;
  if (!data) return <div>Loading intelligence analytics...</div>;

  return (
    <div className="space-y-6">
      {/* Parsing Method Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🧠 Triple-Fallback Intelligence Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(data.parsing_method_distribution || {}).map(([method, stats]) => (
            <div key={method} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 capitalize">
                  {method.replace('_', ' ')}
                </h4>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {Math.round(stats.success_rate * 100)}% success
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.count.toLocaleString()}</p>
              <p className="text-sm text-gray-600">
                Avg confidence: {Math.round(stats.avg_confidence * 100)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Confidence Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Confidence Score Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(data.confidence_distribution || {}).map(([range, count]) => (
            <div key={range} className="text-center p-4 border rounded-lg">
              <p className="text-sm font-medium text-gray-600">{range}</p>
              <p className="text-xl font-bold text-green-600">{count.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Common Patterns */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Common Intent Patterns</h3>
        <div className="space-y-4">
          {data.common_intent_patterns?.map((pattern, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">{pattern.pattern}</h4>
                <span className="text-sm text-gray-500">
                  {pattern.frequency.toLocaleString()} requests
                </span>
              </div>
              <p className="text-sm text-gray-600 italic">"{pattern.example}"</p>
              <p className="text-xs text-green-600 mt-1">
                Avg confidence: {Math.round(pattern.avg_confidence * 100)}%
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Component: Regional Dashboard
function RegionalDashboard({ analytics }) {
  const data = analytics?.regional_performance;
  if (!data) return <div>Loading regional analytics...</div>;

  return (
    <div className="space-y-6">
      {/* Regional Accuracy */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Regional Intelligence Accuracy</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <p className="text-sm font-medium text-gray-600">Auto-Detection Rate</p>
            <p className="text-3xl font-bold text-green-600">
              {Math.round((data.regional_accuracy?.auto_detection_rate || 0) * 100)}%
            </p>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <p className="text-sm font-medium text-gray-600">Brand Switching Accuracy</p>
            <p className="text-3xl font-bold text-green-600">
              {Math.round((data.regional_accuracy?.brand_switching_accuracy || 0) * 100)}%
            </p>
          </div>
        </div>
      </div>

      {/* Theater Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🌍 Theater Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(data.theater_performance || {}).map(([theater, stats]) => (
            <div key={theater} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{theater}</h4>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
                  {stats.brand}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Requests:</span>
                  <span className="text-sm font-medium">{stats.total_requests?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Confidence:</span>
                  <span className="text-sm font-medium">{Math.round((stats.avg_confidence || 0) * 100)}%</span>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Top Products:</p>
                  <div className="flex flex-wrap gap-1">
                    {stats.top_products?.slice(0, 3).map(product => (
                      <span key={product} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Component: Asset Dashboard
function AssetDashboard({ analytics }) {
  const data = analytics?.asset_categories;
  if (!data) return <div>Loading asset analytics...</div>;

  return (
    <div className="space-y-6">
      {/* Section Popularity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📁 Vault Section Performance</h3>
        <div className="space-y-3">
          {data.section_popularity?.map((section, index) => (
            <div key={section.section} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{section.section}</p>
                  <p className="text-xs text-gray-500">
                    Success rate: {Math.round(section.success_rate * 100)}%
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-blue-600">
                {section.requests.toLocaleString()} requests
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Format Preferences */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎨 Format Preferences</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          {Object.entries(data.format_preferences || {}).map(([format, count]) => (
            <div key={format} className="text-center p-3 border rounded-lg">
              <p className="text-sm font-medium text-gray-900">{format}</p>
              <p className="text-lg font-bold text-purple-600">{count.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Component: Error Tracking Dashboard
function ErrorTrackingDashboard({ analytics }) {
  const data = analytics?.error_tracking;
  if (!data) return <div>Loading error analytics...</div>;

  return (
    <div className="space-y-6">
      {/* Error Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🚨 Error Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(data.error_breakdown || {}).map(([errorType, stats]) => (
            <div key={errorType} className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 capitalize mb-2">
                {errorType.replace(/_/g, ' ')}
              </h4>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-red-600">{stats.count}</span>
                <span className="text-sm text-gray-500">
                  {Math.round(stats.rate * 100)}% rate
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Improvement Opportunities */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Improvement Opportunities</h3>
        <div className="space-y-4">
          {data.improvement_opportunities?.map((opportunity, index) => (
            <div key={index} className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-medium text-gray-900">{opportunity.area}</h4>
              <p className="text-sm text-gray-600 mt-1">{opportunity.description}</p>
              <p className="text-sm text-green-600 mt-2 font-medium">
                💪 {opportunity.potential_impact}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
