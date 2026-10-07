const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true
    },

    date: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["Present", "Absent"],
      default: "Present"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Attendance", attendanceSchema);