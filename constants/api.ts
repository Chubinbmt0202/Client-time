const BASE_URL = "http://192.168.2.45:3001";
const BASE_URL2 = "http://172.20.0.209:3001";
const BASE_URL_3 = "http://172.16.96.33:3001";

export const API_ENDPOINTS = {
  LOGIN: `${BASE_URL_3}/api/auth/login`,
  UPLOAD_FACE: `${BASE_URL_3}/api/attendance/testRegister`,
  RECOGNIZE: `${BASE_URL_3}/api/attendance/checkAttendance`,
  ATTENDANCE: (userId: string) => `${BASE_URL_3}/api/attendance/${userId}`,
  VERIFY_ATTENDANCE: `${BASE_URL_3}/api/attendance/verify`,
};

export default {
  BASE_URL_3,
  ...API_ENDPOINTS,
};
