const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Attendance = sequelize.define("Attendance", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  checkIn: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  checkOut: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Chưa rõ", // VD: Đi làm, Nghỉ phép, Trễ, Vắng
  },
  workHours: {
    type: DataTypes.FLOAT,
    allowNull: true, // Giờ làm việc chính thức
  },
  overtime: {
    type: DataTypes.FLOAT,
    allowNull: true, // Giờ làm thêm
  },
  isPaid: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false, // Đã tính lương chưa
  }
}, {
  tableName: "attendances", // Tên bảng
  timestamps: true,         // Tự động thêm createdAt, updatedAt
});

module.exports = Attendance;
