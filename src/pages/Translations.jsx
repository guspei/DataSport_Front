import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  getTranslations,
  getOriginalTranslations,
  getLanguages,
  getMyProposals,
  createProposal,
  deleteProposal,
  getProposalsCount,
  downloadTranslations,
  downloadTranslationsWithStructure,
  downloadTranslationsWithStructureZip,
  updateTranslation,
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
  const [initialValues, setInitialValues] = useState({}); // Track initial values for comparison
  const [userProposals, setUserProposals] = useState({});
  const [pendingProposalsCount, setPendingProposalsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [expandedScreens, setExpandedScreens] = useState(new Set());
  const [savingKeys, setSavingKeys] = useState(new Set());
  const [downloading, setDownloading] = useState(false);
  const [customScreens, setCustomScreens] = useState({});
  const [screensMap, setScreensMap] = useState(new Map()); // Map of screen name -> screen object
  const [unassignedKeys, setUnassignedKeys] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);
  const [filesMetadata, setFilesMetadata] = useState({}); // New: Store file metadata
  const scrollPositionRef = useRef(0);
  const shouldRestoreScrollRef = useRef(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('admin_translator');

  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);
      // Load in parallel for better performance
      const promises = [
        loadLanguages(),
        loadCustomScreenConfiguration(),
        loadEnglishTranslations()
      ];

      if (isAdmin) {
        promises.push(loadProposalsCount());
      }

      await Promise.all(promises);
      setInitialLoading(false);
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


  // Auto-resize all textareas when content changes
  useEffect(() => {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
      autoResizeTextarea(textarea);
    });
  }, [editedValues]);

  // Helper function to flatten nested object into dot-notation keys
  const flattenObject = (obj, prefix = '') => {
    const flattened = {};

    if (!obj || typeof obj !== 'object') {
      console.log('flattenObject: invalid input', { obj, type: typeof obj });
      return flattened;
    }

    Object.keys(obj).forEach(key => {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(flattened, flattenObject(obj[key], newKey));
      } else {
        // Convert to string to avoid React rendering issues
        flattened[newKey] = String(obj[key] || '');
      }
    });

    return flattened;
  };

  // Helper function to find which file contains a specific key
  const findFileForKey = (files, key) => {
    if (!files || !key) return null;

    // Try to match the key to a file based on the first part of the key
    const keyParts = key.split('.');
    const possibleFileName = `${keyParts[0]}.json`;

    // Look for the file in metadata
    const fileInfo = files[possibleFileName];
    if (fileInfo) {
      return {
        fileName: possibleFileName,
        ...fileInfo
      };
    }

    // If not found by name, could implement more sophisticated matching
    return null;
  };

  // Helper function for safe translation access
  const getTranslationByPath = (translations, path, fallback = '') => {
    if (!path) return fallback;
    return path.split('.').reduce((obj, key) => obj?.[key], translations) || fallback;
  };


  // Helper function to get nested value using dot notation
  const getNestedValue = (obj, keyPath) => {
    return keyPath.split('.').reduce((current, part) => current?.[part], obj);
  };

  // Helper function to set nested value using dot notation
  const setNestedValue = (obj, keyPath, value) => {
    const keys = keyPath.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  };

  // Helper function to auto-resize textarea with perfect sizing
  const autoResizeTextarea = (element) => {
    if (element) {
      // Reset height to auto to get accurate scrollHeight
      element.style.height = 'auto';
      // Set height to scrollHeight but ensure minimum height of 60px
      const newHeight = Math.max(element.scrollHeight, 60);
      element.style.height = newHeight + 'px';
      // Ensure no scroll bars
      element.style.overflow = 'hidden';
    }
  };

  // Helper function to insert text at cursor position in textarea
  const insertTextAtCursor = (textarea, text) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const newValue = value.substring(0, start) + text + value.substring(end);

    // Update the value
    const originalScreen = htmlEditingKey.split('.')[0];
    const key = htmlEditingKey.split('.').slice(1).join('.');
    handleTranslationChange(originalScreen, key, newValue);

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
      autoResizeTextarea(textarea);
    }, 0);
  };

  // Save current translation
  const saveCurrentTranslation = async (originalScreen, key) => {
    console.log('🚀 saveCurrentTranslation called with:', { originalScreen, key });
    const translationKey = `${originalScreen}.${key}`;
    setSavingKeys(prev => new Set([...prev, translationKey]));

    try {
      // Get the current edited value, not the original translation
      const currentValue = editedValues[originalScreen]?.[key] || '';

      if (!currentValue) {
        alert('No changes to save');
        return;
      }

      // Get the original value for comparison
      const flatOriginalTranslations = flattenObject(originalTranslations);
      const originalValue = flatOriginalTranslations[key] || '';

      // Determine if this is a real screen or unassigned
      const isUnassignedKey = originalScreen === '__unassigned__';
      let proposalData = {
        language: selectedLanguage,
        key,
        originalValue,
        proposedValue: currentValue
      };

      // Add screenId if this is from a real screen (not unassigned)
      if (!isUnassignedKey) {
        // Find the screen ID from the screensMap
        const screen = screensMap.get(originalScreen);
        if (screen && screen._id) {
          proposalData.screenId = screen._id;
        }
      }

      console.log('Creating proposal:', {
        originalScreen,
        key,
        selectedLanguage,
        currentValue,
        originalValue,
        isUnassignedKey,
        screenId: proposalData.screenId,
        proposalData
      });

      console.log('About to create proposal with data:', proposalData);

      const createResponse = await createProposal(proposalData);

      console.log('Proposal created successfully:', createResponse.data);

      // Refresh proposals count and data
      if (window.refreshProposalsCount) {
        await window.refreshProposalsCount();
      }

      // Reload user proposals to see the new one
      const proposalsRes = await getMyProposals(selectedLanguage);
      console.log('📋 Proposals after save:', proposalsRes.data);
      setUserProposals(proposalsRes.data);

      // Clear the edited value since it's now saved as a proposal
      setEditedValues(prev => {
        const newValues = { ...prev };
        if (newValues[originalScreen]) {
          const updatedScreen = { ...newValues[originalScreen] };
          delete updatedScreen[key];

          // If screen has no more edits, remove it completely
          if (Object.keys(updatedScreen).length === 0) {
            delete newValues[originalScreen];
          } else {
            newValues[originalScreen] = updatedScreen;
          }
        }
        return newValues;
      });

      // Success - proposal created (no annoying alert)
    } catch (err) {
      console.error('❌ Error saving translation:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config,
        originalScreen,
        key,
        translationKey,
        proposalData: {
          language: selectedLanguage,
          key,
          originalValue: flattenObject(originalTranslations)[key],
          proposedValue: editedValues[originalScreen]?.[key]
        }
      });

      // Show user-friendly error message
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      alert(`Error creando propuesta: ${errorMessage}`);
    } finally {
      setSavingKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(translationKey);
        return newSet;
      });
    }
  };

  // Helper function to render HTML safely (basic HTML only)
  const renderSafeHTML = (html) => {
    // Basic sanitization - only allow specific tags
    const allowedTags = ['br', 'b', 'strong', 'ul', 'ol', 'li', 'a'];
    const div = document.createElement('div');
    div.innerHTML = html;

    // Remove any tags not in allowed list
    const allElements = div.querySelectorAll('*');
    for (let element of allElements) {
      if (!allowedTags.includes(element.tagName.toLowerCase())) {
        element.outerHTML = element.innerHTML;
      }
    }

    return div.innerHTML;
  };



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

  // Debounced search function
  const performSearch = useCallback(() => {
    const query = searchQuery.toLowerCase();
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Use setTimeout to simulate async processing and avoid blocking UI
    setTimeout(() => {
      const results = [];

      // Flatten both translations objects for searching
      const flatTranslations = flattenObject(translations);
      const flatEnglishTranslations = flattenObject(englishTranslations);

      // Search through flattened translations
      Object.entries(flatTranslations).forEach(([key, value]) => {
        const englishValue = String(flatEnglishTranslations[key] || '');
        const currentValue = String(value || '');

        // Check if query matches key, English translation, or current language translation
        if (
          key.toLowerCase().includes(query) ||
          englishValue.toLowerCase().includes(query) ||
          currentValue.toLowerCase().includes(query)
        ) {
          // Find which screen this key belongs to
          let screenName = key.split('.')[0]; // First part is the screen/section

          // Check if it's in custom screens or unassigned
          if (Object.keys(customScreens).length > 0) {
            let found = false;
            Object.entries(customScreens).forEach(([customScreenName, keySet]) => {
              if (keySet.has && keySet.has(key)) {
                screenName = customScreenName;
                found = true;
              }
            });
            if (!found && unassignedKeys.includes(key)) {
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
      setIsSearching(false);
    }, 0);
  }, [searchQuery, translations, englishTranslations, customScreens, unassignedKeys]);

  // Search functionality with debouncing
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch();
    }, 300); // 300ms delay

    // Cleanup
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, performSearch]);

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
      // Flatten the nested translations to get all dot-notation keys
      const flatTranslations = flattenObject(translations);

      if (screensMap.size > 0) {
        // If we have screens, calculate which keys are not assigned
        const assignedKeys = new Set();
        screensMap.forEach(screen => {
          screen.keys?.forEach(key => assignedKeys.add(key));
        });

        const allKeys = Object.keys(flatTranslations);
        const unassigned = allKeys.filter(key => !assignedKeys.has(key));

        console.log('calculateUnassignedKeys - with screens:', {
          allKeysCount: allKeys.length,
          assignedKeysCount: assignedKeys.size,
          unassignedCount: unassigned.length,
          screensMapSize: screensMap.size
        });

        setUnassignedKeys(unassigned);
      } else {
        // Fallback: if no screens configured, all keys are unassigned
        const allKeys = Object.keys(flatTranslations);

        console.log('calculateUnassignedKeys - fallback:', {
          allKeysCount: allKeys.length,
          translationsKeys: Object.keys(translations)
        });

        setUnassignedKeys(allKeys);
      }
    } else {
      console.log('calculateUnassignedKeys - no translations');
      setUnassignedKeys([]);
    }
  };

  const loadLanguages = async () => {
    try {
      const res = await getLanguages();
      setLanguages(res.data.languages);
      // Only set language if not already set, prioritize 'de' if available
      if (res.data.languages.length > 0 && selectedLanguage === 'de') {
        // Keep 'de' if it exists in the available languages, otherwise use first
        if (!res.data.languages.includes('de')) {
          setSelectedLanguage(res.data.languages[0]);
        }
      } else if (res.data.languages.length > 0 && !selectedLanguage) {
        // If no language selected, prefer 'de' if available
        if (res.data.languages.includes('de')) {
          setSelectedLanguage('de');
        } else {
          setSelectedLanguage(res.data.languages[0]);
        }
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
      // Load all data in parallel for better performance
      const [res, originalRes, proposalsRes] = await Promise.all([
        getTranslations(lang),
        getOriginalTranslations(lang),
        getMyProposals(lang)
      ]);

      console.log('loadTranslations for', lang, ':', {
        translationsKeys: Object.keys(res.data.content),
        flattenedCount: Object.keys(flattenObject(res.data.content)).length,
        fullResponse: res.data,
        contentSample: Object.keys(res.data.content).slice(0, 3).map(key => ({
          key,
          type: typeof res.data.content[key],
          keys: typeof res.data.content[key] === 'object' ? Object.keys(res.data.content[key]).slice(0, 3) : null
        })),
        filesMetadata: res.data.files // Log the new metadata
      });

      setOriginalTranslations(res.data.content);
      setOriginalGithubTranslations(originalRes.data.content);
      setTranslations(res.data.content);
      setFilesMetadata(res.data.files || {}); // Store file metadata

      console.log('📋 User proposals loaded:', proposalsRes.data);
      setUserProposals(proposalsRes.data);

      // Initialize edited values with proposals or originals (nested structure)
      const initialEditedValues = {};
      const initialValuesSnapshot = {}; // This will store the initial state for comparison
      const flatTranslations = flattenObject(res.data.content);

      Object.entries(flatTranslations).forEach(([key, value]) => {
        // Extract screen from the key (first part before dot)
        const screen = key.split('.')[0];

        if (!initialEditedValues[screen]) {
          initialEditedValues[screen] = {};
          initialValuesSnapshot[screen] = {};
        }

        // The proposal key should be: language.screen.fullKey
        // where fullKey already contains the screen prefix
        const proposalKey = `${lang}.${screen}.${key}`;
        const proposal = proposalsRes.data[proposalKey];

        // Debug specific keys
        if (key.includes('today_training')) {
          console.log('🔍 Checking proposal on load:', {
            key,
            screen,
            proposalKey,
            proposal,
            hasProposal: !!proposal,
            proposalStatus: proposal?.status
          });
        }

        // Determine the initial value to display
        let displayValue = value;
        if (proposal && proposal.status === 'pending') {
          displayValue = proposal.proposedValue;
        }

        // Set both edited values and initial snapshot
        initialEditedValues[screen][key] = displayValue;
        initialValuesSnapshot[screen][key] = displayValue; // Store the same value as initial reference
      });

      setEditedValues(initialEditedValues);
      setInitialValues(initialValuesSnapshot); // Store the initial state
      
    } catch (err) {
      console.error('Error loading translations');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    try {
      setDownloading(true);

      // Use the ZIP endpoint that returns a binary blob
      const response = await downloadTranslationsWithStructureZip();

      // The response.data is already a Blob
      const blob = response.data;

      // Create URL from blob
      const url = window.URL.createObjectURL(blob);

      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `translations-structure-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error('Error downloading translations structure:', err);
      alert('Error downloading translations ZIP file');
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
    console.log('✏️ handleTranslationChange:', { screen, key, value });
    setEditedValues(prev => {
      const newState = {
        ...prev,
        [screen]: {
          ...prev[screen],
          [key]: value
        }
      };
      console.log('📝 Updated editedValues:', newState);
      return newState;
    });
  };

  const isModified = (screen, key) => {
    // Use the correct proposal key based on screen type
    let proposalKey;
    if (screen === '__unassigned__') {
      proposalKey = `${selectedLanguage}.unassigned.${key}`;
    } else {
      proposalKey = `${selectedLanguage}.${screen}.${key}`;
    }
    const proposal = userProposals[proposalKey];

    // Get the original value from nested structure
    const flatTranslations = flattenObject(translations);
    const originalValue = flatTranslations[key] || '';
    const currentValue = editedValues[screen]?.[key] || originalValue;

    const result = (() => {
      // If there's a pending proposal, compare against the proposal value
      if (proposal && proposal.status === 'pending') {
        return currentValue !== proposal.proposedValue;
      }

      // If no pending proposal, compare against original translation value
      return currentValue !== originalValue;
    })();

    // Only log when there's actually a modification (and limit logging)
    if (result && Math.random() < 0.1) { // Only log 10% of the time to reduce spam
      console.log(`🔍 isModified(${screen}, ${key}):`, {
        proposalKey,
        originalValue,
        currentValue,
        editedValue: editedValues[screen]?.[key],
        hasProposal: !!proposal,
        result
      });
    }

    return result;
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
      
      // Get original value from nested structure
      const flatOriginalTranslations = flattenObject(originalTranslations);

      await createProposal({
        language: selectedLanguage,
        screenId: screen._id,
        key,
        originalValue: flatOriginalTranslations[key],
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
      
      // Reload proposals count for all users (to update sidebar)
      if (window.refreshProposalsCount) {
        window.refreshProposalsCount();
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
      const flatTranslations = flattenObject(translations);
      setEditedValues(prev => ({
        ...prev,
        [screen]: {
          ...prev[screen],
          [key]: flatTranslations[key]
        }
      }));
      
      // Reload proposals count for all users (to update sidebar)
      if (window.refreshProposalsCount) {
        window.refreshProposalsCount();
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
    if (unassignedKeys && unassignedKeys.length > 0) {
      categories['Unassigned Keys'] = ['__unassigned__'];
    }

    // Debug logging

    return categories;
  };

  const getLanguageFlag = (lang) => {
    const flags = {
      'en': '🇬🇧',
      'EN': '🇬🇧',
      'es': '🇪🇸',
      'ES': '🇪🇸',
      'de': '🇩🇪',
      'DE': '🇩🇪',
      'fr': '🇫🇷',
      'FR': '🇫🇷',
      'it': '🇮🇹',
      'IT': '🇮🇹',
      'pt': '🇵🇹',
      'PT': '🇵🇹'
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

  if (initialLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b bg-white p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Translations</h1>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-milo-red"></div>
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
                className="w-80 px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-milo-red focus:border-milo-red"
              />

              {/* Search loading indicator */}
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-milo-red"></div>
                </div>
              )}
              
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
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 ${
                  selectedLanguage === lang
                    ? 'bg-milo-red text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="mr-2">{getLanguageFlag(lang)}</span>
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-milo-red"></div>
              <span>Loading {selectedLanguage.toUpperCase()} translations...</span>
            </div>
          )}
        </div>
      </div>

      {/* Translations content */}
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-milo-red"></div>
            <div className="text-gray-600">Loading {selectedLanguage.toUpperCase()} translations...</div>
          </div>
        ) : (
        <div className="space-y-6">
          {(() => {
            const categories = getScreensByCategory();
            return Object.entries(categories).map(([category, screens]) => (
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
                  } else if (isCustomScreen) {
                    // For custom screens, get keys from the custom configuration
                    screenKeys = Array.from(customScreens[screen]).map(key => ({
                      key: key,
                      originalScreen: screen,
                      fullKey: key
                    }));
                  } else {
                    // For sections from nested structure, flatten and get keys
                    const sectionData = translations[screen] || {};
                    const flatSection = flattenObject(sectionData, screen);
                    screenKeys = Object.keys(flatSection).map(key => ({
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
                              // Get values for both languages using flattened objects
                              const flatEnglishTranslations = flattenObject(englishTranslations);
                              const flatTranslations = flattenObject(translations);
                              const flatOriginalGithubTranslations = flattenObject(originalGithubTranslations);

                              const englishValue = String(flatEnglishTranslations[key] || '');
                              const currentTranslationValue = String(flatTranslations[key] || '');

                              // Use the correct proposal key based on screen type
                              let proposalKey;
                              if (originalScreen === '__unassigned__') {
                                proposalKey = `${selectedLanguage}.unassigned.${key}`;
                              } else {
                                proposalKey = `${selectedLanguage}.${originalScreen}.${key}`;
                              }

                              const proposal = userProposals[proposalKey];
                              const hasPendingProposal = proposal && proposal.status === 'pending';

                              // Debug log for testing - check all proposal keys format
                              if (Object.keys(userProposals).length > 0 && Math.random() < 0.01) {
                                console.log('📦 Sample proposal keys:', Object.keys(userProposals).slice(0, 3));
                              }

                              // Debug specific keys
                              if (key.includes('today_training') && Math.random() < 0.5) {
                                console.log('🔍 Checking proposal in render:', {
                                  originalScreen,
                                  key,
                                  proposalKey,
                                  proposal,
                                  hasPendingProposal,
                                  userProposalsKeys: Object.keys(userProposals).filter(k => k.includes(key.split('.').pop()))
                                });
                              }
                              const modified = isModified(originalScreen, key);
                              const isSaving = savingKeys.has(proposalKey);
                              const currentValue = editedValues[originalScreen]?.[key] || currentTranslationValue;

                              // Get the initial value from when the page loaded
                              const initialValue = initialValues[originalScreen]?.[key] || currentTranslationValue;

                              // Check if we should show the save button
                              // Only show button when the current value differs from what was initially in the field
                              const shouldShowSaveButton = currentValue !== initialValue;

                              // Debug the button visibility logic
                              if (key.includes('today_training') && Math.random() < 0.3) {
                                console.log('🔘 Button visibility check:', {
                                  key,
                                  shouldShowSaveButton,
                                  hasPendingProposal,
                                  currentValue: currentValue?.substring(0, 50),
                                  initialValue: initialValue?.substring(0, 50),
                                  proposalValue: proposal?.proposedValue?.substring(0, 50),
                                  originalValue: currentTranslationValue?.substring(0, 50)
                                });
                              }

                              // Check if current translation (with approved proposals) differs from original GitHub version
                              const originalGithubValue = String(flatOriginalGithubTranslations[key] || '');
                              const currentDisplayedValue = String(flatTranslations[key] || '');
                              const isDifferentFromOriginal = currentDisplayedValue !== originalGithubValue;
                              
                              return (
                                <div key={fullKey} id={`translation-${fullKey}`} className="px-6 py-4 transition-colors duration-300">
                                  <div className="mb-3">
                                    {/* English translation with responsive layout */}
                                    <div className="mb-2">
                                      <div className="flex items-start gap-3">
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                          {isDifferentFromOriginal && (
                                            <div className="w-2 h-2 bg-red-500 rounded-full mt-1 flex-shrink-0" title="Translation differs from original GitHub version"></div>
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="text-sm font-bold text-gray-700 break-words" dangerouslySetInnerHTML={{ __html: englishValue }}></span>
                                              <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 flex-shrink-0 whitespace-nowrap">
                                                {key}
                                              </span>
                                            </div>

                                            {/* Show original GitHub translation when it differs */}
                                            {isDifferentFromOriginal && originalGithubValue && (
                                              <div className="mt-1 p-2 bg-gray-50 border-l-2 border-gray-300 rounded">
                                                <div className="text-xs text-gray-600">
                                                  <span className="font-semibold">Original ({selectedLanguage.toUpperCase()}):</span>
                                                  <span className="ml-2">{originalGithubValue}</span>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
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
                                  <div className="space-y-3">
                                    {/* Simple HTML Editor - Always active */}
                                    <div className="space-y-2">
                                      <div
                                        contentEditable
                                        suppressContentEditableWarning={true}
                                        ref={(el) => {
                                          if (el && el.innerHTML !== currentValue) {
                                            el.innerHTML = currentValue || '';
                                          }
                                        }}
                                        onInput={(e) => {
                                          const htmlContent = e.target.innerHTML;
                                          handleTranslationChange(originalScreen, key, htmlContent);
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' && !e.shiftKey) {
                                            // Let the browser handle Enter normally for line breaks
                                            // Only prevent default if we want custom behavior
                                            return;
                                          }
                                        }}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-milo-red focus:border-milo-red min-h-[60px] ${
                                          hasPendingProposal && !modified ? 'border-yellow-400 bg-yellow-50' :
                                          modified ? 'border-orange-400 bg-orange-50' :
                                          'border-gray-300'
                                        }`}
                                        style={{
                                          minHeight: '60px',
                                          overflow: 'auto'
                                        }}
                                      />

                                      {/* Save Button - Only when modified and appropriate */}
                                      {shouldShowSaveButton && (
                                        <div className="flex justify-end">
                                          <button
                                            onClick={() => saveCurrentTranslation(originalScreen, key)}
                                            disabled={isSaving}
                                            className={`px-4 py-2 text-xs font-medium rounded transition-colors ${
                                              isSaving
                                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                                : 'bg-milo-red text-white hover:bg-milo-dark'
                                            }`}
                                            title={hasPendingProposal ? "Actualizar Propuesta" : "Crear Propuesta de Traducción"}
                                          >
                                            {isSaving ? 'Creando...' : (hasPendingProposal ? 'Actualizar Propuesta' : 'Crear Propuesta')}
                                          </button>
                                        </div>
                                      )}

                                    </div>
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
          ));
          })()}
        </div>
        )}

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