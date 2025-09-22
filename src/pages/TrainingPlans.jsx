import { useState, useEffect } from 'react';
import { marked } from 'marked';
import { 
  getTrainingPlansUsers, 
  getTrainingPlan 
} from '../services/api';

function TrainingPlans() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [trainingPlan, setTrainingPlan] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await getTrainingPlansUsers();
      setUsers(response.data.data || []);
    } catch (err) {
      setError('Error loading users');
      console.error('Error loading users:', err);
    }
  };

  const handleUserSelect = async (userId) => {
    if (!userId) {
      setSelectedUser('');
      setSelectedUserData(null);
      setTrainingPlan(null);
      setSelectedWeek(null);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await getTrainingPlan(userId);
      const data = response.data.data;
      
      setSelectedUser(userId);
      setSelectedUserData(data.user);
      setTrainingPlan(data.trainingPlan);
      setSelectedWeek(null);
    } catch (err) {
      setError('Error loading training plan');
      console.error('Error loading training plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const groupPlanItemsByDate = (planItems) => {
    const grouped = {};
    
    planItems.forEach(item => {
      const date = item.plan_item_scheduled_date || item.plan_item_predefined_date || 'No date';
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });

    // Sort by date
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      if (a === 'No date') return 1;
      if (b === 'No date') return -1;
      return new Date(a) - new Date(b);
    });

    return sortedDates.map(date => ({
      date,
      items: grouped[date]
    }));
  };

  const getAthleteGoalLabel = (goal) => {
    const labels = {
      SPECIFIC_TIME_GOAL: 'Specific Time Goal',
      IMPROVE_FITNESS: 'Improve Fitness',
      HAVE_A_REASON_TO_TRAIN: 'Have a Reason to Train',
      HAVE_FUN: 'Have Fun'
    };
    return labels[goal] || goal;
  };

  const getAthleteLevelLabel = (level) => {
    const labels = {
      BEGINNER: 'Beginner',
      INTERMEDIATE: 'Intermediate',
      ADVANCED: 'Advanced'
    };
    return labels[level] || level;
  };

  const getTrainingPhaseLabel = (phase) => {
    const labels = {
      BASE: 'Base Phase',
      BUILD: 'Build Phase',
      PEAK: 'Peak Phase',
      TAPER: 'Taper Phase',
      RECOVERY: 'Recovery Phase',
      OUTSIDE_TRAINING_PLAN: 'Outside Plan'
    };
    return labels[phase] || phase;
  };

  const getTrainingPhaseColor = (phase) => {
    const colors = {
      BASE: 'bg-blue-100 text-blue-800',
      BUILD: 'bg-orange-100 text-orange-800',
      PEAK: 'bg-red-100 text-red-800',
      TAPER: 'bg-purple-100 text-purple-800',
      RECOVERY: 'bg-green-100 text-green-800',
      OUTSIDE_TRAINING_PLAN: 'bg-gray-100 text-gray-800'
    };
    return colors[phase] || 'bg-gray-100 text-gray-800';
  };

  const getTrainingPhaseBackground = (phase) => {
    const backgrounds = {
      BASE: 'bg-blue-50 border-blue-200',
      BUILD: 'bg-orange-50 border-orange-200',
      PEAK: 'bg-red-50 border-red-200',
      TAPER: 'bg-purple-50 border-purple-200',
      RECOVERY: 'bg-green-50 border-green-200',
      OUTSIDE_TRAINING_PLAN: 'bg-gray-50 border-gray-200'
    };
    return backgrounds[phase] || 'bg-white border-gray-200';
  };

  const getWeekPhase = (week) => {
    // Get the most common phase from planItems
    if (!week.planItems || week.planItems.length === 0) return null;
    
    const phases = {};
    week.planItems.forEach(item => {
      // Look for trainingPhase in payload_json or payload
      const trainingPhase = item.payload_json?.trainingPhase || item.payload?.trainingPhase;
      if (trainingPhase) {
        phases[trainingPhase] = (phases[trainingPhase] || 0) + 1;
      }
    });

    if (Object.keys(phases).length === 0) return null;

    // Return the most frequent phase
    return Object.keys(phases).reduce((a, b) => phases[a] > phases[b] ? a : b);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="border-b bg-white p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-6 h-6 text-milo-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Training Plans
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <label htmlFor="user-select" className="text-sm font-medium text-gray-700">
                Select Athlete:
              </label>
              <select
                id="user-select"
                value={selectedUser}
                onChange={(e) => handleUserSelect(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-milo-red focus:border-milo-red min-w-64"
              >
                <option value="">-- Select an athlete --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading training plan...</span>
          </div>
        )}

        {/* Selected user information */}
        {selectedUserData && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Athlete:</span>
                <span className="ml-2 text-gray-600">
                  {selectedUserData.firstName} {selectedUserData.lastName}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Level:</span>
                <span className="ml-2 text-gray-600">
                  {getAthleteLevelLabel(selectedUserData.onboardingData?.athleteLevel)}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Goal:</span>
                <span className="ml-2 text-gray-600">
                  {getAthleteGoalLabel(selectedUserData.onboardingData?.athleteGoal)}
                  {selectedUserData.onboardingData?.athleteGoal === 'SPECIFIC_TIME_GOAL' && selectedUserData.runningProfile?.time_goal_duration && (
                    <span> ({selectedUserData.runningProfile.time_goal_duration})</span>
                  )}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Distance:</span>
                <span className="ml-2 text-gray-600">
                  {selectedUserData.onboardingData?.totalDistance}m
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Event:</span>
                <span className="ml-2 text-gray-600">
                  {selectedUserData.onboardingData?.editionName}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Training plan with small cards */}
        {trainingPlan && !loading && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Small week cards grid */}
            <div className="flex flex-wrap gap-4 mb-6">
            {trainingPlan.weeks?.map((week, index) => {
              const weekPhase = getWeekPhase(week);
              const planItemsWithInfo = week.planItems?.filter(item => 
                item.trainingDescriptions?.trainingInfo || 
                item.trainingDescriptions?.howToExecuteThisSession ||
                item.trainingDescriptions?.whyThisSessionIsImportant?.length > 0
              ) || [];
              const workoutCount = planItemsWithInfo.length;
              const isPlanned = week.week_planned;
              
              return (
                <div
                  key={week.id}
                  className={`p-1 border rounded cursor-pointer transition-all hover:shadow-md w-16 ${
                    selectedWeek?.id === week.id
                      ? 'border-blue-500 bg-blue-100 shadow-md'
                      : weekPhase 
                        ? `${getTrainingPhaseBackground(weekPhase)} hover:shadow-sm`
                        : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedWeek(selectedWeek?.id === week.id ? null : week)}
                >
                  <div className="text-center space-y-0.5">
                    <div className="flex items-center justify-center space-x-1">
                      <h4 className="font-semibold text-gray-900 text-xs">
                        W{index + 1}
                      </h4>
                      {!isPlanned && workoutCount === 0 ? (
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      ) : workoutCount > 0 ? (
                        <span className="text-xs text-gray-600">({workoutCount})</span>
                      ) : null}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {formatDate(week.week_start_date).split(',')[0]}
                    </div>
                    
                    {/* Training phase */}
                    {weekPhase && (
                      <div className="flex justify-center">
                        <span className={`px-1 py-0.5 text-xs rounded-full ${getTrainingPhaseColor(weekPhase)}`}>
                          {getTrainingPhaseLabel(weekPhase).split(' ')[0]}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected week details */}
          {selectedWeek && (
            <div className="bg-white rounded-lg pr-6 py-6 shadow-sm mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h4 className="text-lg font-semibold text-gray-900">
                    Week {trainingPlan.weeks.findIndex(w => w.id === selectedWeek.id) + 1} Details
                  </h4>
                  {(() => {
                    const weekPhase = getWeekPhase(selectedWeek);
                    return weekPhase ? (
                      <span className={`px-2 py-1 text-xs rounded-full ${getTrainingPhaseColor(weekPhase)}`}>
                        {getTrainingPhaseLabel(weekPhase)}
                      </span>
                    ) : null;
                  })()}
                </div>
                <div className="text-sm text-gray-600">
                  {formatDate(selectedWeek.week_start_date)} - {formatDate(selectedWeek.week_end_date)}
                </div>
              </div>

              {selectedWeek.planItems && selectedWeek.planItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {groupPlanItemsByDate(selectedWeek.planItems)
                    .filter(({ items }) => 
                      items.some(item => 
                        item.trainingDescriptions?.trainingInfo || 
                        item.trainingDescriptions?.howToExecuteThisSession ||
                        item.trainingDescriptions?.whyThisSessionIsImportant?.length > 0
                      )
                    )
                    .map(({ date, items }) => (
                    <div key={date} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                      <h5 className="font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-300">
                        {date === 'No date' ? 'No scheduled date' : formatDate(date)}
                      </h5>
                      <div className="space-y-3">
                        {items
                          .filter(item => 
                            item.trainingDescriptions?.trainingInfo || 
                            item.trainingDescriptions?.howToExecuteThisSession ||
                            item.trainingDescriptions?.whyThisSessionIsImportant?.length > 0
                          )
                          .map((item) => (
                          <TrainingItem key={item.id} item={item} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  No workouts scheduled for this week
                </div>
              )}
            </div>
          )}

          </div>
        )}

        {/* Initial state */}
        {!selectedUser && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div className="text-gray-500 text-lg">
              Select an athlete to view their training plan
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Component to display a training item
function TrainingItem({ item }) {
  const [showDetails, setShowDetails] = useState(false);

  const getPlanItemTypeLabel = (type) => {
    const labels = {
      INTERVAL: 'Intervals',
      MIDDLE_TEMPO_RUN: 'Middle Tempo Run',
      REGENERATION_RUN: 'Recovery Run',
      LONG_JOG: 'Long Jog',
      ENDURANCE_RUN_1: 'Endurance Run 1',
      ENDURANCE_RUN_2: 'Endurance Run 2',
      EVENT_DAY: 'Event Day',
      WALKING: 'Walking',
      WALKING_INTERVAL: 'Walking Intervals'
    };
    return labels[type] || type;
  };

  const formatTrainingInfo = (text) => {
    if (!text) return '';
    // Replace PHRASE tags with bold red text
    let formattedText = text.replace(/<PHRASE id="[^"]*">([^<]*)<\/PHRASE>/g, '<span class="font-bold text-red-600">$1</span>');
    // Parse markdown and return HTML
    return marked(formattedText);
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <h6 className="font-semibold text-gray-900 text-lg">
          {getPlanItemTypeLabel(item.type)}
        </h6>
        <span className="text-xs text-gray-500">
          ID: {item.external_id}
        </span>
      </div>

      {/* Training information - always visible */}
      {item.trainingDescriptions?.trainingInfo && (
        <div className="mb-4">
          <h7 className="text-sm font-medium text-gray-700 mb-2 block">
            Training Information:
          </h7>
          <div className="text-sm">
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{
                __html: formatTrainingInfo(item.trainingDescriptions.trainingInfo)
              }}
            />
          </div>
        </div>
      )}

      {/* Combined collapsible section for How to execute + Why important */}
      {(item.trainingDescriptions?.howToExecuteThisSession || 
        item.trainingDescriptions?.whyThisSessionIsImportant?.length > 0) && (
        <div className="mt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg
              className={`w-4 h-4 mr-1 transform transition-transform ${
                showDetails ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Session Details & Importance
          </button>

          {showDetails && (
            <div className="mt-3 space-y-4">
              {/* How to execute session */}
              {item.trainingDescriptions?.howToExecuteThisSession && (
                <div>
                  <h8 className="text-sm font-medium text-gray-700 mb-2 block">
                    How to Execute This Session:
                  </h8>
                  <div className="text-sm">
                    <div
                      className="prose prose-sm max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{
                        __html: formatTrainingInfo(item.trainingDescriptions.howToExecuteThisSession)
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Why this session is important */}
              {item.trainingDescriptions?.whyThisSessionIsImportant?.length > 0 && (
                <div>
                  <h8 className="text-sm font-medium text-gray-700 mb-2 block">
                    Why This Session is Important:
                  </h8>
                  <div className="space-y-2">
                    {item.trainingDescriptions.whyThisSessionIsImportant.map((reason, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium text-gray-800">{reason.title}</div>
                        <div 
                          className="text-gray-700 mt-1"
                          dangerouslySetInnerHTML={{
                            __html: formatTrainingInfo(reason.description)
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TrainingPlans;