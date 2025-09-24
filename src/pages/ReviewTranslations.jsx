import { useState, useEffect } from 'react';
import {
  getLanguages,
  getAllProposals,
  approveProposal,
  rejectProposal,
  getTranslations,
  downloadTranslationsWithStructure,
  downloadTranslationsWithStructureZip
} from '../services/api';

function ReviewTranslations() {
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('de');
  const [proposals, setProposals] = useState([]);
  const [groupedProposals, setGroupedProposals] = useState({});
  const [originalTranslations, setOriginalTranslations] = useState({});
  const [englishTranslations, setEnglishTranslations] = useState({});
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [expandedScreens, setExpandedScreens] = useState(new Set());
  const [processingIds, setProcessingIds] = useState(new Set());
  const [languageCounts, setLanguageCounts] = useState({});
  const [downloading, setDownloading] = useState(false);

  // Helper function to flatten nested object into dot-notation keys
  const flattenObject = (obj, prefix = '') => {
    const flattened = {};

    if (!obj || typeof obj !== 'object') {
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

  useEffect(() => {
    const loadInitialData = async () => {
      setInitialLoading(true);
      try {
        // Load in parallel for better performance
        await Promise.all([
          loadLanguages(),
          loadLanguageCounts()
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
        // Retry once after a short delay
        setTimeout(() => {
          console.log('Retrying initial data load...');
          loadLanguages();
          loadLanguageCounts();
        }, 1000);
      } finally {
        setInitialLoading(false);
      }
    };

    loadInitialData();

    // Auto-refresh proposals count every 30 seconds
    const interval = setInterval(() => {
      if (!loading) {
        loadLanguageCounts();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Add small delay to ensure component is mounted
    const timeoutId = setTimeout(() => {
      if (selectedLanguage && !initialLoading) {
        loadProposalsAndTranslations(selectedLanguage);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [selectedLanguage, initialLoading]);

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


  const loadLanguageCounts = async () => {
    try {
      const counts = {};
      const res = await getLanguages();
      
      for (const lang of res.data.languages) {
        try {
          const proposalsRes = await getAllProposals({ 
            language: lang, 
            status: 'pending' 
          });
          
          // Count unique keys with proposals (not total proposals)
          const uniqueKeys = new Set();
          proposalsRes.data.forEach(proposal => {
            const screenName = proposal.screen?.name || 'Unknown';
            const keyId = `${screenName}.${proposal.key}`;
            uniqueKeys.add(keyId);
          });
          
          counts[lang] = uniqueKeys.size;
        } catch (err) {
          counts[lang] = 0;
        }
      }
      
      setLanguageCounts(counts);
    } catch (err) {
      console.error('Error loading language counts');
    }
  };

  const loadProposalsAndTranslations = async (lang) => {
    if (!lang) {
      console.warn('No language specified for loading proposals');
      return;
    }

    try {
      setLoading(true);
      console.log(`🔄 Loading proposals for language: ${lang}`);

      // Load all data in parallel for better performance
      const promises = [
        getAllProposals({ language: lang, status: 'pending' }),
        getTranslations(lang)
      ];

      // Try to load English translations
      try {
        promises.push(getTranslations('en'));
      } catch (err) {
        console.log('English translations not available');
      }

      const results = await Promise.all(promises);
      const proposalsRes = results[0];
      const translationsRes = results[1];
      const englishRes = results[2];

      if (englishRes) {
        setEnglishTranslations(englishRes.data.content);
      } else {
        setEnglishTranslations({});
      }

      setProposals(proposalsRes.data);
      setOriginalTranslations(translationsRes.data.content);
      
      
      // Group proposals by screen name (from populated screen object)
      const grouped = {};
      proposalsRes.data.forEach(proposal => {
        // Try multiple ways to get screen name
        let screenName = 'Unassigned';
        if (proposal.screen?.name) {
          screenName = proposal.screen.name;
        } else if (proposal.screenId) {
          screenName = `Screen ${proposal.screenId}`;
        } else if (proposal.screen) {
          screenName = proposal.screen.toString();
        }

        const screenKey = `${screenName}.${proposal.key}`;
        
        
        if (!grouped[screenName]) {
          grouped[screenName] = {};
        }
        
        if (!grouped[screenName][screenKey]) {
          grouped[screenName][screenKey] = {
            key: proposal.key,
            originalValue: proposal.originalValue,
            proposals: []
          };
        }
        
        grouped[screenName][screenKey].proposals.push(proposal);
      });
      
      setGroupedProposals(grouped);
    } catch (err) {
      console.error('Error loading proposals:', err);

      // Show user-friendly error message
      if (err.response?.status === 401) {
        alert('Session expired. Please login again.');
      } else {
        // Retry once after delay
        console.log('Retrying proposals load...');
        setTimeout(() => {
          if (selectedLanguage === lang) {
            loadProposalsAndTranslations(lang);
          }
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProposal = async (proposalId, screen, key) => {
    setProcessingIds(prev => new Set([...prev, proposalId]));

    // Optimistic update: decrease count immediately for better UX
    setLanguageCounts(prev => ({
      ...prev,
      [selectedLanguage]: Math.max(0, (prev[selectedLanguage] || 0) - 1)
    }));

    try {
      await approveProposal(proposalId);

      // Small delay to ensure backend has processed the change
      await new Promise(resolve => setTimeout(resolve, 100));

      // Reload proposals to see updated state
      await loadProposalsAndTranslations(selectedLanguage);

      // Reload counts for all languages to ensure accuracy
      await loadLanguageCounts();

    } catch (err) {
      console.error('Error approving proposal:', err);
      alert('Error approving proposal');
      // Reload counts in case of error to revert optimistic update
      await loadLanguageCounts();
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(proposalId);
        return newSet;
      });
    }
  };

  const handleRejectProposal = async (proposalId) => {
    if (!confirm('Are you sure you want to reject this proposal?')) return;

    setProcessingIds(prev => new Set([...prev, proposalId]));

    // Optimistic update: decrease count immediately for better UX
    setLanguageCounts(prev => ({
      ...prev,
      [selectedLanguage]: Math.max(0, (prev[selectedLanguage] || 0) - 1)
    }));

    try {
      await rejectProposal(proposalId);

      // Small delay to ensure backend has processed the change
      await new Promise(resolve => setTimeout(resolve, 100));

      // Reload proposals
      await loadProposalsAndTranslations(selectedLanguage);

      // Reload counts for all languages to ensure accuracy
      await loadLanguageCounts();

    } catch (err) {
      console.error('Error rejecting proposal:', err);
      alert('Error rejecting proposal');
      // Reload counts in case of error to revert optimistic update
      await loadLanguageCounts();
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(proposalId);
        return newSet;
      });
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
      a.download = `translations-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error('Error downloading translations:', err);
      alert('Error downloading translations ZIP file');
    } finally {
      setDownloading(false);
    }
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

  const getTotalProposalsCount = () => {
    let count = 0;
    Object.values(groupedProposals).forEach(screen => {
      Object.values(screen).forEach(item => {
        count += item.proposals.length;
      });
    });
    return count;
  };

  if (initialLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b bg-white p-6">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">Review Proposals</h1>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-milo-red"></div>
            <div className="text-gray-600">Loading proposals...</div>
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
          {/* Title and navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Review Translation Proposals</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky language selector */}
      <div className="sticky top-0 z-10 bg-white px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="flex flex-wrap gap-2">
              {languages.map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 flex items-center gap-2 ${
                    selectedLanguage === lang
                      ? 'bg-milo-red text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span>{getLanguageFlag(lang)}</span>
                  <span>{lang.toUpperCase()}</span>
                  {languageCounts[lang] > 0 && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      selectedLanguage === lang
                        ? 'bg-white text-milo-red'
                        : 'bg-milo-red text-white'
                    }`}>
                      {languageCounts[lang]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={handleDownloadAll}
            disabled={downloading}
            className={`px-3 py-1.5 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
              downloading 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            title="Download all translations with approved proposals as ZIP file"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>{downloading ? 'Creating ZIP...' : 'Download All (.zip)'}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-milo-red"></div>
            <div className="text-gray-600">Loading {selectedLanguage.toUpperCase()} proposals...</div>
          </div>
        ) : Object.keys(groupedProposals).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No pending proposals for {selectedLanguage.toUpperCase()}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedProposals).map(screenName => (
              <div key={screenName} className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Screen header */}
                <button
                  onClick={() => toggleScreen(screenName)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-gray-900">
                          {screenName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedScreens.has(screenName) ? 'rotate-90' : ''
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
                
                {/* Proposals for this screen */}
                {expandedScreens.has(screenName) && (
                  <div className="border-t border-gray-100">
                    <div className="divide-y divide-gray-50">
                      {Object.values(groupedProposals[screenName]).map(item => {
                        // Get flattened English translations same as in Translations page
                        const flatEnglishTranslations = flattenObject(englishTranslations);
                        const englishValue = String(flatEnglishTranslations[item.key] || '');

                        return (
                        <div key={item.key} className="px-6 py-4 transition-colors duration-300">
                          <div className="mb-3">
                            {/* Translation key */}
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 mb-2 inline-block">
                              {item.key}
                            </span>

                            {/* English reference */}
                            {englishValue && (
                              <div className="mb-2">
                                <p className="text-sm text-gray-600 break-words">
                                  <strong>🇬🇧 EN:</strong> {englishValue}
                                </p>
                              </div>
                            )}

                            {/* Current translation in selected language */}
                            <div className="mb-2">
                              <p className="text-base text-gray-800 break-words font-medium">
                                <strong>{getLanguageFlag(selectedLanguage)} {selectedLanguage.toUpperCase()} Current:</strong> {item.originalValue}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">
                              Proposals ({item.proposals.length}):
                            </p>
                            <div className="border rounded-lg overflow-hidden">
                              <div className="divide-y divide-gray-100">
                                {item.proposals.map(proposal => {
                                  const isProcessing = processingIds.has(proposal._id);
                                  
                                  return (
                                    <div 
                                      key={proposal._id} 
                                      className="px-4 py-3 hover:bg-gray-50 transition-colors"
                                    >
                                      <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm text-gray-700 break-words">
                                            "{proposal.proposedValue}"
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                          <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900">
                                              {proposal.proposedByName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              {new Date(proposal.createdAt).toLocaleDateString()}
                                            </p>
                                          </div>
                                          <div className="flex space-x-2">
                                            <button
                                              onClick={() => handleApproveProposal(proposal._id, proposal.screen?.name, item.key)}
                                              disabled={isProcessing}
                                              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                                                isProcessing
                                                  ? 'bg-gray-400 text-white cursor-not-allowed'
                                                  : 'bg-green-600 text-white hover:bg-green-700'
                                              }`}
                                            >
                                              {isProcessing ? 'Processing...' : 'Approve'}
                                            </button>
                                            <button
                                              onClick={() => handleRejectProposal(proposal._id, proposal.screen?.name, item.key)}
                                              disabled={isProcessing}
                                              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                                                isProcessing
                                                  ? 'bg-gray-400 text-white cursor-not-allowed'
                                                  : 'bg-red-600 text-white hover:bg-red-700'
                                              }`}
                                            >
                                              {isProcessing ? 'Processing...' : 'Reject'}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewTranslations;