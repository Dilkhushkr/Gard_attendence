const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    mapUrl: { type: String, default: "" },
    label: { type: String, default: "" }
  },
  { _id: false }
);

const attendanceLogSchema = new mongoose.Schema(
  {
    guardName: { type: String, required: true, trim: true },
    guardUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    checkedInAt: { type: Date, required: true },
    checkedOutAt: { type: Date, default: null },
    checkInLocation: { type: locationSchema, required: true },
    checkOutLocation: { type: locationSchema, default: null },
    totalHours: { type: Number, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AttendanceLog", attendanceLogSchema);
