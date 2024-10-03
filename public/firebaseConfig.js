// Firebase SDK 모듈 가져오기
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js';

// Firebase 프로젝트 설정 (Firebase Console에서 복사한 설정 값)
const firebaseConfig = {
  apiKey: "AIzaSyDFysg8I_qKtDqDJLWg1_npTPBWRMM_5WY",
  authDomain: "jjji-4240b.firebaseapp.com",
  projectId: "jjji-4240b",
  storageBucket: "jjji-4240b.appspot.com",
  messagingSenderId: "876101785840",
  appId: "1:876101785840:web:6e58681ea9c9780e454a35",
  measurementId: "G-03999XR4JS"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 초기화 (Firestore, Auth, Storage)
const db = getFirestore(app);    // Firestore 인스턴스
const auth = getAuth(app);       // Firebase Authentication 인스턴스
const storage = getStorage(app); // Firebase Storage 인스턴스

// 필요한 모듈들을 export하여 다른 파일에서 사용 가능하게 함
export { db, auth, storage };
