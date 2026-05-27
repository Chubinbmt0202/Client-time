import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../constants/api';

// Configure how notifications are presented when the app is running in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1C75FF',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Không xin được quyền thông báo đẩy!');
      return null;
    }

    // Get EAS Project ID from Expo config
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.warn("EAS Project ID not found in configurations.");
    }

    try {
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log("Expo Push Token:", token);
    } catch (error) {
      console.error("Lỗi khi lấy Expo Push Token:", error);
    }
  } else {
    console.log('Cần dùng thiết bị thật để nhận thông báo đẩy. Sử dụng token ảo (mock) để test Backend.');
    token = `ExponentPushToken[mock_token_for_emulator_${Platform.OS}]`;
  }

  return token;
}

export async function savePushTokenToBackend(employeeId: string, token: string) {
  if (!employeeId || !token) return;
  try {
    const response = await fetch(API_ENDPOINTS.UPDATE_FCM_TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employeeId: employeeId,
        fcmToken: token,
      }),
    });
    const result = await response.json();
    if (response.ok && result.success) {
      console.log('Đã lưu Push Token lên backend thành công');
      await AsyncStorage.setItem('pushToken', token);
    } else {
      console.error('Không thể lưu Push Token lên backend:', result.message);
    }
  } catch (error) {
    console.error('Lỗi kết nối khi gửi Push Token:', error);
  }
}
