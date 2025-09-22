import { useState, useEffect } from 'react';

// Custom CSS for faster tooltips
const tooltipStyles = `
  .fast-tooltip {
    transition: opacity 0.1s ease-in-out;
  }
  .fast-tooltip:hover {
    opacity: 1;
  }
  .fast-tooltip title {
    pointer-events: none;
  }
`;

// Filter Component
function FilterSection({ filters, setFilters }) {
  const filterItems = [
    { key: 'specificUser', label: 'Specific User', type: 'text', placeholder: 'Enter user ID or name' },
    { key: 'ageRange', label: 'Age Range', type: 'range', options: ['18-25', '26-35', '36-45', '46-55', '55+'] },
    { key: 'event', label: 'Event', type: 'text', placeholder: 'Event type' },
    { key: 'goal', label: 'Goal', type: 'text', placeholder: 'Training goal' },
    { key: 'location', label: 'Location', type: 'text', placeholder: 'City, Country' },
    { key: 'appUsage', label: 'App Usage', type: 'select', options: ['All', 'Using App', 'Not Using App'] },
    { key: 'trainingFrequency', label: 'Training Frequency', type: 'select', options: ['All', 'Training Less', 'Training More'] },
    { key: 'trainingModification', label: 'Training Modification', type: 'select', options: ['All', 'Modifying to Train Less', 'Modifying to Train More'] },
    { key: 'miloInteractions', label: '% Interactions with Milo', type: 'range-slider', min: 0, max: 100 }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filters
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filterItems.map((item) => (
          <div key={item.key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{item.label}</label>
            
            {item.type === 'text' && (
              <input
                type="text"
                placeholder={item.placeholder}
                value={filters[item.key] || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, [item.key]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-milo-red focus:border-milo-red"
              />
            )}
            
            {item.type === 'select' && (
              <select
                value={filters[item.key] || 'All'}
                onChange={(e) => setFilters(prev => ({ ...prev, [item.key]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-milo-red focus:border-milo-red"
              >
                {item.options.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            )}
            
            {item.type === 'range' && (
              <select
                value={filters[item.key] || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, [item.key]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-milo-red focus:border-milo-red"
              >
                <option value="">All Ages</option>
                {item.options.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            )}
            
            {item.type === 'range-slider' && (
              <div className="space-y-2">
                <input
                  type="range"
                  min={item.min}
                  max={item.max}
                  value={filters[item.key] || 50}
                  onChange={(e) => setFilters(prev => ({ ...prev, [item.key]: e.target.value }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="text-xs text-gray-500 text-center">
                  {filters[item.key] || 50}%
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-2">
        <button
          onClick={() => setFilters({})}
          className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Clear Filters
        </button>
        <button
          onClick={() => {/* Apply filters logic */}}
          className="px-4 py-2 text-sm text-white bg-milo-red rounded-md hover:bg-milo-dark transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}

// Metrics Cards Component
function MetricsCards({ metrics }) {
  const metricCards = [
    { 
      key: 'totalUsers', 
      label: 'Total Users', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-3-3h-2m-3 5v-2a3 3 0 00-3-3H9m3-2a3 3 0 100-6 3 3 0 000 6zm-3 2v2a3 3 0 003 3h2a3 3 0 003-3v-2" />
        </svg>
      ), 
      color: 'bg-blue-500', 
      trend: '+12.3%', 
      trendUp: true, 
      period: 'vs last month' 
    },
    { 
      key: 'activeUsers', 
      label: 'Active Users', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ), 
      color: 'bg-green-500', 
      trend: '+8.7%', 
      trendUp: true, 
      period: 'vs last month' 
    },
    { 
      key: 'weeklyTrainings', 
      label: 'Weekly Trainings', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ), 
      color: 'bg-purple-500', 
      trend: '+15.2%', 
      trendUp: true, 
      period: 'vs last week' 
    },
    { 
      key: 'weeklyDistance', 
      label: 'Weekly Distance (KM)', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ), 
      color: 'bg-orange-500', 
      trend: '+22.1%', 
      trendUp: true, 
      period: 'vs last week' 
    },
    { 
      key: 'mostUsedFeatures', 
      label: 'Most Used Feature', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ), 
      color: 'bg-yellow-500', 
      trend: 'Training Plans', 
      trendUp: null, 
      period: '64% usage' 
    },
    { 
      key: 'timeOnApp', 
      label: 'Avg. Time on App (min)', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ), 
      color: 'bg-indigo-500', 
      trend: '-2.1%', 
      trendUp: false, 
      period: 'vs last month' 
    },
    { 
      key: 'miloInteractions', 
      label: 'Avg. Milo Interactions', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ), 
      color: 'bg-milo-red', 
      trend: '+18.9%', 
      trendUp: true, 
      period: 'vs last month' 
    }
  ];

  const getTrendIcon = (trendUp) => {
    if (trendUp === true) {
      return (
        <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      );
    } else if (trendUp === false) {
      return (
        <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L10 15.586l5.293-5.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
      {metricCards.map((card) => (
        <div key={card.key} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{card.label}</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {metrics[card.key] || '---'}
              </p>
              <div className="flex items-center mt-2 text-xs">
                {card.trendUp !== null && getTrendIcon(card.trendUp)}
                <span className={`ml-1 font-medium ${
                  card.trendUp === true ? 'text-green-600' : 
                  card.trendUp === false ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {card.trend}
                </span>
                <span className="ml-1 text-gray-500">{card.period}</span>
              </div>
            </div>
            <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
              {card.icon}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            [Placeholder Data]
          </div>
        </div>
      ))}
    </div>
  );
}

// Charts Section Component
function ChartsSection() {
  // Placeholder chart data
  const userGrowthData = [
    { month: 'Jan', users: 1089, active: 734 },
    { month: 'Feb', users: 1134, active: 789 },
    { month: 'Mar', users: 1178, active: 823 },
    { month: 'Apr', users: 1203, active: 845 },
    { month: 'May', users: 1247, active: 892 }
  ];

  const trainingData = [
    { day: 'Mon', trainings: 342 },
    { day: 'Tue', trainings: 387 },
    { day: 'Wed', trainings: 425 },
    { day: 'Thu', trainings: 398 },
    { day: 'Fri', trainings: 456 },
    { day: 'Sat', trainings: 521 },
    { day: 'Sun', trainings: 478 }
  ];

  const featureUsage = [
    { feature: 'Training Plans', usage: 64, color: 'bg-blue-500' },
    { feature: 'Milo Chat', usage: 52, color: 'bg-green-500' },
    { feature: 'Progress Tracking', usage: 43, color: 'bg-purple-500' },
    { feature: 'Social Features', usage: 28, color: 'bg-orange-500' },
    { feature: 'Nutrition', usage: 19, color: 'bg-yellow-500' }
  ];

  const ageDistribution = [
    { range: '18-25', count: 287, percentage: 23 },
    { range: '26-35', count: 412, percentage: 33 },
    { range: '36-45', count: 356, percentage: 29 },
    { range: '46-55', count: 149, percentage: 12 },
    { range: '55+', count: 43, percentage: 3 }
  ];

  return (
    <div className="space-y-6 mb-6">
      {/* Line Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            User Growth Trend
          </h3>
        
        <div className="h-64 relative border-b border-l border-gray-200 p-4">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line 
                key={i} 
                x1="0" 
                y1={i * 40} 
                x2="400" 
                y2={i * 40} 
                stroke="#f3f4f6" 
                strokeWidth="1"
              />
            ))}
            {userGrowthData.map((_, i) => (
              <line 
                key={i} 
                x1={i * 80 + 40} 
                y1="0" 
                x2={i * 80 + 40} 
                y2="200" 
                stroke="#f3f4f6" 
                strokeWidth="1"
              />
            ))}
            
            {/* Total Users Line */}
            <polyline
              points={userGrowthData.map((data, index) => {
                const maxUsers = Math.max(...userGrowthData.map(d => d.users));
                const x = index * 80 + 40;
                const y = 200 - (data.users / maxUsers * 160);
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Active Users Line */}
            <polyline
              points={userGrowthData.map((data, index) => {
                const maxUsers = Math.max(...userGrowthData.map(d => d.users));
                const x = index * 80 + 40;
                const y = 200 - (data.active / maxUsers * 160);
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points for Total Users */}
            {userGrowthData.map((data, index) => {
              const maxUsers = Math.max(...userGrowthData.map(d => d.users));
              const x = index * 80 + 40;
              const y = 200 - (data.users / maxUsers * 160);
              return (
                <g key={`total-${index}`}>
                  {/* Invisible larger hover area */}
                  <circle
                    cx={x}
                    cy={y}
                    r="15"
                    fill="transparent"
                    className="cursor-pointer"
                  >
                    <title>{data.month}: {data.users} total users</title>
                  </circle>
                  {/* Visible data point */}
                  <circle
                    cx={x}
                    cy={y}
                    r="6"
                    fill="#3b82f6"
                    stroke="white"
                    strokeWidth="2"
                    className="hover:fill-blue-600 pointer-events-none"
                  />
                </g>
              );
            })}
            
            {/* Data points for Active Users */}
            {userGrowthData.map((data, index) => {
              const maxUsers = Math.max(...userGrowthData.map(d => d.users));
              const x = index * 80 + 40;
              const y = 200 - (data.active / maxUsers * 160);
              return (
                <g key={`active-${index}`}>
                  {/* Invisible larger hover area */}
                  <circle
                    cx={x}
                    cy={y}
                    r="15"
                    fill="transparent"
                    className="cursor-pointer"
                  >
                    <title>{data.month}: {data.active} active users</title>
                  </circle>
                  {/* Visible data point */}
                  <circle
                    cx={x}
                    cy={y}
                    r="6"
                    fill="#10b981"
                    stroke="white"
                    strokeWidth="2"
                    className="hover:fill-green-600 pointer-events-none"
                  />
                </g>
              );
            })}
            
            {/* Month labels */}
            {userGrowthData.map((data, index) => (
              <text
                key={`label-${index}`}
                x={index * 80 + 40}
                y="215"
                textAnchor="middle"
                className="text-xs fill-gray-600"
                fontSize="12"
              >
                {data.month}
              </text>
            ))}
          </svg>
        </div>
        
        <div className="flex items-center justify-center space-x-6 mt-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Total Users</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Active Users</span>
          </div>
        </div>
        
          <div className="mt-2 text-xs text-gray-400 text-center">[Placeholder Chart Data]</div>
        </div>

        {/* Milo Interactions Line Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-milo-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Milo Interactions Over Time
          </h3>
          
          <div className="h-64 relative border-b border-l border-gray-200 p-4">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map(i => (
                <line 
                  key={i} 
                  x1="0" 
                  y1={i * 40} 
                  x2="400" 
                  y2={i * 40} 
                  stroke="#f3f4f6" 
                  strokeWidth="1"
                />
              ))}
              {Array.from({length: 12}).map((_, i) => (
                <line 
                  key={i} 
                  x1={i * 33 + 20} 
                  y1="0" 
                  x2={i * 33 + 20} 
                  y2="200" 
                  stroke="#f3f4f6" 
                  strokeWidth="1"
                />
              ))}
              
              {/* Milo Interactions Line */}
              <polyline
                points={[
                  { month: 'Jan', interactions: 5.8 },
                  { month: 'Feb', interactions: 6.2 },
                  { month: 'Mar', interactions: 7.1 },
                  { month: 'Apr', interactions: 6.9 },
                  { month: 'May', interactions: 8.3 },
                  { month: 'Jun', interactions: 7.8 },
                  { month: 'Jul', interactions: 9.1 },
                  { month: 'Aug', interactions: 8.5 },
                  { month: 'Sep', interactions: 10.2 },
                  { month: 'Oct', interactions: 9.8 },
                  { month: 'Nov', interactions: 11.4 },
                  { month: 'Dec', interactions: 8.5 }
                ].map((data, index) => {
                  const x = index * 33 + 20;
                  const y = 200 - (data.interactions / 12 * 160);
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#dc2626"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Data points */}
              {[
                { month: 'Jan', interactions: 5.8 },
                { month: 'Feb', interactions: 6.2 },
                { month: 'Mar', interactions: 7.1 },
                { month: 'Apr', interactions: 6.9 },
                { month: 'May', interactions: 8.3 },
                { month: 'Jun', interactions: 7.8 },
                { month: 'Jul', interactions: 9.1 },
                { month: 'Aug', interactions: 8.5 },
                { month: 'Sep', interactions: 10.2 },
                { month: 'Oct', interactions: 9.8 },
                { month: 'Nov', interactions: 11.4 },
                { month: 'Dec', interactions: 8.5 }
              ].map((data, index) => {
                const x = index * 33 + 20;
                const y = 200 - (data.interactions / 12 * 160);
                return (
                  <g key={index}>
                    {/* Invisible larger hover area */}
                    <circle
                      cx={x}
                      cy={y}
                      r="15"
                      fill="transparent"
                      className="cursor-pointer"
                    >
                      <title>{data.month}: {data.interactions} avg interactions per user</title>
                    </circle>
                    {/* Visible data point */}
                    <circle
                      cx={x}
                      cy={y}
                      r="6"
                      fill="#dc2626"
                      stroke="white"
                      strokeWidth="2"
                      className="hover:fill-red-700 pointer-events-none"
                    />
                  </g>
                );
              })}
              
              {/* Month labels */}
              {[
                { month: 'Jan', interactions: 5.8 },
                { month: 'Feb', interactions: 6.2 },
                { month: 'Mar', interactions: 7.1 },
                { month: 'Apr', interactions: 6.9 },
                { month: 'May', interactions: 8.3 },
                { month: 'Jun', interactions: 7.8 },
                { month: 'Jul', interactions: 9.1 },
                { month: 'Aug', interactions: 8.5 },
                { month: 'Sep', interactions: 10.2 },
                { month: 'Oct', interactions: 9.8 },
                { month: 'Nov', interactions: 11.4 },
                { month: 'Dec', interactions: 8.5 }
              ].map((data, index) => (
                <text
                  key={`label-${index}`}
                  x={index * 33 + 20}
                  y="215"
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                  fontSize="10"
                >
                  {data.month}
                </text>
              ))}
            </svg>
          </div>
          
          <div className="flex items-center justify-center mt-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-milo-red rounded mr-2"></div>
              <span className="text-sm text-gray-600">Avg. Monthly Interactions per User</span>
            </div>
          </div>
          
          <div className="mt-2 text-xs text-gray-400 text-center">[Placeholder Chart Data]</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weekly Training Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Weekly Training Activity
          </h3>
          
          <div className="space-y-3">
            {trainingData.map((data, index) => {
              const maxTrainings = Math.max(...trainingData.map(d => d.trainings));
              const width = (data.trainings / maxTrainings) * 100;
              
              return (
                <div key={data.day} className="flex items-center">
                  <div className="w-10 text-xs font-medium text-gray-600">{data.day}</div>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-4 relative">
                      <div 
                        className="bg-purple-500 h-4 rounded-full transition-all duration-300"
                        style={{ width: `${width}%` }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                        {data.trainings}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 text-xs text-gray-400 text-center">[Placeholder Chart Data]</div>
        </div>

        {/* Feature Usage */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Most Used Features
          </h3>
          
          <div className="space-y-4">
            {featureUsage.map((feature, index) => (
              <div key={feature.feature} className="flex items-center">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{feature.feature}</span>
                    <span className="text-sm text-gray-500">{feature.usage}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${feature.color} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${feature.usage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-xs text-gray-400 text-center">[Placeholder Chart Data]</div>
        </div>

        {/* Age Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Age Distribution
          </h3>
          
          <div className="space-y-3">
            {ageDistribution.map((age, index) => (
              <div key={age.range} className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <div className="w-16 text-sm font-medium text-gray-600">{age.range}</div>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-indigo-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${age.percentage * 3}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 w-12 text-right">{age.count}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-xs text-gray-400 text-center">[Placeholder Chart Data]</div>
        </div>

        {/* Milo Interactions Heatmap */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-milo-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Milo Interactions Heatmap
          </h3>
          
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-xs font-medium text-gray-500 text-center py-1">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 28 }, (_, i) => {
              const intensity = Math.floor(Math.random() * 4) + 1;
              const colors = ['bg-gray-100', 'bg-red-200', 'bg-red-300', 'bg-red-400', 'bg-milo-red'];
              return (
                <div 
                  key={i} 
                  className={`w-8 h-8 ${colors[intensity]} rounded border border-gray-200 flex items-center justify-center text-xs font-medium hover:scale-110 transition-transform cursor-pointer`}
                  title={`Day ${i + 1}: ${intensity * 5} interactions`}
                >
                  {intensity > 2 ? intensity * 5 : ''}
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
            <span>Less</span>
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-gray-100 rounded"></div>
              <div className="w-3 h-3 bg-red-200 rounded"></div>
              <div className="w-3 h-3 bg-red-300 rounded"></div>
              <div className="w-3 h-3 bg-red-400 rounded"></div>
              <div className="w-3 h-3 bg-milo-red rounded"></div>
            </div>
            <span>More</span>
          </div>
          
          <div className="mt-2 text-xs text-gray-400 text-center">[Placeholder Chart Data]</div>
        </div>
      </div>
    </div>
  );
}

// User Information Table Component
function UserTable({ users, onUserClick }) {
  const tableHeaders = [
    'User ID', 'Name', 'Age', 'Location', 'Active', 'Weekly Trainings', 
    'Distance (KM)', 'Time on App', 'Milo Interactions', 'Actions'
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-3-3h-2m-3 5v-2a3 3 0 00-3-3H9m3-2a3 3 0 100-6 3 3 0 000 6zm-3 2v2a3 3 0 003 3h2a3 3 0 003-3v-2" />
          </svg>
          User Information Table
          <span className="text-sm font-normal text-gray-500">({users.length} users)</span>
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {tableHeaders.map((header) => (
                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user, index) => (
              <tr key={user.id || index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {user.id || `USER_${index + 1}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.name || `User ${index + 1}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.age || '25'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.location || 'Madrid, Spain'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.weeklyTrainings || '3'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.distance || '15.2'} KM
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.timeOnApp || '45'} min
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.miloInteractions || '12'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onUserClick(user)}
                    className="text-milo-red hover:text-milo-dark cursor-pointer"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-3-3h-2m-3 5v-2a3 3 0 00-3-3H9m3-2a3 3 0 100-6 3 3 0 000 6zm-3 2v2a3 3 0 003 3h2a3 3 0 003-3v-2" />
            </svg>
            <p>No users found with current filters</p>
            <p className="text-sm text-gray-400">[This is placeholder content]</p>
          </div>
        )}
      </div>
    </div>
  );
}

// User Detail Modal Component  
function UserDetailModal({ user, onClose }) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Basic Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">User ID:</span> {user.id || 'USER_001'}</div>
              <div><span className="text-gray-500">Name:</span> {user.name || 'Müller Anna'}</div>
              <div><span className="text-gray-500">Email:</span> {user.email || 'anna.mueller@example.com'}</div>
              <div><span className="text-gray-500">Phone:</span> {user.phone || '+41 79 123 45 67'}</div>
              <div><span className="text-gray-500">Age:</span> {user.age || '28'}</div>
              <div><span className="text-gray-500">Location:</span> {user.location || 'Zürich, Schweiz'}</div>
            </div>
          </div>

          {/* Training Metrics */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Training Metrics</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Weekly Trainings:</span> {user.weeklyTrainings || '3'}</div>
              <div><span className="text-gray-500">Total Distance:</span> {user.distance || '15.2'} KM</div>
              <div><span className="text-gray-500">Time on App:</span> {user.timeOnApp || '45'} min/week</div>
              <div><span className="text-gray-500">Milo Interactions:</span> {user.miloInteractions || '12'}/week</div>
              <div><span className="text-gray-500">Training Goal:</span> {user.goal || '10K Race Preparation'}</div>
              <div><span className="text-gray-500">Activity Level:</span> {user.activityLevel || 'Intermediate'}</div>
            </div>
          </div>

          {/* Training Plan Preview */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Current Training Plan</h4>
            <div className="bg-gray-50 rounded-md p-4">
              <div className="text-sm text-gray-600 mb-2">
                <strong>Plan:</strong> {user.trainingPlan || '12-Week 10K Training Program'}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                <strong>Week Progress:</strong> {user.weekProgress || '4/12'}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Next Session:</strong> {user.nextSession || 'Tomorrow - 5K Easy Run'}
              </div>
            </div>
          </div>

          {/* Future Features Placeholder */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Future Analytics</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Coming Soon</span>
              </div>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• ChatGPT conversation summaries</li>
                <li>• AI-powered training plan analysis</li>
                <li>• Predictive performance insights</li>
                <li>• Personalized recommendations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Analytics Component
function Analytics({ user }) {
  const [filters, setFilters] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Placeholder data
  const [metrics] = useState({
    totalUsers: '1,247',
    activeUsers: '892',
    weeklyTrainings: '2,341',
    weeklyDistance: '12,458',
    mostUsedFeatures: 'Training Plans',
    timeOnApp: '34',
    miloInteractions: '8.5'
  });

  // Placeholder user data
  const [users] = useState([
    { id: 'USER_001', name: 'Müller Anna', age: 28, location: 'Zürich, Schweiz', active: true, weeklyTrainings: 4, distance: '18.5', timeOnApp: '52', miloInteractions: '15' },
    { id: 'USER_002', name: 'Schmid Hans', age: 34, location: 'Basel, Schweiz', active: true, weeklyTrainings: 3, distance: '22.1', timeOnApp: '41', miloInteractions: '12' },
    { id: 'USER_003', name: 'Weber Petra', age: 25, location: 'Bern, Schweiz', active: false, weeklyTrainings: 1, distance: '5.2', timeOnApp: '18', miloInteractions: '3' },
    { id: 'USER_004', name: 'Meier Thomas', age: 31, location: 'Luzern, Schweiz', active: true, weeklyTrainings: 5, distance: '35.7', timeOnApp: '67', miloInteractions: '22' },
    { id: 'USER_005', name: 'Fischer Claudia', age: 29, location: 'St. Gallen, Schweiz', active: true, weeklyTrainings: 3, distance: '14.8', timeOnApp: '38', miloInteractions: '9' }
  ]);

  const handleUserClick = (user) => {
    setSelectedUser(user);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Add custom CSS for faster tooltips */}
      <style dangerouslySetInnerHTML={{ __html: tooltipStyles }} />
      
      {/* Header */}
      <div className="border-b bg-white p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-6 h-6 text-milo-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics Dashboard
                <span className="text-sm font-normal text-gray-500 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Placeholder
                </span>
              </h1>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Filters */}
        <FilterSection filters={filters} setFilters={setFilters} />
        
        {/* Metrics Cards */}
        <MetricsCards metrics={metrics} />
        
        {/* Charts Section */}
        <ChartsSection />
        
        {/* User Table */}
        <UserTable users={users} onUserClick={handleUserClick} />
        
        {/* User Detail Modal */}
        {selectedUser && (
          <UserDetailModal 
            user={selectedUser} 
            onClose={() => setSelectedUser(null)} 
          />
        )}
      </div>
    </div>
  );
}

export default Analytics;