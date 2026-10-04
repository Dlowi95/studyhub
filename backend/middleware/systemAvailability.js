const { readSystemSettings, normalizeSystemSettings } = require("../utils/systemSettings");

const maintenanceMode = async (req, res, next) => {
  try {
    const settings = normalizeSystemSettings(await readSystemSettings());
    if (!settings.maintenanceEnabled) return next();

    res.set("Retry-After", "300");
    return res.status(503).json({
      code: "SITE_MAINTENANCE",
      message: settings.maintenanceMessage,
      expectedEndAt: settings.maintenanceExpectedEndAt,
    });
  } catch (error) {
    return next(error);
  }
};

const uploadsAvailability = async (_req, res, next) => {
  try {
    const settings = normalizeSystemSettings(await readSystemSettings());
    if (settings.uploadsEnabled) return next();

    return res.status(503).json({
      code: "UPLOADS_PAUSED",
      message: settings.uploadsMessage,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { maintenanceMode, uploadsAvailability };
