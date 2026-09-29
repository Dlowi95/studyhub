const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    nameKey: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 20,
      default: undefined,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

subjectSchema.index({ code: 1 }, { unique: true, sparse: true });

module.exports = mongoose.models.Subject || mongoose.model("Subject", subjectSchema);
