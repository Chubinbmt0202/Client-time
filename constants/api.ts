const BASE_URL_IP_100 = "http://192.168.1.23:3001"

export const API_ENDPOINTS = {
  LOGIN: `${BASE_URL_IP_100}/api/auth/login`,
  UPLOAD_FACE: `${BASE_URL_IP_100}/api/attendance/testRegister`,
  RECOGNIZE: `${BASE_URL_IP_100}/api/attendance/checkAttendance`,
  ATTENDANCE_HISTORY: (employeeId: string) => `${BASE_URL_IP_100}/api/attendance/history/${employeeId}`,
  VERIFY_ATTENDANCE: `${BASE_URL_IP_100}/api/attendance/verify`,
  DASHBOARD: (userId: string) => `${BASE_URL_IP_100}/api/employees/dashboard/${userId}`,
  LEAVE_HISTORY: (employeeId: string) => `${BASE_URL_IP_100}/api/leave/history/${employeeId}`,
  CREATE_LEAVE: `${BASE_URL_IP_100}/api/leave/create`,
  NOTIFICATIONS: (employeeId: string) => `${BASE_URL_IP_100}/api/notifications/employee/${employeeId}`,
  MARK_NOTIFICATION_READ: (id: string) => `${BASE_URL_IP_100}/api/notifications/mark-read/${id}`,
  MARK_ALL_NOTIFICATIONS_READ: `${BASE_URL_IP_100}/api/notifications/mark-all-read`,
  DELETE_NOTIFICATION: (id: string) => `${BASE_URL_IP_100}/api/notifications/delete/${id}`,
  UPDATE_FCM_TOKEN: `${BASE_URL_IP_100}/api/employees/fcm-token`,
  CREATE_OT: `${BASE_URL_IP_100}/api/ot/create`,
  OT_HISTORY: (employeeId: string) => `${BASE_URL_IP_100}/api/ot/history/${employeeId}`,
  UPDATE_PROFILE: (id: string) => `${BASE_URL_IP_100}/api/employees/update/${id}`,
  CHANGE_PASSWORD: (id: string) => `${BASE_URL_IP_100}/api/employees/change-password/${id}`,
  GET_ALL_SHIFTS: `${BASE_URL_IP_100}/api/shifts/getAllShifts`,
  GET_MY_SHIFT: (id: string) => `${BASE_URL_IP_100}/api/shifts/myShift/${id}`,
};

export default {
  BASE_URL_IP_100,
  ...API_ENDPOINTS,
};
