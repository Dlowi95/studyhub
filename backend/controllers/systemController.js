const SystemSetting = require("../models/SystemSetting");
const { recordAuditEvent } = require("../utils/auditLog");
const {
  GLOBAL_SETTINGS_KEY,
  defaultSystemSettings,
  invalidateSystemSettingsCache,
  normalizeSystemSettings,
  readSystemSettings,
} = require("../utils/systemSettings");

const publicSettings = (settings) => normalizeSystemSettings(settings);

exports.getPublicStatus = async (_req, res) => {
  try {
    const settings = await readSystemSettings({ force: true });
    res.set("Cache-Control", "no-store, max-age=0");
    return res.json(publicSettings(settings));
  } catch (error) {
    return res.status(503).json({ message: "Không thể tải trạng thái StudyHub", error: error.message });
  }
};

exports.getAdminSettings = async (_req, res) => {
  try {
    const settings = await readSystemSettings({ force: true });
    return res.json(publicSettings(settings));
  } catch (error) {
    return res.status(500).json({ message: "Không thể tải cài đặt hệ thống", error: error.message });
  }
};

exports.updateAdminSettings = async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const allowedFields = [
    "maintenanceEnabled",
    "maintenanceMessage",
    "maintenanceExpectedEndAt",
    "uploadsEnabled",
    "uploadsMessage",
  ];
  const updates = {};

  for (const field of ["maintenanceEnabled", "uploadsEnabled"]) {
    if (Object.hasOwn(body, field)) {
      if (typeof body[field] !== "boolean") {
        return res.status(400).json({ message: `Trường ${field} phải là true hoặc false` });
      }
      updates[field] = body[field];
    }
  }

  for (const [field, maxLength] of [["maintenanceMessage", 500], ["uploadsMessage", 300]]) {
    if (Object.hasOwn(body, field)) {
      if (typeof body[field] !== "string" || !body[field].trim() || body[field].trim().length > maxLength) {
        return res.status(400).json({ message: `Thông báo ${field} phải có từ 1 đến ${maxLength} ký tự` });
      }
      updates[field] = body[field].trim();
    }
  }

  if (Object.hasOwn(body, "maintenanceExpectedEndAt")) {
    if (body.maintenanceExpectedEndAt === null || body.maintenanceExpectedEndAt === "") {
      updates.maintenanceExpectedEndAt = null;
    } else {
      const expectedEndAt = new Date(body.maintenanceExpectedEndAt);
      if (Number.isNaN(expectedEndAt.getTime())) {
        return res.status(400).json({ message: "Thời gian dự kiến mở lại không hợp lệ" });
      }
      updates.maintenanceExpectedEndAt = expectedEndAt;
    }
  }

  if (Object.keys(updates).length === 0 || Object.keys(body).some((field) => !allowedFields.includes(field) && field !== "reason")) {
    return res.status(400).json({ message: "Không có cài đặt hợp lệ để cập nhật" });
  }

  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";

  try {
    const existing = await SystemSetting.findOne({ key: GLOBAL_SETTINGS_KEY }).lean();
    const previousSettings = { ...defaultSystemSettings(), ...(existing || {}) };
    const setting = await SystemSetting.findOneAndUpdate(
      { key: GLOBAL_SETTINGS_KEY },
      {
        $set: { ...updates, updatedBy: req.user._id },
        $setOnInsert: { key: GLOBAL_SETTINGS_KEY },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    invalidateSystemSettingsCache();
    const nextSettings = { ...defaultSystemSettings(), ...setting.toObject() };
    const changedFields = Object.keys(updates);
    await recordAuditEvent({
      actor: req.user,
      action: "system_settings_updated",
      entityType: "SystemSetting",
      entityId: setting._id,
      reason,
      metadata: {
        changedFields,
        previous: Object.fromEntries(changedFields.map((field) => [field, previousSettings[field] ?? null])),
        next: Object.fromEntries(changedFields.map((field) => [field, nextSettings[field] ?? null])),
      },
    });

    return res.json({ message: "Đã lưu cài đặt hệ thống", settings: publicSettings(nextSettings) });
  } catch (error) {
    return res.status(500).json({ message: "Không thể lưu cài đặt hệ thống", error: error.message });
  }
};
