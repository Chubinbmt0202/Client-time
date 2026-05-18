import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Cấu hình Firebase Realtime Database Client
const firebaseConfig = {
  databaseURL: "https://mindcheck-68c9f-default-rtdb.firebaseio.com",
  projectId: "mindcheck-68c9f",
};

// Khởi tạo Firebase App
const app = initializeApp(firebaseConfig);

// Khởi tạo Realtime Database instance
export const database = getDatabase(app);
