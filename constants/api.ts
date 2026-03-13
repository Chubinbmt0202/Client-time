const BASE_URL = "http://192.168.2.45:3001";

export const API_ENDPOINTS = {
  LOGIN: `${BASE_URL}/api/auth/login`,
  UPLOAD_FACE: `${BASE_URL}/api/employees/upload-face`,
  ATTENDANCE: (userId: string) => `${BASE_URL}/api/attendance/${userId}`,
};

export default {
  BASE_URL,
  ...API_ENDPOINTS,
};
