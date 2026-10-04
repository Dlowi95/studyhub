const mongoose = require("mongoose");

const systemSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, immutable: true, default: "global" },
    maintenanceEnabled: { type: Boolean, default: false },
    maintenanceMessage: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "StudyHub đang được bảo trì để nâng cấp trải nghiệm. Vui lòng quay lại sau.",
    },
    maintenanceExpectedEndAt: { type: Date, default: null },
    uploadsEnabled: { type: Boolean, default: true },
    uploadsMessage: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "StudyHub đang tạm dừng nhận tài liệu mới. Bạn vẫn có thể xem và tải tài liệu hiện có.",
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.models.SystemSetting || mongoose.model("SystemSetting", systemSettingSchema);
