import { useState, useEffect } from 'react';
import {
  getMyProposals,
  updateProposal,
  deleteProposal,
  getMyProposalsStats
} from '../services/api';

/**
 * MY PROPOSALS COMPONENT - MOCKUP/TEMPLATE
 *
 * This component allows translators to view and manage their translation proposals.
 *
 * BACKEND REQUIREMENTS:
 *
 * 1. GET /api/proposals/mine
 *    - Returns all proposals created by the authenticated user
 *    - Supports filtering by language, status, search query
 *    - Includes pagination
 *
 * 2. GET /api/proposals/mine/stats
 *    - Returns statistics about user's proposals
 *
 * 3. PUT /api/proposals/:proposalId
 *    - Updates a pending proposal (only by creator)
 *
 * 4. DELETE /api/proposals/:proposalId
 *    - Deletes a pending proposal (only by creator)
 */

function MyProposals({ user }) {
  // State management
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  // Filters
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);

  // Edit modal
  const [editingProposal, setEditingProposal] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Check if user has access
  const hasAccess = user?.roles?.includes('translator') ||
                    user?.roles?.includes('translator_master') ||
                    user?.roles?.includes('admin');

  useEffect(() => {
    // Add small delay to ensure component is mounted
    const timeoutId = setTimeout(() => {
      if (hasAccess) {
        loadProposals();
        loadStatistics();
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [selectedLanguage, selectedStatus, searchQuery, sortBy, sortOrder, currentPage, hasAccess]);


  const loadProposals = async () => {
    try {
      setLoading(true);

      // Try to use the new endpoint, but fallback to the old one
      let response;

      if (selectedLanguage !== 'all' && selectedStatus === 'all' && !searchQuery) {
        // Use the old endpoint for simple language filtering (which exists)
        response = await getMyProposals(selectedLanguage);

        console.log('📋 Raw response from getMyProposals:', response);
        console.log('📋 Response data:', JSON.stringify(response?.data, null, 2));

        // Transform old response format to new format
        if (response?.data) {
          const proposalsList = [];

          // Handle the old format where data is an object with keys like "de.screen.key"
          if (typeof response.data === 'object' && !Array.isArray(response.data)) {
            Object.entries(response.data).forEach(([proposalKey, proposal]) => {
              // Check if this is a proposal object (has status, proposedValue, etc.)
              if (proposal && typeof proposal === 'object' && proposal.status) {
                // Extract the actual key from the full proposal key (e.g., "de.screen.translationKey")
                const keyParts = proposalKey.split('.');
                const actualKey = keyParts.slice(2).join('.'); // Remove language and screen parts
                const screenName = keyParts[1] || 'unknown';

                proposalsList.push({
                  ...proposal,
                  _id: proposal._id || proposalKey,
                  language: selectedLanguage,
                  key: proposal.key || actualKey,
                  screen: proposal.screen || { name: screenName },
                  createdBy: proposal.createdBy || { name: 'Unknown', email: '' },
                  createdAt: proposal.createdAt || new Date().toISOString(),
                  updatedAt: proposal.updatedAt || new Date().toISOString()
                });
              }
            });
          } else if (Array.isArray(response.data)) {
            proposalsList.push(...response.data);
          }

          console.log('📋 Transformed proposals list:', proposalsList);

          response = {
            data: {
              proposals: proposalsList,
              pagination: {
                total: proposalsList.length,
                page: 1,
                pages: 1,
                limit: proposalsList.length
              }
            }
          };
        }
      } else {
        // Use new endpoint (when backend implements it)
        response = await getMyProposals({
          language: selectedLanguage !== 'all' ? selectedLanguage : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          search: searchQuery,
          sortBy,
          sortOrder,
          page: currentPage,
          limit
        });

        console.log('📋 Response from new endpoint:', response);
        console.log('📋 New endpoint data:', JSON.stringify(response?.data, null, 2));
      }

      // Handle double-nested data structure from backend
      let actualData = response?.data;

      // Check if backend is returning data.data instead of just data
      if (actualData?.data) {
        console.log('📦 Backend returned double-nested data, extracting inner data');
        actualData = actualData.data;
      }

      // Safe access with fallbacks
      if (actualData?.proposals) {
        console.log('✅ Setting proposals:', actualData.proposals.length, 'items');
        setProposals(actualData.proposals);
      } else {
        console.warn('⚠️ No proposals found in response');
        setProposals([]);
      }

      if (actualData?.pagination?.pages) {
        setTotalPages(actualData.pagination.pages);
      } else {
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error loading proposals:', error);
      // Set safe defaults on error
      setProposals([]);
      setTotalPages(1);

      // Retry once after delay if not 401
      if (error.response?.status !== 401) {
        console.log('Retrying proposals load...');
        setTimeout(() => {
          loadProposals();
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      // THIS API ENDPOINT NEEDS TO BE IMPLEMENTED
      const response = await getMyProposalsStats();

      console.log('📊 Statistics response:', response);
      console.log('📊 Statistics data:', JSON.stringify(response?.data, null, 2));

      // Handle double-nested data structure from backend
      let actualData = response?.data;

      // Check if backend is returning data.data instead of just data
      if (actualData?.data) {
        console.log('📦 Backend returned double-nested data for stats, extracting inner data');
        actualData = actualData.data;
      }

      // Now check for the overall statistics
      if (actualData?.overall) {
        console.log('✅ Setting statistics:', actualData.overall);
        setStatistics(actualData.overall);
      } else if (actualData && typeof actualData === 'object') {
        // Try to use the data directly if it has the expected properties
        if ('total' in actualData || 'pending' in actualData) {
          console.log('✅ Using data directly as statistics');
          setStatistics(actualData);
        } else {
          // Keep default values if response is invalid
          console.warn('Invalid statistics response structure');
        }
      } else {
        console.warn('Invalid statistics response');
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
      // Statistics will keep the default values set in state

      // Retry once after delay if not 401
      if (error.response?.status !== 401) {
        setTimeout(() => {
          loadStatistics();
        }, 1500);
      }
    }
  };

  const handleEditProposal = (proposal) => {
    setEditingProposal(proposal);
    setEditValue(proposal.proposedValue);
  };

  const handleSaveEdit = async () => {
    if (!editingProposal) return;

    try {
      // THIS API ENDPOINT NEEDS TO BE IMPLEMENTED
      await updateProposal(editingProposal._id, {
        proposedValue: editValue
      });

      // Reload proposals
      await loadProposals();
      setEditingProposal(null);
      setEditValue('');
    } catch (error) {
      console.error('Error updating proposal:', error);
      alert('Error updating proposal');
    }
  };

  const handleDeleteProposal = async (proposalId) => {
    if (!confirm('Are you sure you want to delete this proposal?')) return;

    try {
      // THIS API ENDPOINT NEEDS TO BE IMPLEMENTED
      await deleteProposal(proposalId);

      // Reload proposals
      await loadProposals();
      await loadStatistics();
    } catch (error) {
      console.error('Error deleting proposal:', error);
      alert('Error deleting proposal');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLanguageFlag = (lang) => {
    const flags = {
      'de': '🇩🇪',
      'en': '🇬🇧',
      'it': '🇮🇹',
      'fr': '🇫🇷',
      'DE': '🇩🇪',
      'EN': '🇬🇧',
      'IT': '🇮🇹',
      'FR': '🇫🇷'
    };
    return flags[lang] || '🌐';
  };

  if (!hasAccess) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-gray-600">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="border-b bg-white p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Proposals</h1>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{statistics?.total || 0}</div>
            <div className="text-sm text-gray-600">Total Proposals</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-800">{statistics?.pending || 0}</div>
            <div className="text-sm text-yellow-700">Pending</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-800">{statistics?.approved || 0}</div>
            <div className="text-sm text-green-700">Approved</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="text-2xl font-bold text-red-800">{statistics?.rejected || 0}</div>
            <div className="text-sm text-red-700">Rejected</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Language Filter */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-milo-red"
          >
            <option value="all">All Languages</option>
            <option value="de">German (DE)</option>
            <option value="en">English (EN)</option>
            <option value="it">Italian (IT)</option>
            <option value="fr">French (FR)</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-milo-red"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Sort Options */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-');
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-milo-red"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="status-asc">Status (A-Z)</option>
            <option value="language-asc">Language (A-Z)</option>
          </select>

          {/* Search Bar */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by key or content..."
            className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-milo-red"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-milo-red"></div>
            <div className="text-gray-600">Loading proposals...</div>
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No proposals found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <div key={proposal._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header Row */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">{getLanguageFlag(proposal.language)}</span>
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusBadgeClass(proposal.status)}`}>
                        {proposal.status.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-600">
                        {proposal.screen?.name || 'Unknown Screen'}
                      </span>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                        {proposal.key}
                      </span>
                    </div>

                    {/* Translation Values */}
                    <div className="space-y-2">
                      {/* English Reference */}
                      {proposal.englishValue && (
                        <div className="text-sm">
                          <span className="font-semibold text-gray-700">EN:</span>
                          <span className="ml-2 text-gray-600">{proposal.englishValue}</span>
                        </div>
                      )}

                      {/* Original Value */}
                      <div className="text-sm">
                        <span className="font-semibold text-gray-700">Original:</span>
                        <span className="ml-2 text-gray-600">{proposal.originalValue}</span>
                      </div>

                      {/* Proposed Value */}
                      <div className="text-sm">
                        <span className="font-semibold text-gray-700">Proposed:</span>
                        <span className="ml-2 text-gray-900">{proposal.proposedValue}</span>
                      </div>

                      {/* Rejection Reason */}
                      {proposal.status === 'rejected' && proposal.rejectionReason && (
                        <div className="text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded">
                          <span className="font-semibold text-red-700">Rejection reason:</span>
                          <span className="ml-2 text-red-600">{proposal.rejectionReason}</span>
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>Created: {new Date(proposal.createdAt).toLocaleDateString()}</span>
                      {proposal.reviewedBy && (
                        <span>Reviewed by: {proposal.reviewedBy.name}</span>
                      )}
                      {proposal.reviewedAt && (
                        <span>Reviewed: {new Date(proposal.reviewedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {proposal.status === 'pending' && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditProposal(proposal)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProposal(proposal._id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-1 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Proposal</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key: <span className="font-mono text-gray-600">{editingProposal.key}</span>
                </label>
              </div>

              {editingProposal.englishValue && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">English Reference:</label>
                  <div className="p-2 bg-gray-50 rounded text-sm">{editingProposal.englishValue}</div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Original Value:</label>
                <div className="p-2 bg-gray-50 rounded text-sm">{editingProposal.originalValue}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Value:</label>
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-milo-red focus:border-milo-red"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setEditingProposal(null);
                  setEditValue('');
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm text-white bg-milo-red hover:bg-milo-dark rounded"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyProposals;