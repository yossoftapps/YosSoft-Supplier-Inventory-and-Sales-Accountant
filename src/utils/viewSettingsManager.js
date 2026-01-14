// Utility for managing view settings using localStorage

const SETTINGS_KEY_PREFIX = 'yossoft_view_settings_';

/**
 * Get view settings for a specific report
 * @param {string} reportKey - Unique identifier for the report
 * @returns {Object} View settings object
 */
export const getViewSettings = (reportKey) => {
  try {
    const settings = localStorage.getItem(`${SETTINGS_KEY_PREFIX}${reportKey}`);
    return settings ? JSON.parse(settings) : {};
  } catch (error) {
    console.warn(`Failed to load view settings for ${reportKey}:`, error);
    return {};
  }
};

/**
 * Save view settings for a specific report
 * @param {string} reportKey - Unique identifier for the report
 * @param {Object} settings - View settings to save
 */
export const saveViewSettings = (reportKey, settings) => {
  try {
    localStorage.setItem(`${SETTINGS_KEY_PREFIX}${reportKey}`, JSON.stringify(settings));
  } catch (error) {
    console.warn(`Failed to save view settings for ${reportKey}:`, error);
  }
};

/**
 * Clear view settings for a specific report
 * @param {string} reportKey - Unique identifier for the report
 */
export const clearViewSettings = (reportKey) => {
  try {
    localStorage.removeItem(`${SETTINGS_KEY_PREFIX}${reportKey}`);
  } catch (error) {
    console.warn(`Failed to clear view settings for ${reportKey}:`, error);
  }
};

/**
 * Clear all view settings
 */
export const clearAllViewSettings = () => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(SETTINGS_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear all view settings:', error);
  }
};

/**
 * Get column visibility settings
 * @param {string} reportKey - Unique identifier for the report
 * @returns {Object} Column visibility settings
 */
export const getColumnVisibility = (reportKey) => {
  const settings = getViewSettings(reportKey);
  return settings.columnVisibility || {};
};

/**
 * Save column visibility settings
 * @param {string} reportKey - Unique identifier for the report
 * @param {Object} visibility - Column visibility settings
 */
export const saveColumnVisibility = (reportKey, visibility) => {
  const settings = getViewSettings(reportKey);
  settings.columnVisibility = visibility;
  saveViewSettings(reportKey, settings);
};

/**
 * Get sort order settings
 * @param {string} reportKey - Unique identifier for the report
 * @returns {Object} Sort order settings
 */
export const getSortOrder = (reportKey) => {
  const settings = getViewSettings(reportKey);
  return settings.sortOrder || {};
};

/**
 * Save sort order settings
 * @param {string} reportKey - Unique identifier for the report
 * @param {Object} sortOrder - Sort order settings
 */
export const saveSortOrder = (reportKey, sortOrder) => {
  const settings = getViewSettings(reportKey);
  settings.sortOrder = sortOrder;
  saveViewSettings(reportKey, settings);
};

/**
 * Get pagination settings
 * @param {string} reportKey - Unique identifier for the report
 * @returns {Object} Pagination settings
 */
export const getPaginationSettings = (reportKey) => {
  const settings = getViewSettings(reportKey);
  return settings.pagination || {};
};

/**
 * Save pagination settings
 * @param {string} reportKey - Unique identifier for the report
 * @param {Object} pagination - Pagination settings
 */
export const savePaginationSettings = (reportKey, pagination) => {
  const settings = getViewSettings(reportKey);
  settings.pagination = pagination;
  saveViewSettings(reportKey, settings);
};

/**
 * Get density (size) settings
 * @param {string} reportKey - Unique identifier for the report
 * @returns {string} Density setting ('small', 'middle', 'default')
 */
export const getDensitySettings = (reportKey) => {
  const settings = getViewSettings(reportKey);
  return settings.density || 'middle';
};

/**
 * Save density settings
 * @param {string} reportKey - Unique identifier for the report
 * @param {string} density - Density setting
 */
export const saveDensitySettings = (reportKey, density) => {
  const settings = getViewSettings(reportKey);
  settings.density = density;
  saveViewSettings(reportKey, settings);
};

export default {
  getViewSettings,
  saveViewSettings,
  clearViewSettings,
  clearAllViewSettings,
  getColumnVisibility,
  saveColumnVisibility,
  getSortOrder,
  saveSortOrder,
  getPaginationSettings,
  savePaginationSettings,
  getDensitySettings,
  saveDensitySettings
};