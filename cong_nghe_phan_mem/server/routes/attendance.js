const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Attendance = require("../models/Attendance");
const { Op } = require("sequelize");


// 📌 GET: Lấy chấm công theo tháng/năm cho người dùng đang đăng nhập
router.get("/", auth, async (req, res) => {
  const { month, year } = req.query;
  const userId = req.user.id;

  if (!month || !year) {
    return res.status(400).json({ message: "Thiếu tháng hoặc năm" });
  }

  try {
    const fromDate = `${year}-${month}-01`;
    const lastDay = new Date(year, month, 0).getDate(); // VD: tháng 2 → 28
    const toDate = `${year}-${month}-${lastDay}`;

    const records = await Attendance.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [fromDate, toDate]
        }
      },
      order: [["date", "ASC"]]
    });

    if (records.length === 0) {
      return res.status(404).json({ message: "Không có dữ liệu" });
    }

    res.json(records);
  } catch (err) {
    console.error("❌ Lỗi GET /attendance:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});


// 📌 POST: Gửi chấm công mới (dành cho nhân viên đang đăng nhập)
router.post("/", auth, async (req, res) => {
  const { date, checkIn, checkOut, status, workHours, overtime } = req.body;
  const userId = req.user.id;

  if (!date || !checkIn || !checkOut || !status) {
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
  }

  try {
    const record = await Attendance.create({
      userId,
      date,
      checkIn,
      checkOut,
      status,
      workHours: workHours || 8,
      overtime: overtime || 0,
      isPaid: false
    });

    res.status(201).json(record);
  } catch (err) {
    console.error("❌ Lỗi POST /attendance:", err);
    res.status(500).json({ message: "Lỗi server khi thêm chấm công" });
  }
});


module.exports = router;
