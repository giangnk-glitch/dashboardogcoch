window.OEG_AUTH_CONFIG = {
  // Google OAuth Client ID đang dùng chung với oeg-api.js.
  clientId: '273176228434-pj8aoucadhehrqj638o5da5e0l36e4t6.apps.googleusercontent.com',

  // Khi vận hành thật: đổi thành true để chỉ email có trong users mới vào được.
  requireKnownUser: false,

  // Nếu muốn khóa theo domain, thêm ví dụ: ['oeg.vn', 'oeg.com.vn'].
  allowedDomains: [],

  // Role mặc định cho email chưa có trong bảng users khi requireKnownUser=false.
  // Để tránh tự khóa dashboard trong giai đoạn setup, mặc định là admin.
  defaultRole: 'admin',

  // Khai báo user thật ở đây.
  // email phải viết thường.
  users: [
    // { email: 'giangnk@oeg.vn', name: 'Admin OEG', role: 'admin', branch: 'all', active: true },
    // { email: 'finance@oeg.vn', name: 'Finance', role: 'finance', branch: 'all', active: true },
    // { email: 'ogccm@oeg.vn', name: 'Lead Stadium', role: 'branch_lead', branch: 'Stadium', active: true },
    // { email: 'gc.ops@oeg.vn', name: 'Viewer', role: 'viewer', branch: 'all', active: true }
  ]
};
