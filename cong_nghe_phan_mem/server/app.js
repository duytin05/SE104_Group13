const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const sequelize = require("./config/db");

const User = require("./models/User");
const Employee = require("./models/Employee");
const Attendance = require("./models/Attendance");
const LeaveRequest = require("./models/LeaveRequest");

const authRoutes = require("./routes/auth");
const employeeRoutes = require("./routes/employees");
const profileRoutes = require("./routes/profile");
const attendanceRoutes = require("./routes/attendance");
const salaryRoutes = require("./routes/salary");
const scheduleRoutes = require("./routes/schedule");
const leaveRequestRoutes = require("./routes/leave_request");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Gắn routes
app.use("/api", authRoutes); // login, register
app.use("/api/employees", employeeRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/schedule", scheduleRoutes); // Thêm route lịch làm việc
app.use("/api/leave_request", leaveRequestRoutes);


// Test route to verify server is running
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is running!" });
});

// Khởi tạo DB và seed dữ liệu mẫu
sequelize.sync({ force: true }).then(async () => {
  console.log(" DB connected");

  // 👉 Tạo tài khoản admin và nhân viên
  const hashAdmin = await bcrypt.hash("123456", 10);
  const hashNhanvien = await bcrypt.hash("111111", 10);

  const admin = await User.create({
    username: "admin",
    password: hashAdmin,
    role: "admin",
    name: "Nguyễn Văn A",
    gender: "Nam",
    dob: "1990-01-01",
    email: "admin@company.com",
    phone: "0901234567"
  });

  const nhanvien = await User.create({
    username: "nhanvien01",
    password: hashNhanvien,
    role: "nhanvien",
    name: "Trần Thị B",
    gender: "Nữ",
    dob: "1998-05-15",
    email: "nv01@company.com",
    phone: "0987654321"
  });

  // 👉 Chấm công mẫu cho tháng 6/2025
  await Attendance.bulkCreate([
    // Tuần 1
    {
      userId: 1,
      date: "2025-06-02",
      checkIn: "08:00",
      checkOut: "17:00",
      status: "Đi làm",
      workHours: 8,
      overtime: 0,
      isPaid: false
    },
    {
      userId: 1,
      date: "2025-06-03",
      checkIn: "08:15",
      checkOut: "17:00",
      status: "Trễ",
      workHours: 7.75,
      overtime: 0,
      isPaid: false
    },
    {
      userId: 1,
      date: "2025-06-04",
      checkIn: "08:00",
      checkOut: "18:00",
      status: "Đi làm",
      workHours: 8,
      overtime: 2,
      isPaid: false
    },
    {
      userId: 1,
      date: "2025-06-05",
      checkIn: "08:00",
      checkOut: "17:00",
      status: "Đi làm",
      workHours: 8,
      overtime: 0,
      isPaid: false
    },
    {
      userId: 1,
      date: "2025-06-06",
      checkIn: "08:00",
      checkOut: "17:00",
      status: "Đi làm",
      workHours: 8,
      overtime: 0,
      isPaid: false
    },
    
    // Tuần 2
    {
      userId: 1,
      date: "2025-06-09",
      checkIn: "08:00",
      checkOut: "17:00",
      status: "Đi làm",
      workHours: 8,
      overtime: 0,
      isPaid: false
    },
    {
      userId: 1,
      date: "2025-06-10",
      checkIn: "08:30",
      checkOut: "17:00",
      status: "Trễ",
      workHours: 7.5,
      overtime: 0,
      isPaid: false
    },
    {
      userId: 1,
      date: "2025-06-11",
      checkIn: "08:00",
      checkOut: "17:00",
      status: "Đi làm",
      workHours: 8,
      overtime: 0,
      isPaid: false
    },
    {
      userId: 1,
      date: "2025-06-12",
      checkIn: "08:00",
      checkOut: "19:00",
      status: "Đi làm",
      workHours: 8,
      overtime: 3,
      isPaid: false
    },
    {
      userId: 1,
      date: "2025-06-13",
      checkIn: "08:00",
      checkOut: "17:00",
      status: "Đi làm",
      workHours: 8,
      overtime: 0,
      isPaid: false
    },

    // Tuần 3
    {
      userId: 1,
      date: "2025-06-16",
      checkIn: "08:00",
      checkOut: "17:00",
      status: "Đi làm",
      workHours: 8,
      overtime: 0,
      isPaid: false
    },

    // Nhân viên 2
    {
      userId: 2,
      date: "2025-06-02",
      checkIn: "08:30",
      checkOut: "17:00",
      status: "Trễ",
      workHours: 7.5,
      overtime: 0,
      isPaid: false
    },
    {
      userId: 2,
      date: "2025-06-03",
      checkIn: "08:00",
      checkOut: "17:00",
      status: "Đi làm",
      workHours: 8,
      overtime: 0,
      isPaid: false
    },
    {
      userId: 2,
      date: "2025-06-04",
      checkIn: "08:00",
      checkOut: "17:00",
      status: "Đi làm",
      workHours: 8,
      overtime: 0,
      isPaid: false
    },
    {
      userId: 2,
      date: "2025-06-05",
      checkIn: "08:00",
      checkOut: "17:00",
      status: "Đi làm",
      workHours: 8,
      overtime: 0,
      isPaid: false
    }
  ]);

  // 👉 Dữ liệu nghỉ phép mẫu
  await LeaveRequest.bulkCreate([
    {
      userId: 1,
      leaveType: 'annual',
      startDate: '2025-06-19',
      endDate: '2025-06-20',
      days: 2,
      reason: 'Nghỉ phép cá nhân',
      status: 'approved',
      approvedBy: admin.id,
      approvedAt: new Date()
    },
    {
      userId: 1,
      leaveType: 'sick',
      startDate: '2025-06-25',
      endDate: '2025-06-25',
      days: 1,
      reason: 'Bị cảm, cần nghỉ ngơi',
      status: 'pending'
    },
    {
      userId: 2,
      leaveType: 'personal',
      startDate: '2025-06-06',
      endDate: '2025-06-07',
      days: 2,
      reason: 'Có việc gia đình quan trọng',
      status: 'approved',
      approvedBy: admin.id,
      approvedAt: new Date()
    },
    {
      userId: 2,
      leaveType: 'annual',
      startDate: '2025-06-15',
      endDate: '2025-06-16',
      days: 1, // Chỉ tính thứ 2, thứ 7 là cuối tuần
      reason: 'Nghỉ phép định kỳ',
      status: 'rejected',
      approvedBy: admin.id,
      approvedAt: new Date(),
      rejectionReason: 'Giai đoạn này công ty đang bận, không thể nghỉ'
    }
  ]);

  console.log("Sample data created");
  
  app.listen(3001, () => {
    console.log(" Server running on port 3001");
    console.log(" API endpoints:");
    console.log("   GET /api/schedule?month=06&year=2025");
    console.log("   GET /api/schedule/leaves");
    console.log("   GET /api/schedule/day/:date");
    console.log("   GET /api/salary?month=06&year=2025");
    console.log("   GET /api/test");
  });
}).catch((err) => {
  console.error("❌ DB Error:", err);
});