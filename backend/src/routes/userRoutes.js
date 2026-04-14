const express = require("express");
const { checkIn, checkOut, getMyAttendance } = require("../controllers/attendanceController");
const { requireAuth, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, allowRoles("user"));
router.post("/checkin", checkIn);
router.post("/checkout", checkOut);
router.get("/attendance", getMyAttendance);

module.exports = router;
