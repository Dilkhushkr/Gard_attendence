const AttendanceLog = require("../models/AttendanceLog");

function validateBody(body) {
  const { latitude, longitude } = body;
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return "latitude and longitude must be numbers";
  }
  return null;
}

function buildLocationPayload(body) {
  const { latitude, longitude, mapUrl, placeLabel } = body;
  const loc = { latitude, longitude };
  if (typeof mapUrl === "string" && mapUrl.trim()) {
    loc.mapUrl = mapUrl.trim().slice(0, 2048);
  }
  if (typeof placeLabel === "string" && placeLabel.trim()) {
    loc.label = placeLabel.trim().slice(0, 500);
  }
  return loc;
}

function calcHours(checkInAt, checkOutAt) {
  const ms = new Date(checkOutAt).getTime() - new Date(checkInAt).getTime();
  return Number(Math.max(ms / (1000 * 60 * 60), 0).toFixed(2));
}

async function checkIn(req, res) {
  const error = validateBody(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const guardName = req.user.name;
    const existingOpen = await AttendanceLog.findOne({ guardName, checkedOutAt: null });
    if (existingOpen) return res.status(409).json({ error: "Guard already checked in" });

    const checkInLocation = buildLocationPayload(req.body);
    const created = await AttendanceLog.create({
      guardName,
      guardUser: req.user.id,
      checkedInAt: new Date(),
      checkInLocation
    });

    return res.status(201).json({ message: "Check-in recorded", session: created });
  } catch (err) {
    return res.status(500).json({ error: "Failed to record check-in" });
  }
}

async function checkOut(req, res) {
  const error = validateBody(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const guardName = req.user.name;
    const active = await AttendanceLog.findOne({ guardName, checkedOutAt: null }).sort({
      checkedInAt: -1
    });
    if (!active) return res.status(404).json({ error: "No active session found" });

    active.checkedOutAt = new Date();
    active.checkOutLocation = buildLocationPayload(req.body);
    active.totalHours = calcHours(active.checkedInAt, active.checkedOutAt);
    await active.save();

    return res.json({ message: "Check-out recorded", session: active });
  } catch (err) {
    return res.status(500).json({ error: "Failed to record check-out" });
  }
}

async function getMyAttendance(req, res) {
  try {
    const logs = await AttendanceLog.find({ guardUser: req.user.id }).sort({ checkedInAt: -1 });
    const totalHoursAll = Number(
      logs.reduce((sum, log) => sum + (log.totalHours || 0), 0).toFixed(2)
    );
    return res.json({ count: logs.length, totalHoursAll, logs });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch attendance logs" });
  }
}

async function getAdminDashboard(req, res) {
  try {
    const latestPerGuard = await AttendanceLog.aggregate([
      { $sort: { checkedInAt: -1 } },
      { $group: { _id: "$guardName", latest: { $first: "$$ROOT" } } },
      {
        $project: {
          _id: 0,
          guardName: "$_id",
          status: {
            $cond: [{ $eq: ["$latest.checkedOutAt", null] }, "Checked In", "Checked Out"]
          },
          lastCheckIn: "$latest.checkedInAt",
          lastCheckOut: "$latest.checkedOutAt",
          lastCheckInLocation: "$latest.checkInLocation"
        }
      },
      { $sort: { guardName: 1 } }
    ]);

    const logs = await AttendanceLog.find({}).sort({ checkedInAt: -1 }).limit(200);
    const totalHoursAll = Number(
      logs.reduce((sum, log) => sum + (log.totalHours || 0), 0).toFixed(2)
    );

    return res.json({ guards: latestPerGuard, logs, totalHoursAll });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch admin dashboard" });
  }
}

module.exports = { checkIn, checkOut, getMyAttendance, getAdminDashboard };
