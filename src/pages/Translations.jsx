import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';

import { 
  getTranslations,
  getOriginalTranslations,
  getLanguages, 
  getMyProposals, 
  createProposal, 
  deleteProposal,
  getProposalsCount,
  downloadTranslations,
  getScreens
} from '../services/api';

function Translations({ user }) {
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('de');
  const [translations, setTranslations] = useState({});
  const [englishTranslations, setEnglishTranslations] = useState({});
  const [originalTranslations, setOriginalTranslations] = useState({});
  const [originalGithubTranslations, setOriginalGithubTranslations] = useState({});
  const [editedValues, setEditedValues] = useState({});
  const [userProposals, setUserProposals] = useState({});
  const [pendingProposalsCount, setPendingProposalsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedScreens, setExpandedScreens] = useState(new Set());
  const [savingKeys, setSavingKeys] = useState(new Set());
  const [downloading, setDownloading] = useState(false);
  const [customScreens, setCustomScreens] = useState({});
  const [screensMap, setScreensMap] = useState(new Map()); // Map of screen name -> screen object
  const [unassignedKeys, setUnassignedKeys] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const scrollPositionRef = useRef(0);
  const shouldRestoreScrollRef = useRef(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('admin_translator');

  useEffect(() => {
    const loadData = async () => {
      await loadLanguages();
      await loadCustomScreenConfiguration();
      await loadEnglishTranslations();
      if (isAdmin) {
        await loadProposalsCount();
      }
    };
    loadData();
  }, [isAdmin]);

  useEffect(() => {
    if (selectedLanguage) {
      loadTranslations(selectedLanguage);
    }
  }, [selectedLanguage]);

  // Calculate unassigned keys when both translations and screens are loaded
  useEffect(() => {
    calculateUnassignedKeys();
  }, [translations, screensMap]);


  // Restore scroll position after content loads
  useEffect(() => {
    if (!loading && shouldRestoreScrollRef.current) {
      // Use setTimeout to ensure DOM has been updated
      setTimeout(() => {
        window.scrollTo(0, scrollPositionRef.current);
        shouldRestoreScrollRef.current = false;
      }, 0);
    }
  }, [loading]);

  // Note: Previously listened for localStorage changes, but now using database
  // Configuration changes will be reflected when user navigates between pages

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const results = [];
    const query = searchQuery.toLowerCase();

    // Helper function to get translation value
    const getTranslationValue = (obj, keyPath) => {
      return keyPath.split('.').reduce((current, part) => current?.[part], obj);
    };

    // Search through translations (flat structure)
    Object.entries(translations).forEach(([key, value]) => {
      const englishValue = String(getTranslationValue(englishTranslations, key) || '');
      const currentValue = String(value || '');

      // Check if query matches key, English translation, or current language translation
      if (
        key.toLowerCase().includes(query) ||
        englishValue.toLowerCase().includes(query) ||
        currentValue.toLowerCase().includes(query)
      ) {
        // Find which screen this key belongs to
        let screenName = '__unassigned__';
        if (Object.keys(customScreens).length > 0) {
          Object.entries(customScreens).forEach(([customScreenName, keySet]) => {
            if (keySet.has && keySet.has(key)) {
              screenName = customScreenName;
            }
          });
          if (unassignedKeys.includes(key)) {
            screenName = '__unassigned__';
          }
        }
        
        results.push({
          fullKey: key,
          englishValue,
          currentValue,
          screen: screenName,
          key
        });
      }
    });

    setSearchResults(results.slice(0, 10)); // Limit to 10 results
    setShowSearchResults(true);
  }, [searchQuery, translations, englishTranslations, selectedLanguage]);

  const loadProposalsCount = async () => {
    try {
      const res = await getProposalsCount();
      setPendingProposalsCount(res.data.count);
    } catch (err) {
      console.error('Error loading proposals count');
    }
  };

  const loadCustomScreenConfiguration = async () => {
    try {
      const response = await getScreens();
      const screens = response.data;
      
      // Create a map of screen name -> screen object for easy lookup
      const screenMap = new Map();
      const screenGroups = {};
      
      screens.forEach(screen => {
        screenMap.set(screen.name, screen);
        screenGroups[screen.name] = new Set(screen.keys || []);
      });
      
      setScreensMap(screenMap);
      setCustomScreens(screenGroups);
      
    } catch (error) {
      console.error('Error loading screens from database:', error);
      // On error, keep empty state - will trigger automatic screen generation
      setCustomScreens({});
      setScreensMap(new Map());
      setUnassignedKeys([]);
    }
  };

  const calculateUnassignedKeys = () => {
    if (Object.keys(translations).length > 0) {
      if (screensMap.size > 0) {
        // If we have screens, calculate which keys are not assigned
        const assignedKeys = new Set();
        screensMap.forEach(screen => {
          screen.keys?.forEach(key => assignedKeys.add(key));
        });
        
        const allKeys = Object.keys(translations);
        const unassigned = allKeys.filter(key => !assignedKeys.has(key));
        setUnassignedKeys(unassigned);
      } else {
        // Fallback: if no screens configured, all keys are unassigned
        setUnassignedKeys(Object.keys(translations));
      }
    } else {
      setUnassignedKeys([]);
    }
  };

  const loadLanguages = async () => {
    try {
      const res = await getLanguages();
      setLanguages(res.data.languages);
      if (res.data.languages.length > 0 && !selectedLanguage) {
        setSelectedLanguage(res.data.languages[0]);
      }
    } catch (err) {
      console.error('Error loading languages');
    }
  };

  const loadEnglishTranslations = async () => {
    try {
      const res = await getTranslations('en');
      setEnglishTranslations(res.data.content);
    } catch (err) {
      console.error('Error loading English translations');
    }
  };

  const loadTranslations = async (lang) => {
    try {
      setLoading(true);
      const res = await getTranslations(lang);
      const originalRes = await getOriginalTranslations(lang);
      const proposalsRes = await getMyProposals(lang);
      
      setOriginalTranslations(res.data.content);
      setOriginalGithubTranslations(originalRes.data.content);
      setTranslations(res.data.content);
      setUserProposals(proposalsRes.data);
      
      // Initialize edited values with proposals or originals (flat structure)
      const initialEditedValues = {};
      Object.entries(res.data.content).forEach(([key, value]) => {
        // For flat structure, we need to extract screen from the key or use a default
        const screenMatch = key.match(/^\[([^\]]+)\]/);
        const screen = screenMatch ? screenMatch[1] : 'common';
        
        if (!initialEditedValues[screen]) {
          initialEditedValues[screen] = {};
        }
        
        const proposalKey = `${lang}.${screen}.${key}`;
        const proposal = proposalsRes.data[proposalKey];
        // Only show pending proposals, not approved/rejected ones
        if (proposal && proposal.status === 'pending') {
          initialEditedValues[screen][key] = proposal.proposedValue;
        } else {
          initialEditedValues[screen][key] = value;
        }
      });
      setEditedValues(initialEditedValues);
      
    } catch (err) {
      console.error('Error loading translations');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = async () => {
  try {
    setDownloading(true);
    
    // Create a new ZIP file
    const zip = new JSZip();
    
    // Download each language and add to ZIP
    for (const lang of languages) {
      try {
        // Get the translations with approved proposals merged
        const response = await downloadTranslations(lang);
        
        // response.data now contains the JSON object directly
        // Add file to ZIP with proper formatting
        zip.file(`${lang}.json`, JSON.stringify(response.data, null, 2));
        
      } catch (err) {
        console.error(`Error downloading ${lang} translations:`, err);
        alert(`Error downloading ${lang} translations`);
      }
    }
    
    // Generate the ZIP file
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9
      }
    });
    
    // Create download link
    const url = window.URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translations-${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
  } catch (err) {
    console.error('Error downloading translations:', err);
    alert('Error downloading translations');
  } finally {
    setDownloading(false);
  }
};


  const handleLanguageChange = (lang) => {
    // Don't change if it's the same language
    if (lang === selectedLanguage) return;
    
    // Check if there are unsaved changes
    if (countModified() > 0) {
      if (!confirm(`You have ${countModified()} unsaved changes. Are you sure you want to switch languages?`)) {
        return;
      }
    }
    
    // Save current scroll position before language change
    scrollPositionRef.current = window.scrollY;
    shouldRestoreScrollRef.current = true;
    
    setSelectedLanguage(lang);
  };

  const handleTranslationChange = (screen, key, value) => {
    setEditedValues(prev => ({
      ...prev,
      [screen]: {
        ...prev[screen],
        [key]: value
      }
    }));
  };

  const isModified = (screen, key) => {
    const proposalKey = `${selectedLanguage}.${screen}.${key}`;
    const proposal = userProposals[proposalKey];
    const originalValue = translations[key] || '';
    const currentValue = editedValues[screen]?.[key] || originalValue;
    
    // If there's a pending proposal, compare against the proposal value
    if (proposal && proposal.status === 'pending') {
      return currentValue !== proposal.proposedValue;
    }
    
    // If no pending proposal, compare against original translation value
    return currentValue !== originalValue;
  };

  const handleSaveTranslation = async (customScreen, key) => {
    // Handle unassigned keys - they cannot be saved as proposals without a screen
    if (customScreen === '__unassigned__') {
      alert('Cannot save proposals for unassigned keys. Please assign this key to a screen first.');
      return;
    }
    
    // Use the custom screen name as the screen for the proposal
    // This is the new organizational system that all users share
    const savingKey = `${selectedLanguage}.${customScreen}.${key}`;
    const proposedValue = editedValues[customScreen][key];
    
    setSavingKeys(prev => new Set([...prev, savingKey]));
    
    try {
      // Get the screen ID from the screens map
      const screen = screensMap.get(customScreen);
      if (!screen) {
        throw new Error(`Screen "${customScreen}" not found`);
      }
      
      await createProposal({
        language: selectedLanguage,
        screenId: screen._id,
        key,
        originalValue: originalTranslations[key],
        proposedValue: proposedValue
      });

      // Reload proposals to get the updated/new proposal
      const proposalsRes = await getMyProposals(selectedLanguage);
      setUserProposals(proposalsRes.data);
      
      // Update editedValues to match the saved proposal value
      // This ensures the save button disappears after successful save
      setEditedValues(prev => ({
        ...prev,
        [customScreen]: {
          ...prev[customScreen],
          [key]: proposedValue
        }
      }));
      
      // Reload proposals count if admin
      if (isAdmin) {
        loadProposalsCount();
      }

    } catch (err) {
      console.error('Error saving proposal:', err);
      alert('Error saving proposal');
    } finally {
      setSavingKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(savingKey);
        return newSet;
      });
    }
  };

  const handleDeleteProposal = async (proposalId, screen, key) => {
    if (!confirm('Are you sure you want to delete this proposal?')) return;
    
    try {
      await deleteProposal(proposalId);
      
      // Reload proposals
      const proposalsRes = await getMyProposals(selectedLanguage);
      setUserProposals(proposalsRes.data);
      
      // Reset edited value to current translation (which includes approved)
      setEditedValues(prev => ({
        ...prev,
        [screen]: {
          ...prev[screen],
          [key]: translations[key]
        }
      }));
      
      // Reload proposals count if admin
      if (isAdmin) {
        loadProposalsCount();
      }
    } catch (err) {
      console.error('Error deleting proposal:', err);
      alert('Error deleting proposal');
    }
  };

  const toggleScreen = (screen) => {
    setExpandedScreens(prev => {
      const newSet = new Set(prev);
      if (newSet.has(screen)) {
        newSet.delete(screen);
      } else {
        newSet.add(screen);
      }
      return newSet;
    });
  };

  const getScreenInfo = (screen) => {
    const screenInfo = {
      'common': {
        name: 'Common Components',
        description: 'Shared UI elements, buttons, and general interface text',
        icon: '🔧',
        category: 'Core'
      },
      'onboarding': {
        name: 'User Onboarding',
        description: 'Initial setup flow, goal selection, and training preferences',
        icon: '🚀',
        category: 'User Experience'
      },
      'dashboard': {
        name: 'Dashboard & Overview',
        description: 'Main dashboard, progress tracking, and user greetings',
        icon: '📊',
        category: 'User Experience'
      },
      'profile': {
        name: 'User Profile',
        description: 'Profile information, settings, and personal data',
        icon: '👤',
        category: 'User Experience'
      },
      'events': {
        name: 'Events & Registration',
        description: 'Event management, registration details, and status tracking',
        icon: '🏃‍♂️',
        category: 'Events'
      },
      'training': {
        name: 'Training Sessions',
        description: 'Training plans, workout logging, and exercise feedback',
        icon: '💪',
        category: 'Training'
      },
      'chat': {
        name: 'Milo Coach Chat',
        description: 'AI coach interactions and conversational interface',
        icon: '💬',
        category: 'AI Coach'
      },
      // Legacy screen mappings for backwards compatibility
      'training_area_base': {
        name: 'Training Area - Base',
        description: 'Basic training area functionality',
        icon: '🏋️‍♂️',
        category: 'Training'
      },
      'training_area_pre_race': {
        name: 'Training Area - Pre Race',
        description: 'Pre-race training preparations',
        icon: '🏁',
        category: 'Training'
      },
      'training_area_post_race': {
        name: 'Training Area - Post Race',
        description: 'Post-race recovery and analysis',
        icon: '🎯',
        category: 'Training'
      },
      'emails': {
        name: 'Email Templates',
        description: 'Email notifications and communication templates',
        icon: '📧',
        category: 'Communication'
      }
    };
    
    return screenInfo[screen] || {
      name: screen.charAt(0).toUpperCase() + screen.slice(1),
      description: 'Screen translations',
      icon: '📝',
      category: 'Other'
    };
  };

  const getScreensByCategory = () => {
    const categories = {};
    
    // Add custom screens if any exist
    if (Object.keys(customScreens).length > 0) {
      categories['Screens'] = Object.keys(customScreens);
    }
    
    // Always add unassigned section if there are unassigned keys
    // This includes the fallback case where no screens are configured
    if (unassignedKeys && unassignedKeys.length > 0) {
      categories['Unassigned Keys'] = ['__unassigned__'];
    }
    
    return categories;
  };

  const getLanguageFlag = (lang) => {
    const flags = {
      'en': '🇬🇧',
      'es': '🇪🇸',
      'de': '🇩🇪',
      'fr': '🇫🇷',
      'it': '🇮🇹'
    };
    return flags[lang] || '🌐';
  };

  const countModified = () => {
    let count = 0;
    Object.keys(editedValues).forEach(screen => {
      Object.keys(editedValues[screen] || {}).forEach(key => {
        if (isModified(screen, key)) {
          count++;
        }
      });
    });
    return count;
  };

  const scrollToTranslation = (screen, key) => {
    const fullKey = key;
    let targetScreen = screen;
    
    // Find which screen contains this translation
    if (Object.keys(customScreens).length > 0) {
      // Look through custom screens
      Object.entries(customScreens).forEach(([customScreenName, keySet]) => {
        if (keySet.has && keySet.has(key)) {
          targetScreen = customScreenName;
        }
      });
      
      // Check if it's unassigned
      if (unassignedKeys.includes(key)) {
        targetScreen = '__unassigned__';
      }
    }
    
    // Expand the target screen
    setExpandedScreens(prev => new Set([...prev, targetScreen]));
    
    // Close search results
    setShowSearchResults(false);
    setSearchQuery('');
    
    // Scroll to the translation
    setTimeout(() => {
      const element = document.getElementById(`translation-${fullKey}`);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        element.classList.add('bg-yellow-100', 'border-yellow-400');
        setTimeout(() => {
          element.classList.remove('bg-yellow-100', 'border-yellow-400');
        }, 2000);
      }
    }, 300);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b bg-white p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Translations</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 font-medium">Language:</span>
              <div className="flex flex-wrap gap-2">
                {languages.map(lang => (
                  <button
                    key={lang}
                    disabled
                    className={`px-4 py-2 rounded-lg font-medium opacity-50 cursor-not-allowed ${
                      selectedLanguage === lang
                        ? 'bg-milo-red text-white shadow-md'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="mr-2">{getLanguageFlag(lang)}</span>
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Loading translations...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="bg-white p-6">
        <div className="space-y-4">
          {/* Title and Search */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Translations</h1>
            
            {/* Search Bar */}
            <div className="relative" ref={searchRef}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search keys, English, or current language..."
                className="w-80 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-milo-red focus:border-milo-red"
              />
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => scrollToTranslation(result.screen, result.key)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-mono text-xs text-gray-500 mb-1">
                        {result.fullKey}
                      </div>
                      <div className="text-sm text-gray-700 mb-1">
                        <strong>EN:</strong> {result.englishValue}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>{selectedLanguage.toUpperCase()}:</strong> {result.currentValue}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* No Results */}
              {showSearchResults && searchResults.length === 0 && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 px-4 py-3 text-gray-500 text-sm">
                  No results found
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>


      {/* Sticky language selector */}
      <div className="sticky top-0 z-10 bg-white px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {languages.map(lang => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 ${
                  selectedLanguage === lang
                    ? 'bg-milo-red text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{getLanguageFlag(lang)}</span>
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          
        </div>
      </div>

      {/* Translations content */}
      <div className="p-6">
        <div className="space-y-6">
          {Object.entries(getScreensByCategory()).map(([category, screens]) => (
            <div key={category} className="space-y-3">
              {/* Category header - only show for non-custom screens */}
              {category !== 'Screens' && category !== 'Unassigned Keys' && (
                <div className="border-b border-gray-200 pb-2">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <span className="w-8 h-8 bg-gradient-to-r from-milo-red to-milo-dark rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {screens.length}
                    </span>
                    {category}
                  </h3>
                </div>
              )}
              
              {/* Screens in category */}
              <div className="space-y-3">
                {screens.map(screen => {
                  // Check if this is the special unassigned screen
                  const isUnassignedScreen = screen === '__unassigned__';
                  
                  // Check if this is a custom screen or original screen
                  const isCustomScreen = customScreens[screen];
                  const screenInfo = getScreenInfo(screen);
                  
                  // For unassigned screen, get keys from the unassigned configuration
                  let screenKeys = [];
                  if (isUnassignedScreen) {
                    screenKeys = unassignedKeys.map(key => ({
                      key: key,
                      originalScreen: '__unassigned__',
                      fullKey: key
                    }));
                  } else {
                    // For custom screens, get keys from the custom configuration
                    screenKeys = isCustomScreen 
                      ? Array.from(customScreens[screen]).map(key => ({
                          key: key,
                          originalScreen: screen,
                          fullKey: key
                        }))
                      : Object.keys(translations[screen] || {}).map(key => ({
                          key,
                          originalScreen: screen,
                          fullKey: key
                        }));
                  }
                      
                  return (
                    <div key={screen} id={`screen-${screen}`} className="bg-white rounded-lg shadow-sm border border-gray-200">
                      {/* Screen header */}
                      <button
                        onClick={() => toggleScreen(screen)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-gray-900">
                                {isUnassignedScreen ? 'Unassigned Keys' : (isCustomScreen ? screen : screenInfo.name)}
                              </span>
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                {screenKeys.length} keys
                              </span>
                            </div>
                            {!isUnassignedScreen && !isCustomScreen && (
                              <p className="text-sm text-gray-500 mt-1">
                                {screenInfo.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            expandedScreens.has(screen) ? 'rotate-90' : ''
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>

                      {/* Screen translations */}
                      {expandedScreens.has(screen) && (
                        <div className="border-t border-gray-100">
                          <div className="divide-y divide-gray-50">
                            {screenKeys.map(({ key, originalScreen, fullKey }) => {
                              // Get values for both languages
                              const getTranslationValue = (obj, keyPath) => {
                                return keyPath.split('.').reduce((current, part) => current?.[part], obj);
                              };
                              
                              const englishValue = getTranslationValue(englishTranslations, key) || '';
                              const currentTranslationValue = getTranslationValue(translations, key) || '';
                              
                              // Use the custom screen name for proposal lookup
                              const proposalKey = `${selectedLanguage}.${originalScreen}.${key}`;
                              const proposal = userProposals[proposalKey];
                              const hasPendingProposal = proposal && proposal.status === 'pending';
                              const modified = isModified(originalScreen, key);
                              const isSaving = savingKeys.has(proposalKey);
                              const currentValue = editedValues[originalScreen]?.[key] || currentTranslationValue;
                              
                              // Check if current translation (with approved proposals) differs from original GitHub version
                              const originalGithubValue = originalGithubTranslations[key] || '';
                              const currentDisplayedValue = translations[key] || '';
                              const isDifferentFromOriginal = currentDisplayedValue !== originalGithubValue;
                              
                              return (
                                <div key={fullKey} id={`translation-${fullKey}`} className="px-6 py-4 transition-colors duration-300">
                                  <div className="mb-3">
                                    {/* English translation with key on right */}
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                      <div className="flex items-start gap-2 flex-1">
                                        {isDifferentFromOriginal && (
                                          <div className="w-2 h-2 bg-red-500 rounded-full mt-1 flex-shrink-0" title="Translation differs from original GitHub version"></div>
                                        )}
                                        <span className="text-sm font-bold text-gray-700 break-words">
                                          {englishValue}
                                        </span>
                                      </div>
                                      <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 flex-shrink-0">
                                        {key}
                                      </span>
                                    </div>
                                    
                                    {hasPendingProposal && (
                                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                        <div className="flex items-center justify-between">
                                          <span className="text-yellow-700">
                                            <strong>Your proposal:</strong> "{proposal.proposedValue}"
                                          </span>
                                          <button
                                            onClick={() => handleDeleteProposal(proposal._id, originalScreen, key)}
                                            className="text-red-500 hover:text-red-700 underline ml-3"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Editable translation for selected language */}
                                  <div className="flex items-start space-x-3">
                                    <textarea
                                      value={currentValue}
                                      onChange={(e) => handleTranslationChange(originalScreen, key, e.target.value)}
                                      className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-milo-red focus:border-milo-red resize-none ${
                                        hasPendingProposal && !modified ? 'border-yellow-400 bg-yellow-50' : 
                                        modified ? 'border-orange-400 bg-orange-50' : 
                                        'border-gray-300'
                                      }`}
                                      rows={Math.max(Math.ceil(currentValue.length / 80), 1)}
                                      placeholder={`Enter ${selectedLanguage.toUpperCase()} translation...`}
                                    />
                                    {modified && (
                                      <button
                                        onClick={() => handleSaveTranslation(originalScreen, key)}
                                        disabled={isSaving}
                                        className={`px-4 py-2 text-white text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                                          isSaving 
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : 'bg-milo-red hover:bg-milo-dark'
                                        }`}
                                      >
                                        {isSaving ? 'Saving...' : 'Save Proposal'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Unsaved changes indicator */}
        {countModified() > 0 && (
          <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg shadow-lg z-10">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{countModified()} unsaved change{countModified() > 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Translations;