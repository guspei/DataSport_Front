// Security utility functions

/**
 * Sanitize user input to prevent XSS attacks
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (!input) return '';

  // Remove script tags and event handlers
  let sanitized = String(input)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '');

  // Escape HTML entities
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return sanitized.replace(/[&<>"'/]/g, (char) => escapeMap[char]);
};

/**
 * Validate prompt length
 * @param {string} prompt - Prompt text
 * @param {number} maxLength - Maximum allowed length
 * @returns {boolean} Is valid
 */
export const validatePromptLength = (prompt, maxLength = 5000) => {
  return prompt && prompt.length <= maxLength;
};

/**
 * Sanitize prompt variables (keep only allowed format)
 * @param {string} text - Text containing variables
 * @returns {string} Sanitized text
 */
export const sanitizePromptVariables = (text) => {
  if (!text) return '';

  // Only allow variables in the format {variable_name}
  // Remove any potentially malicious code within braces
  return text.replace(/\{[^}]*\}/g, (match) => {
    // Check if it's a valid variable format (alphanumeric and underscores only)
    if (/^\{[\w_]+\}$/.test(match)) {
      return match;
    }
    // If not valid, escape it
    return match.replace(/[<>"']/g, '');
  });
};

/**
 * Remove console.logs in production
 */
export const setupProductionMode = () => {
  if (process.env.NODE_ENV === 'production') {
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
    console.info = () => {};
    console.debug = () => {};
  }
};

/**
 * Validate and sanitize API responses
 * @param {any} data - API response data
 * @returns {any} Sanitized data
 */
export const sanitizeApiResponse = (data) => {
  if (typeof data === 'string') {
    return sanitizeInput(data);
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeApiResponse(item));
  }

  if (data && typeof data === 'object') {
    const sanitized = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        sanitized[key] = sanitizeApiResponse(data[key]);
      }
    }
    return sanitized;
  }

  return data;
};

/**
 * Check if a URL is safe (same origin or whitelisted)
 * @param {string} url - URL to check
 * @returns {boolean} Is safe
 */
export const isSafeUrl = (url) => {
  if (!url) return false;

  try {
    const urlObj = new URL(url, window.location.origin);

    // Check if same origin
    if (urlObj.origin === window.location.origin) {
      return true;
    }

    // Whitelist of allowed external domains
    const whitelist = [
      'https://api.openai.com',
      'https://api.anthropic.com',
      // Add other trusted domains as needed
    ];

    return whitelist.includes(urlObj.origin);
  } catch {
    return false;
  }
};

/**
 * Secure token storage with expiration check
 */
export const secureToken = {
  set: (token, expiresIn = 86400000) => { // Default 24 hours
    const item = {
      value: token,
      expiry: new Date().getTime() + expiresIn
    };
    localStorage.setItem('token', JSON.stringify(item));
  },

  get: () => {
    const itemStr = localStorage.getItem('token');
    if (!itemStr) return null;

    try {
      const item = JSON.parse(itemStr);
      const now = new Date().getTime();

      if (now > item.expiry) {
        localStorage.removeItem('token');
        return null;
      }

      return item.value;
    } catch {
      return null;
    }
  },

  remove: () => {
    localStorage.removeItem('token');
  }
};