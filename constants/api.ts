const BASE_URL = "http://192.168.2.45:3001";
const BASE_URL2 = "http://172.20.0.209:3001";
const BASE_4G = "http://192.168.43.108:3001";
const BASE_URL_BEEP = "http://172.16.98.254:3001"
const BASR_URL_THEBOOKS = "http://192.168.1.12:3001"

export const API_ENDPOINTS = {
  LOGIN: `${BASR_URL_THEBOOKS}/api/auth/login`,
  UPLOAD_FACE: `${BASR_URL_THEBOOKS}/api/attendance/testRegister`,
  RECOGNIZE: `${BASR_URL_THEBOOKS}/api/attendance/checkAttendance`,
  ATTENDANCE_HISTORY: (employeeId: string) => `${BASR_URL_THEBOOKS}/api/attendance/history/${employeeId}`,
  VERIFY_ATTENDANCE: `${BASR_URL_THEBOOKS}/api/attendance/verify`,
  DASHBOARD: (userId: string) => `${BASR_URL_THEBOOKS}/api/employees/dashboard/${userId}`,
};

export default {
  BASR_URL_THEBOOKS,
  ...API_ENDPOINTS,
};
