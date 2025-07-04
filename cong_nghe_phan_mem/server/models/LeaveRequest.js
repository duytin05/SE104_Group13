const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const LeaveRequest = sequelize.define("LeaveRequest", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  leaveType: {
    type: DataTypes.ENUM,
    values: ['annual', 'sick', 'personal', 'maternity', 'emergency'],
    allowNull: false,
    comment: 'annual: Nghỉ phép năm, sick: Nghỉ ốm, personal: Nghỉ cá nhân, maternity: Nghỉ thai sản, emergency: Nghỉ khẩn cấp'
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  days: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Số ngày nghỉ (có thể là 0.5 cho nửa ngày)'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Lý do nghỉ phép'
  },
  status: {
    type: DataTypes.ENUM,
    values: ['pending', 'approved', 'rejected'],
    defaultValue: 'pending',
    comment: 'pending: Chờ duyệt, approved: Đã duyệt, rejected: Từ chối'
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    },
    comment: 'ID của người duyệt đơn'
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Thời gian duyệt đơn'
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Lý do từ chối (nếu có)'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Ghi chú thêm'
  }
}, {
  tableName: 'LeaveRequests',
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'startDate']
    },
    {
      fields: ['status']
    }
  ]
});

// Định nghĩa mối quan hệ
LeaveRequest.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'employee'
});

LeaveRequest.belongsTo(User, { 
  foreignKey: 'approvedBy', 
  as: 'approver'
});

User.hasMany(LeaveRequest, { 
  foreignKey: 'userId'
});

// Hook để tính số ngày nghỉ tự động
LeaveRequest.beforeSave(async (leaveRequest, options) => {
  if (leaveRequest.startDate && leaveRequest.endDate) {
    const startDate = new Date(leaveRequest.startDate);
    const endDate = new Date(leaveRequest.endDate);
    
    // Tính số ngày (bao gồm cả ngày bắt đầu và kết thúc)
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    
    // Trừ đi cuối tuần (nếu cần)
    let workDays = 0;
    for (let i = 0; i < daysDiff; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dayOfWeek = currentDate.getDay();
      
      // Chỉ tính ngày làm việc (thứ 2-6)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        workDays++;
      }
    }
    
    leaveRequest.days = workDays;
  }
});

module.exports = LeaveRequest;