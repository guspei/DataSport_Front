import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

const api = axios.create({
  baseURL: API_URL
});

// Interceptor para añadir token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (email, password, rememberMe) => 
  api.post('/auth/login', { email, password, rememberMe });

export const getMe = () => 
  api.get('/auth/me');

export const changePassword = (currentPassword, newPassword) =>
  api.post('/auth/change-password', { currentPassword, newPassword });

// Users
export const getUsers = () => 
  api.get('/users');

export const createUser = (userData) => 
  api.post('/users', userData);

export const deleteUser = (id) => 
  api.delete(`/users/${id}`);

export const updateUserRoles = (id, roles) =>
  api.patch(`/users/${id}/roles`, { roles });

// Translations
export const getLanguages = () => 
  api.get('/translations');

export const getTranslations = (lang) => 
  api.get(`/translations/${lang}`);

export const getOriginalTranslations = (lang) => 
  api.get(`/translations/${lang}/original`);

export const updateTranslation = (lang, content) =>
  api.put(`/translations/${lang}`, { content });

export const compareTranslations = (lang1, lang2) =>
  api.get(`/translations/compare/${lang1}/${lang2}`);

// Screens (Individual screen management)
export const getScreens = () =>
  api.get('/screens');

export const getScreen = (id) =>
  api.get(`/screens/${id}`);

export const createScreen = (screenData) =>
  api.post('/screens', screenData);

export const updateScreen = (id, screenData) =>
  api.put(`/screens/${id}`, screenData);

export const deleteScreen = (id) =>
  api.delete(`/screens/${id}`);

export const addKeyToScreen = (id, key) =>
  api.post(`/screens/${id}/keys`, { key });

export const removeKeyFromScreen = (id, key) =>
  api.delete(`/screens/${id}/keys/${encodeURIComponent(key)}`);

export const reorderScreens = (screenOrders) =>
  api.put('/screens/reorder', { screenOrders });

export const getUnassignedKeys = () =>
  api.get('/screens/unassigned/keys');

// Screen Configurations (Legacy - for backward compatibility)
export const getScreenConfigurations = () =>
  api.get('/screen-configurations');

export const getScreenConfiguration = (name) =>
  api.get(`/screen-configurations/${name}`);

export const saveScreenConfiguration = (name, configData) =>
  api.put(`/screen-configurations/${name}`, configData);

export const deleteScreenConfiguration = (name) =>
  api.delete(`/screen-configurations/${name}`);

export const getDefaultScreenConfiguration = () =>
  api.get('/screen-configurations/default/configuration');


// Translation Proposals
export const getProposals = (params) => 
  api.get('/proposals', { params });

export const getAllProposals = (params) =>
  api.get('/proposals/all', { params });

/**
 * Get user's proposals - supports both simple language filter and advanced filters
 * @param {string|Object} languageOrParams - Either a language string or params object
 */
export const getMyProposals = (languageOrParams) => {
  // Support both old usage (string) and new usage (object)
  if (typeof languageOrParams === 'string') {
    return api.get('/proposals/my', { params: { language: languageOrParams } });
  }
  // For the My Proposals page with advanced filtering
  return api.get('/proposals/mine', { params: languageOrParams });
};

export const createProposal = (proposalData) =>
  api.post('/proposals', proposalData);

export const deleteProposal = (id) =>
  api.delete(`/proposals/${id}`);

export const approveProposal = (id) =>
  api.patch(`/proposals/${id}/approve`);

export const rejectProposal = (id) =>
  api.patch(`/proposals/${id}/reject`);

export const getProposalsCount = () =>
  api.get('/proposals/count');

// Download translations - Remove responseType: 'blob' to get JSON
export const downloadTranslations = (lang) =>
  api.get(`/translations/${lang}/download`);

export const downloadAllTranslations = () =>
  api.get('/translations/download/all');

export const downloadTranslationsWithStructure = () =>
  api.get('/translations/download/structure');

// Download translations as ZIP file - Binary format
export const downloadTranslationsZip = () =>
  api.get('/translations/download/zip', { responseType: 'blob' });

export const downloadTranslationsWithStructureZip = () =>
  api.get('/translations/download/structure-zip', { responseType: 'blob' });

// Training Plans
export const getTrainingPlansUsers = () =>
  api.get('/training-plans/users');

export const getTrainingPlans = (params) =>
  api.get('/training-plans', { params });

export const getTrainingPlan = (userId) =>
  api.get(`/training-plans/${userId}`);

export const getTrainingWeek = (userId, weekId) =>
  api.get(`/training-plans/${userId}/weeks/${weekId}`);

export const getTrainingPlansStats = () =>
  api.get('/training-plans/stats/overview');

// MY PROPOSALS API ENDPOINTS - BACKEND NEEDS TO IMPLEMENT THESE
// ============================================================

/**
 * Get statistics for user's proposals
 * @param {Object} params - Query parameters
 * @param {string} params.groupBy - Group results by (language/screen/status/month)
 * @param {string} params.dateFrom - Start date ISO string
 * @param {string} params.dateTo - End date ISO string
 */
export const getMyProposalsStats = (params) =>
  api.get('/proposals/mine/stats', { params });

/**
 * Update a pending proposal (only by creator)
 * @param {string} proposalId - Proposal ID
 * @param {Object} data - Update data
 * @param {string} data.proposedValue - New translation value
 */
export const updateProposal = (proposalId, data) =>
  api.put(`/proposals/${proposalId}`, data);

// Note: deleteProposal is already defined above in the file

export default api;