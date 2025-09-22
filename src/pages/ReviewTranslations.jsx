import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { 
  getLanguages,
  getAllProposals,
  approveProposal,
  rejectProposal,
  getTranslations,
  downloadTranslationsWithStructure
} from '../services/api';

function ReviewTranslations() {
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('de');
  const [proposals, setProposals] = useState([]);
  const [groupedProposals, setGroupedProposals] = useState({});
  const [originalTranslations, setOriginalTranslations] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedScreens, setExpandedScreens] = useState(new Set());
  const [processingIds, setProcessingIds] = useState(new Set());
  const [languageCounts, setLanguageCounts] = useState({});
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadLanguages();
    loadLanguageCounts();
    
    // Auto-refresh proposals count every 30 seconds
    const interval = setInterval(() => {
      loadLanguageCounts();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedLanguage) {
      loadProposalsAndTranslations(selectedLanguage);
    }
  }, [selectedLanguage]);

  const loadLanguages = async () => {
    try {
      const res = await getLanguages();
      setLanguages(res.data.languages);
      // Only set default if 'de' is not available or if no language is selected
      if (res.data.languages.length > 0 && !res.data.languages.includes('de')) {
        setSelectedLanguage(res.data.languages[0]);
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
    try {
      setLoading(true);
      
      // Load all pending proposals for this language
      const proposalsRes = await getAllProposals({ 
        language: lang, 
        status: 'pending' 
      });
      
      // Load original translations for comparison
      const translationsRes = await getTranslations(lang);
      
      setProposals(proposalsRes.data);
      setOriginalTranslations(translationsRes.data.content);
      
      
      // Group proposals by screen name (from populated screen object)
      const grouped = {};
      proposalsRes.data.forEach(proposal => {
        const screenName = proposal.screen?.name || 'Unknown'; // Screen name from populated object
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
      console.error('Error loading proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProposal = async (proposalId, screen, key) => {
    setProcessingIds(prev => new Set([...prev, proposalId]));
    
    try {
      await approveProposal(proposalId);
      
      // Reload proposals to see updated state
      await loadProposalsAndTranslations(selectedLanguage);
      await loadLanguageCounts();
      
    } catch (err) {
      console.error('Error approving proposal:', err);
      alert('Error approving proposal');
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
    
    try {
      await rejectProposal(proposalId);
      
      // Reload proposals
      await loadProposalsAndTranslations(selectedLanguage);
      await loadLanguageCounts();
      
    } catch (err) {
      console.error('Error rejecting proposal:', err);
      alert('Error rejecting proposal');
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
      
      // Create a new ZIP file
      const zip = new JSZip();
      
      // Get all translations with GitHub structure maintained
      const response = await downloadTranslationsWithStructure();
      const structuredData = response.data;
      
      // Create folder structure: lang/fe/*.json and lang/email/*.json
      Object.keys(structuredData).forEach(lang => {
        const langData = structuredData[lang];
        
        // Add fe/ files
        if (langData.fe) {
          Object.keys(langData.fe).forEach(fileName => {
            const filePath = `${lang}/fe/${fileName}`;
            const fileContent = JSON.stringify(langData.fe[fileName], null, 2);
            zip.file(filePath, fileContent);
          });
        }
        
        // Add email/ files
        if (langData.email) {
          Object.keys(langData.email).forEach(fileName => {
            const filePath = `${lang}/email/${fileName}`;
            const fileContent = JSON.stringify(langData.email[fileName], null, 2);
            zip.file(filePath, fileContent);
          });
        }
      });
      
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
      a.download = `translations-with-approved-proposals-${new Date().toISOString().split('T')[0]}.zip`;
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


  const getLanguageFlag = (lang) => {
    const flags = {
      'en': '🇬🇧',
      'de': '🇩🇪',
      'fr': '🇫🇷',
      'it': '🇮🇹'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading proposals...</div>
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
                  className={`px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 flex items-center gap-2 ${
                    selectedLanguage === lang
                      ? 'bg-milo-red text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
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
        {Object.keys(groupedProposals).length === 0 ? (
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
                      {Object.values(groupedProposals[screenName]).map(item => (
                        <div key={item.key} className="px-6 py-4 transition-colors duration-300">
                          <div className="mb-3">
                            {/* Original translation first */}
                            <div className="mb-2">
                              <p className="text-base text-gray-800 break-words font-medium">
                                <strong>Original:</strong> {item.originalValue}
                              </p>
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 mt-1 inline-block">
                                {item.key}
                              </span>
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
                      ))}
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