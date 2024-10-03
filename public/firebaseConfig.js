// Firebase SDK 모듈 가져오기
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js';

// Firebase 프로젝트 설정 (Firebase Console에서 복사한 설정 값)
const firebaseConfig = {
  apiKey: "AIzaSyCabtdWlXxsBCHvOehJaJa3PcANGwhDWjo",
  authDomain: "ekdlth-1760c.firebaseapp.com",
  projectId: "ekdlth-1760c",
  storageBucket: "ekdlth-1760c.appspot.com",
  messagingSenderId: "224352917479",
  appId: "1:224352917479:web:26c5d44ffa897b4558cf42",
  measurementId: "G-ZQE61NRX9K"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 초기화 (Firestore, Auth, Storage)
const db = getFirestore(app);    // Firestore 인스턴스
const auth = getAuth(app);       // Firebase Authentication 인스턴스
const storage = getStorage(app); // Firebase Storage 인스턴스

// 필요한 모듈들을 export하여 다른 파일에서 사용 가능하게 함
export { db, auth, storage };
