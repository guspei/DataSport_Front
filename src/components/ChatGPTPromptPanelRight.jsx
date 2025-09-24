import { useState, useEffect } from 'react';
import { sanitizeInput, validatePromptLength, sanitizePromptVariables } from '../utils/security';

function ChatGPTPromptPanelRight({ isOpen, onClose, selectedUser, trainingPlan }) {
  const [prompts, setPrompts] = useState([
    { id: 1, name: 'Weekly Performance Analysis', content: 'Analyze the training data for {user_name} (age: {age}, gender: {gender}). Week {week_number} training plan: {training_plan_week_1}. Actual logged training: {logged_training_week_1}. Compare planned vs actual performance and provide insights.' },
    { id: 2, name: 'Daily Training Review', content: 'Review {user_name}\'s training for {training_plan_week_1_monday} on Monday of Week 1. Their height is {height}cm and weight is {weight}kg. Compare with logged data: {logged_training_week_1_monday}. Assess compliance and suggest adjustments.' },
    { id: 3, name: 'Goal Achievement Progress', content: 'Evaluate {user_name}\'s progress towards their goal: {goal}. Their motivation is {motivation}. Analyze weeks 1-4 training: {training_plan_week_1} through {training_plan_week_4} against logged: {logged_training_week_1} through {logged_training_week_4}.' }
  ]);

  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [promptText, setPromptText] = useState('');
  const [improvePromptText, setImprovePromptText] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [showVariables, setShowVariables] = useState(false);
  const [showImprovedPrompt, setShowImprovedPrompt] = useState(false);
  const [improvedPromptSuggestion, setImprovedPromptSuggestion] = useState('');
  const [copiedVariable, setCopiedVariable] = useState(null);
  const [promptSelectorCollapsed, setPromptSelectorCollapsed] = useState(true); // Changed to true by default
  const [editingPromptId, setEditingPromptId] = useState(null);
  const [editingPromptName, setEditingPromptName] = useState('');
  const [expandedVariableCategories, setExpandedVariableCategories] = useState({
    personalInfo: true,
    trainingPlan: false,
    trainingLog: false
  });

  // Reorganized variables by category
  const availableVariables = {
    personalInfo: {
      title: 'Personal Information',
      variables: [
        { key: '{user_name}', description: 'Athlete full name' },
        { key: '{age}', description: 'Athlete age' },
        { key: '{gender}', description: 'Athlete gender' },
        { key: '{height}', description: 'Height in cm' },
        { key: '{weight}', description: 'Weight in kg' },
        { key: '{goal}', description: 'Training goal' },
        { key: '{motivation}', description: 'Motivation level' }
      ]
    },
    trainingPlan: {
      title: 'Training Plan',
      variables: (() => {
        const vars = [];
        const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        // Add weekly training plan variables
        for (let week = 1; week <= 8; week++) {
          vars.push({
            key: `{training_plan_week_${week}}`,
            description: `Week ${week} full training plan`
          });
        }

        // Add daily training plan variables
        for (let week = 1; week <= 8; week++) {
          for (const day of dayNames) {
            vars.push({
              key: `{training_plan_week_${week}_${day}}`,
              description: `Week ${week} ${day.charAt(0).toUpperCase() + day.slice(1)} plan`
            });
          }
        }

        return vars;
      })()
    },
    trainingLog: {
      title: 'Training Log (Actual)',
      variables: (() => {
        const vars = [];
        const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        // Add weekly logged training variables
        for (let week = 1; week <= 8; week++) {
          vars.push({
            key: `{logged_training_week_${week}}`,
            description: `Week ${week} actual training logged`
          });
        }

        // Add daily logged training variables
        for (let week = 1; week <= 8; week++) {
          for (const day of dayNames) {
            vars.push({
              key: `{logged_training_week_${week}_${day}}`,
              description: `Week ${week} ${day.charAt(0).toUpperCase() + day.slice(1)} logged`
            });
          }
        }

        return vars;
      })()
    }
  };

  useEffect(() => {
    if (selectedPrompt) {
      setPromptText(selectedPrompt.content);
    }
  }, [selectedPrompt]);

  const handleCreateNewPrompt = () => {
    const sanitizedName = sanitizeInput(newPromptName.trim());
    if (sanitizedName && sanitizedName.length <= 100) {
      const newPrompt = {
        id: Date.now(),
        name: sanitizedName,
        content: ''
      };
      setPrompts([...prompts, newPrompt]);
      setSelectedPrompt(newPrompt);
      setPromptText('');
      setIsCreatingNew(false);
      setNewPromptName('');
    } else if (sanitizedName.length > 100) {
      alert('Prompt name must be less than 100 characters');
    }
  };

  const handleDeletePrompt = (promptId) => {
    setPrompts(prompts.filter(p => p.id !== promptId));
    if (selectedPrompt?.id === promptId) {
      setSelectedPrompt(null);
      setPromptText('');
    }
  };

  const handleSavePrompt = () => {
    if (selectedPrompt && promptText) {
      if (!validatePromptLength(promptText)) {
        alert('Prompt is too long. Maximum 5000 characters allowed.');
        return;
      }

      const sanitizedContent = sanitizePromptVariables(promptText);
      setPrompts(prompts.map(p =>
        p.id === selectedPrompt.id
          ? { ...p, content: sanitizedContent }
          : p
      ));
      setPromptText(sanitizedContent);
      // Success feedback without console.log
    }
  };

  const handleExecutePrompt = () => {
    if (!validatePromptLength(promptText)) {
      alert('Prompt is too long. Maximum 5000 characters allowed.');
      return;
    }

    const sanitizedPrompt = sanitizePromptVariables(promptText);
    // Execute with sanitized prompt
    alert('Prompt sent to ChatGPT (mockup)');
  };

  const handleImprovePrompt = () => {
    const improved = `Enhanced version: ${improvePromptText}\n\nOriginal prompt has been optimized with better context and clearer instructions for more accurate results.`;
    setImprovedPromptSuggestion(improved);
    setShowImprovedPrompt(true);
  };

  const handleAcceptImprovedPrompt = () => {
    setPromptText(improvedPromptSuggestion);
    setShowImprovedPrompt(false);
    setImprovePromptText('');
    setImprovedPromptSuggestion('');
  };

  const handleSaveAsNewPrompt = () => {
    const newPrompt = {
      id: Date.now(),
      name: `${selectedPrompt?.name || 'New'} (Improved)`,
      content: improvedPromptSuggestion
    };
    setPrompts([...prompts, newPrompt]);
    setSelectedPrompt(newPrompt);
    setPromptText(improvedPromptSuggestion);
    setShowImprovedPrompt(false);
    setImprovePromptText('');
    setImprovedPromptSuggestion('');
  };

  const insertVariable = (variable) => {
    setPromptText(promptText + ' ' + variable);
    setCopiedVariable(variable);
    setTimeout(() => setCopiedVariable(null), 2000);
  };

  const startEditingPromptName = (prompt) => {
    setEditingPromptId(prompt.id);
    setEditingPromptName(prompt.name);
  };

  const savePromptName = () => {
    const sanitizedName = sanitizeInput(editingPromptName.trim());
    if (sanitizedName && sanitizedName.length <= 100) {
      setPrompts(prompts.map(p =>
        p.id === editingPromptId
          ? { ...p, name: sanitizedName }
          : p
      ));
    } else if (sanitizedName.length > 100) {
      alert('Prompt name must be less than 100 characters');
    }
    setEditingPromptId(null);
    setEditingPromptName('');
  };

  const cancelEditingPromptName = () => {
    setEditingPromptId(null);
    setEditingPromptName('');
  };

  const toggleVariableCategory = (category) => {
    setExpandedVariableCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black transition-opacity z-40 ${
          isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sliding Panel from Right */}
      <div
        className={`fixed right-0 top-0 h-full bg-white shadow-xl z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '600px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI Training Assistant</h2>
            {selectedUser && (
              <p className="text-sm text-gray-500 mt-1">
                Athlete: {selectedUser.firstName} {selectedUser.lastName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full overflow-hidden" style={{ maxHeight: 'calc(100vh - 88px)' }}>
          {/* Collapsible Prompt Selector */}
          <div className={`border-b transition-all ${promptSelectorCollapsed ? '' : 'p-6'}`}>
            <div className={`flex items-center justify-between ${promptSelectorCollapsed ? 'p-4' : 'mb-4'}`}>
              <button
                onClick={() => setPromptSelectorCollapsed(!promptSelectorCollapsed)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${promptSelectorCollapsed ? '-rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Prompt Templates
                {selectedPrompt && promptSelectorCollapsed && (
                  <span className="text-gray-500 ml-2">({selectedPrompt.name})</span>
                )}
              </button>
              {!promptSelectorCollapsed && (
                <button
                  onClick={() => setIsCreatingNew(!isCreatingNew)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-milo-red text-white rounded-lg hover:bg-milo-dark transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Prompt
                </button>
              )}
            </div>

            {/* Expanded Prompt Selector Content */}
            {!promptSelectorCollapsed && (
              <>
                {/* New Prompt Form */}
                {isCreatingNew && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      placeholder="Enter prompt name..."
                      value={newPromptName}
                      onChange={(e) => setNewPromptName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-milo-red"
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateNewPrompt()}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleCreateNewPrompt}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setIsCreatingNew(false);
                          setNewPromptName('');
                        }}
                        className="px-3 py-1.5 text-sm bg-gray-400 text-white rounded-md hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Prompt List */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {prompts.map(prompt => (
                    <div
                      key={prompt.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedPrompt?.id === prompt.id
                          ? 'border-milo-red bg-red-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedPrompt(prompt)}
                    >
                      {editingPromptId === prompt.id ? (
                        <input
                          type="text"
                          value={editingPromptName}
                          onChange={(e) => setEditingPromptName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') savePromptName();
                            if (e.key === 'Escape') cancelEditingPromptName();
                          }}
                          onBlur={savePromptName}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-milo-red"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="text-sm font-medium text-gray-700 flex-1"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            startEditingPromptName(prompt);
                          }}
                          title="Double-click to edit"
                        >
                          {prompt.name}
                        </span>
                      )}
                      <div className="flex items-center gap-1 ml-2">
                        {editingPromptId !== prompt.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingPromptName(prompt);
                            }}
                            className="p-1 rounded hover:bg-gray-200 text-gray-500 transition-colors"
                            title="Edit name"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePrompt(prompt.id);
                          }}
                          className="p-1 rounded hover:bg-red-100 text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Main Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Prompt Editor */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Prompt Text</label>
                <button
                  onClick={() => setShowVariables(!showVariables)}
                  className="flex items-center gap-1 text-sm text-milo-red hover:text-milo-dark"
                >
                  {showVariables ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                  Variables
                </button>
              </div>

              {/* Variables Panel - Reorganized */}
              {showVariables && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                  <div className="space-y-4">
                    {Object.entries(availableVariables).map(([categoryKey, category]) => (
                      <div key={categoryKey} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                        <button
                          onClick={() => toggleVariableCategory(categoryKey)}
                          className="flex items-center justify-between w-full text-left mb-2 hover:text-gray-700"
                        >
                          <h4 className="text-sm font-semibold text-gray-700">
                            {category.title}
                          </h4>
                          <svg
                            className={`w-4 h-4 text-gray-500 transition-transform ${
                              expandedVariableCategories[categoryKey] ? '' : '-rotate-90'
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {expandedVariableCategories[categoryKey] && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {category.variables.map(variable => (
                              <button
                                key={variable.key}
                                onClick={() => insertVariable(variable.key)}
                                className="flex items-center justify-between p-2 text-xs bg-white border border-gray-200 rounded hover:border-milo-red hover:bg-red-50 transition-all group"
                              >
                                <div className="text-left flex-1">
                                  <div className="font-mono text-gray-700 text-xs break-all">
                                    {variable.key}
                                  </div>
                                  <div className="text-gray-500 text-xs mt-0.5">
                                    {variable.description}
                                  </div>
                                </div>
                                {copiedVariable === variable.key ? (
                                  <svg className="w-3 h-3 text-green-500 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-3 h-3 text-gray-400 group-hover:text-milo-red ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {!expandedVariableCategories[categoryKey] && (
                          <p className="text-xs text-gray-500 italic mt-1">
                            {category.variables.length} variables available
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                value={promptText}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 5000) {
                    setPromptText(value);
                  }
                }}
                placeholder="Enter your prompt here... Use variables like {user_name} or {training_plan_week_1} to insert training data."
                className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-milo-red resize-none"
                maxLength={5000}
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {promptText.length} / 5000 characters
              </div>

              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleSavePrompt}
                  disabled={!selectedPrompt || !promptText}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                  </svg>
                  Save Prompt
                </button>
                <button
                  onClick={handleExecutePrompt}
                  disabled={!promptText}
                  className="flex items-center gap-2 px-4 py-2 bg-milo-red text-white rounded-lg hover:bg-milo-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Execute with ChatGPT
                </button>
              </div>
            </div>

            {/* Prompt Improvement Section */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <label className="text-sm font-medium text-gray-700">Improve Prompt with AI</label>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Enter instructions to enhance the prompt above (e.g., "Make it more specific for endurance training analysis")
              </p>
              <textarea
                value={improvePromptText}
                onChange={(e) => setImprovePromptText(e.target.value)}
                placeholder="Describe how you want to improve the prompt..."
                className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
              />
              <button
                onClick={handleImprovePrompt}
                disabled={!improvePromptText || !promptText}
                className="mt-3 flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Generate Improved Version
              </button>
            </div>
          </div>
        </div>

        {/* Improved Prompt Modal */}
        {showImprovedPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Improved Prompt Suggestion</h3>
              <div className="p-4 bg-gray-50 rounded-lg mb-4 max-h-60 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">{improvedPromptSuggestion}</pre>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAcceptImprovedPrompt}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Replace Current
                </button>
                <button
                  onClick={handleSaveAsNewPrompt}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save as New
                </button>
                <button
                  onClick={() => setShowImprovedPrompt(false)}
                  className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ChatGPTPromptPanelRight;