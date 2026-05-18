const BASE_URL = "http://192.168.2.45:3001";
const BASE_URL2 = "http://172.20.0.209:3001";
const BASE_4G = "http://192.168.43.108:3001";
const BASE_URL_BEEP = "http://172.16.98.254:3001"
const BASR_URL_THEBOOKS = "http://192.168.1.12:3001"
const BASE_URL_IP_100 = "http://100.110.220.42:3001"

export const API_ENDPOINTS = {
  LOGIN: `${BASE_URL_IP_100}/api/auth/login`,
  UPLOAD_FACE: `${BASE_URL_IP_100}/api/attendance/testRegister`,
  RECOGNIZE: `${BASE_URL_IP_100}/api/attendance/checkAttendance`,
  ATTENDANCE_HISTORY: (employeeId: string) => `${BASE_URL_IP_100}/api/attendance/history/${employeeId}`,
  VERIFY_ATTENDANCE: `${BASE_URL_IP_100}/api/attendance/verify`,
  DASHBOARD: (userId: string) => `${BASE_URL_IP_100}/api/employees/dashboard/${userId}`,
  LEAVE_HISTORY: (employeeId: string) => `${BASE_URL_IP_100}/api/leave/history/${employeeId}`,
  CREATE_LEAVE: `${BASE_URL_IP_100}/api/leave/create`,
};

export default {
  BASE_URL_IP_100,
  ...API_ENDPOINTS,
};
