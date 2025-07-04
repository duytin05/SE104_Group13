const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Attendance = require("../models/Attendance");
const LeaveRequest = require("../models/LeaveRequest");
const { Op } = require("sequelize");

// Lấy lịch làm việc và nghỉ phép theo tháng
router.get("/", auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const userId = req.user.id;

    // Mặc định là tháng hiện tại nếu không có tham số
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    // Tạo ngày bắt đầu và kết thúc của tháng
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);
    
    const fromDate = startDate.toISOString().split('T')[0];
    const toDate = endDate.toISOString().split('T')[0];

    console.log(`📅 Lấy lịch làm việc tháng ${targetMonth}/${targetYear} cho user ${userId}`);

    // Lấy dữ liệu chấm công
    const attendanceRecords = await Attendance.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [fromDate, toDate]
        }
      },
      order: [['date', 'ASC']]
    });

    // Lấy dữ liệu nghỉ phép
    const leaveRequests = await LeaveRequest.findAll({
      where: {
        userId,
        [Op.or]: [
          {
            startDate: {
              [Op.between]: [fromDate, toDate]
            }
          },
          {
            endDate: {
              [Op.between]: [fromDate, toDate]
            }
          },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: fromDate } },
              { endDate: { [Op.gte]: toDate } }
            ]
          }
        ]
      },
      order: [['startDate', 'ASC']]
    });

    // Tạo lịch đầy đủ cho tháng
    const calendar = [];
    const daysInMonth = endDate.getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDateStr = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayOfWeek = new Date(targetYear, targetMonth - 1, day).getDay();
      
      // Tìm record chấm công cho ngày này
      const attendanceRecord = attendanceRecords.find(record => record.date === currentDateStr);
      
      // Tìm nghỉ phép cho ngày này
      const leaveRecord = leaveRequests.find(leave => {
        const leaveStart = new Date(leave.startDate);
        const leaveEnd = new Date(leave.endDate);
        const currentDate = new Date(currentDateStr);
        return currentDate >= leaveStart && currentDate <= leaveEnd && leave.status === 'approved';
      });

      // Xác định loại ngày
      let dayType = 'working'; // Ngày làm việc bình thường
      let status = 'Chưa chấm công';
      let details = {};

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        dayType = 'weekend';
        status = 'Cuối tuần';
      } else if (leaveRecord) {
        dayType = 'leave';
        status = `Nghỉ phép - ${leaveRecord.reason}`;
        details = {
          leaveType: leaveRecord.leaveType,
          reason: leaveRecord.reason,
          status: leaveRecord.status
        };
      } else if (attendanceRecord) {
        dayType = 'worked';
        status = attendanceRecord.status;
        details = {
          checkIn: attendanceRecord.checkIn,
          checkOut: attendanceRecord.checkOut,
          workHours: attendanceRecord.workHours,
          overtime: attendanceRecord.overtime
        };
      }

      calendar.push({
        date: currentDateStr,
        day: day,
        dayOfWeek: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dayOfWeek],
        dayType,
        status,
        details
      });
    }

    // Thống kê tháng
    const statistics = {
      totalWorkDays: calendar.filter(d => d.dayType === 'worked').length,
      totalLeaveDays: calendar.filter(d => d.dayType === 'leave').length,
      totalWeekends: calendar.filter(d => d.dayType === 'weekend').length,
      totalAbsent: calendar.filter(d => d.dayType === 'working' && d.status === 'Chưa chấm công').length,
      totalWorkHours: attendanceRecords.reduce((sum, r) => sum + (r.workHours || 0), 0),
      totalOvertime: attendanceRecords.reduce((sum, r) => sum + (r.overtime || 0), 0)
    };

    res.json({
      month: targetMonth,
      year: targetYear,
      calendar,
      statistics,
      leaveRequests: leaveRequests.map(leave => ({
        id: leave.id,
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        reason: leave.reason,
        status: leave.status,
        days: leave.days
      }))
    });

  } catch (error) {
    console.error("❌ Lỗi API lịch làm việc:", error);
    res.status(500).json({ 
      message: "Lỗi server", 
      error: error.message 
    });
  }
});

// Lấy chi tiết lịch làm việc theo ngày
router.get("/day/:date", auth, async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user.id;

    const attendanceRecord = await Attendance.findOne({
      where: {
        userId,
        date
      }
    });

    const leaveRequest = await LeaveRequest.findOne({
      where: {
        userId,
        startDate: { [Op.lte]: date },
        endDate: { [Op.gte]: date },
        status: 'approved'
      }
    });

    if (!attendanceRecord && !leaveRequest) {
      return res.status(404).json({ 
        message: "Không có dữ liệu cho ngày này" 
      });
    }

    const dayInfo = {
      date,
      dayOfWeek: new Date(date).toLocaleDateString('vi-VN', { weekday: 'long' }),
      attendance: attendanceRecord ? {
        checkIn: attendanceRecord.checkIn,
        checkOut: attendanceRecord.checkOut,
        workHours: attendanceRecord.workHours,
        overtime: attendanceRecord.overtime,
        status: attendanceRecord.status,
        notes: attendanceRecord.notes
      } : null,
      leave: leaveRequest ? {
        leaveType: leaveRequest.leaveType,
        reason: leaveRequest.reason,
        status: leaveRequest.status
      } : null
    };

    res.json(dayInfo);

  } catch (error) {
    console.error("❌ Lỗi API chi tiết ngày:", error);
    res.status(500).json({ 
      message: "Lỗi server", 
      error: error.message 
    });
  }
});

// Lấy danh sách nghỉ phép
router.get("/leaves", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, year } = req.query;

    let whereClause = { userId };

    if (status) {
      whereClause.status = status;
    }

    if (year) {
      whereClause.startDate = {
        [Op.gte]: `${year}-01-01`,
        [Op.lte]: `${year}-12-31`
      };
    }

    const leaveRequests = await LeaveRequest.findAll({
      where: whereClause,
      order: [['startDate', 'DESC']]
    });

    const leaveStatistics = {
      totalRequests: leaveRequests.length,
      approved: leaveRequests.filter(l => l.status === 'approved').length,
      pending: leaveRequests.filter(l => l.status === 'pending').length,
      rejected: leaveRequests.filter(l => l.status === 'rejected').length,
      totalDays: leaveRequests
        .filter(l => l.status === 'approved')
        .reduce((sum, l) => sum + (l.days || 0), 0)
    };

    res.json({
      leaveRequests,
      statistics: leaveStatistics
    });

  } catch (error) {
    console.error("❌ Lỗi API danh sách nghỉ phép:", error);
    res.status(500).json({ 
      message: "Lỗi server", 
      error: error.message 
    });
  }
});

module.exports = router;