const BASE_URL = "http://192.168.2.45:3001";
const BASE_URL2 = "http://172.20.0.209:3001";

export const API_ENDPOINTS = {
  LOGIN: `${BASE_URL2}/api/auth/login`,
  UPLOAD_FACE: `${BASE_URL2}/api/employees/upload-face`,
  RECOGNIZE: `${BASE_URL2}/api/employees/recognize`,
  ATTENDANCE: (userId: string) => `${BASE_URL2}/api/attendance/${userId}`,
  VERIFY_ATTENDANCE: `${BASE_URL2}/api/attendance/verify`,
};

export default {
  BASE_URL2,
  ...API_ENDPOINTS,
};
