const express = require("express");
const { getAdminDashboard } = require("../controllers/attendanceController");
const { requireAuth, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth, allowRoles("admin"));
router.get("/dashboard", getAdminDashboard);

module.exports = router;
