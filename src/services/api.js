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

export const getMyProposals = (language) =>
  api.get('/proposals/my', { params: { language } });

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

export default api;