const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const LeaveRequest = require("../models/LeaveRequest");
const User = require("../models/User");

// 📝 Gửi yêu cầu nghỉ phép
router.post("/", auth, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const userId = req.user.id;

    const request = await LeaveRequest.create({
      userId,
      leaveType,
      startDate,
      endDate,
      reason,
      days: 1 // Hook sẽ tự tính lại
    });

    res.status(201).json({
      message: "Yêu cầu nghỉ phép đã được gửi.",
      request
    });
  } catch (err) {
    console.error("❌ Gửi yêu cầu nghỉ phép thất bại:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

// 📄 Nhân viên xem các đơn nghỉ phép của chính mình
router.get("/", auth, async (req, res) => {
  try {
    const requests = await LeaveRequest.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]]
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách đơn", error: err.message });
  }
});

// 🔍 Admin xem đơn chờ duyệt
router.get("/pending", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Chỉ quản lý mới được truy cập" });
  }

  try {
    const requests = await LeaveRequest.findAll({
      where: { status: "pending" },
      include: [{ model: User, as: "employee", attributes: ["id", "name", "username"] }],
      order: [["createdAt", "DESC"]]
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

// ✅ Admin duyệt đơn
router.put("/:id/approve", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Bạn không có quyền duyệt đơn" });
  }

  try {
    const request = await LeaveRequest.findByPk(req.params.id);
    if (!request || request.status !== "pending") {
      return res.status(404).json({ message: "Đơn không tồn tại hoặc đã xử lý" });
    }

    request.status = "approved";
    request.approvedBy = req.user.id;
    request.approvedAt = new Date();
    await request.save();

    res.json({ message: "Đã duyệt đơn", request });
  } catch (err) {
    res.status(500).json({ message: "Lỗi duyệt đơn", error: err.message });
  }
});

// ❌ Admin từ chối đơn
router.put("/:id/reject", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Bạn không có quyền từ chối đơn" });
  }

  try {
    const request = await LeaveRequest.findByPk(req.params.id);
    if (!request || request.status !== "pending") {
      return res.status(404).json({ message: "Đơn không tồn tại hoặc đã xử lý" });
    }

    request.status = "rejected";
    request.rejectionReason = req.body.reason || "Không rõ lý do";
    request.approvedBy = req.user.id;
    request.approvedAt = new Date();
    await request.save();

    res.json({ message: "Đã từ chối đơn", request });
  } catch (err) {
    res.status(500).json({ message: "Lỗi từ chối đơn", error: err.message });
  }
});

module.exports = router;
