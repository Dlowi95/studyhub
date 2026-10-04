const SystemSetting = require("../models/SystemSetting");

const GLOBAL_SETTINGS_KEY = "global";
const SETTINGS_CACHE_TTL_MS = 2000;

const defaultSystemSettings = () => ({
  key: GLOBAL_SETTINGS_KEY,
  maintenanceEnabled: false,
  maintenanceMessage: "StudyHub đang được bảo trì để nâng cấp trải nghiệm. Vui lòng quay lại sau.",
  maintenanceExpectedEndAt: null,
  uploadsEnabled: true,
  uploadsMessage: "StudyHub đang tạm dừng nhận tài liệu mới. Bạn vẫn có thể xem và tải tài liệu hiện có.",
  updatedBy: null,
});

const normalizeSystemSettings = (settings) => {
  const defaults = defaultSystemSettings();
  return {
    maintenanceEnabled: settings?.maintenanceEnabled === true,
    maintenanceMessage: settings?.maintenanceMessage || defaults.maintenanceMessage,
    maintenanceExpectedEndAt: settings?.maintenanceExpectedEndAt
      ? new Date(settings.maintenanceExpectedEndAt).toISOString()
      : null,
    uploadsEnabled: settings?.uploadsEnabled !== false,
    uploadsMessage: settings?.uploadsMessage || defaults.uploadsMessage,
  };
};

let settingsCache = null;
let settingsCacheExpiresAt = 0;
let settingsReadInFlight = null;
let settingsCacheGeneration = 0;

const invalidateSystemSettingsCache = () => {
  settingsCacheGeneration += 1;
  settingsCache = null;
  settingsCacheExpiresAt = 0;
  settingsReadInFlight = null;
};

const readSystemSettings = async ({ force = false } = {}) => {
  if (!force && settingsCache && Date.now() < settingsCacheExpiresAt) return settingsCache;
  if (!force && settingsReadInFlight) return settingsReadInFlight;

  const generationAtStart = settingsCacheGeneration;
  const readPromise = SystemSetting.findOne({ key: GLOBAL_SETTINGS_KEY })
    .lean()
    .then((settings) => {
      const normalized = { ...defaultSystemSettings(), ...(settings || {}) };
      if (generationAtStart === settingsCacheGeneration) {
        settingsCache = normalized;
        settingsCacheExpiresAt = Date.now() + SETTINGS_CACHE_TTL_MS;
      }
      return normalized;
    })
    .finally(() => {
      if (settingsReadInFlight === readPromise) settingsReadInFlight = null;
    });
  settingsReadInFlight = readPromise;

  return readPromise;
};

module.exports = {
  GLOBAL_SETTINGS_KEY,
  defaultSystemSettings,
  invalidateSystemSettingsCache,
  normalizeSystemSettings,
  readSystemSettings,
};
