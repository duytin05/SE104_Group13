const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Attendance = require("../models/Attendance");
const { Op } = require("sequelize");

// Tra cứu lương theo tháng & năm
router.get("/", auth, async (req, res) => {
  console.log("🔍 Salary API called with params:", req.query);
  console.log("👤 User ID:", req.user?.id);
  
  const { month, year } = req.query;
  const userId = req.user.id;

  if (!month || !year) {
    return res.status(400).json({ message: "Thiếu tháng hoặc năm" });
  }

  // Tạo ngày bắt đầu và kết thúc của tháng
  const startDate = new Date(year, month - 1, 1); // month - 1 vì JavaScript đếm tháng từ 0
  const endDate = new Date(year, month, 0); // Ngày cuối của tháng
  
  const fromDate = startDate.toISOString().split('T')[0];
  const toDate = endDate.toISOString().split('T')[0];

  console.log("📅 Date range:", fromDate, "to", toDate);

  try {
    const records = await Attendance.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [fromDate, toDate]
        }
      },
      order: [['date', 'ASC']]
    });

    console.log("📊 Found records:", records.length);

    if (records.length === 0) {
      return res.status(404).json({ 
        message: "Không có dữ liệu chấm công cho tháng này",
        month,
        year,
        userId
      });
    }

    // Tính toán lương
    let totalWorkHours = 0;
    let totalOvertime = 0;
    let workDays = 0;
    let lateDays = 0;

    records.forEach(record => {
      totalWorkHours += (record.workHours || 0);
      totalOvertime += (record.overtime || 0);
      workDays++;
      if (record.status === "Trễ") {
        lateDays++;
      }
    });

    const hourlyRate = 30000; // Lương giờ cơ bản
    const overtimeRate = 45000; // Lương giờ tăng ca (1.5x)
    
    const basicSalary = totalWorkHours * hourlyRate;
    const overtimeSalary = totalOvertime * overtimeRate;
    const totalSalary = basicSalary + overtimeSalary;

    // Trừ lương do trễ (nếu có)
    const lateDeduction = lateDays * 50000; // Phạt 50k mỗi ngày trễ
    const finalSalary = totalSalary - lateDeduction;

    const result = {
      month: parseInt(month),
      year: parseInt(year),
      userId,
      summary: {
        workDays,
        lateDays,
        totalWorkHours: parseFloat(totalWorkHours.toFixed(2)),
        totalOvertime: parseFloat(totalOvertime.toFixed(2))
      },
      salary: {
        hourlyRate,
        overtimeRate,
        basicSalary,
        overtimeSalary,
        lateDeduction,
        totalSalary: finalSalary
      },
      records: records.map(r => ({
        date: r.date,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        status: r.status,
        workHours: r.workHours,
        overtime: r.overtime
      }))
    };

    console.log("💰 Salary calculation result:", result.salary);
    res.json(result);

  } catch (err) {
    console.error("❌ Lỗi API lương:", err);
    res.status(500).json({ 
      message: "Lỗi server", 
      error: err.message 
    });
  }
});

// Route để lấy lương tất cả nhân viên (chỉ admin)
router.get("/all", auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Chỉ admin mới được truy cập" });
  }

  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ message: "Thiếu tháng hoặc năm" });
  }

  try {
    // Lấy tất cả records trong tháng
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const fromDate = startDate.toISOString().split('T')[0];
    const toDate = endDate.toISOString().split('T')[0];

    const records = await Attendance.findAll({
      where: {
        date: {
          [Op.between]: [fromDate, toDate]
        }
      },
      include: [{
        model: require('../models/User'),
        attributes: ['id', 'name', 'username']
      }],
      order: [['userId', 'ASC'], ['date', 'ASC']]
    });

    // Group by userId
    const userSalaries = {};
    
    records.forEach(record => {
      const userId = record.userId;
      if (!userSalaries[userId]) {
        userSalaries[userId] = {
          userId,
          userName: record.User?.name || 'Unknown',
          username: record.User?.username || 'unknown',
          totalWorkHours: 0,
          totalOvertime: 0,
          workDays: 0,
          lateDays: 0
        };
      }

      userSalaries[userId].totalWorkHours += (record.workHours || 0);
      userSalaries[userId].totalOvertime += (record.overtime || 0);
      userSalaries[userId].workDays++;
      if (record.status === "Trễ") {
        userSalaries[userId].lateDays++;
      }
    });

    // Calculate salaries
    const hourlyRate = 30000;
    const overtimeRate = 45000;
    
    Object.values(userSalaries).forEach(user => {
      const basicSalary = user.totalWorkHours * hourlyRate;
      const overtimeSalary = user.totalOvertime * overtimeRate;
      const lateDeduction = user.lateDays * 50000;
      user.salary = {
        basicSalary,
        overtimeSalary,
        lateDeduction,
        totalSalary: basicSalary + overtimeSalary - lateDeduction
      };
    });

    res.json({
      month: parseInt(month),
      year: parseInt(year),
      employees: Object.values(userSalaries)
    });

  } catch (err) {
    console.error("❌ Lỗi API lương tất cả:", err);
    res.status(500).json({ 
      message: "Lỗi server", 
      error: err.message 
    });
  }
});

module.exports = router;