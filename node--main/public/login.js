import { auth } from './firebaseConfig.js';
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

// 로그인 폼 이벤트 핸들러
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 사용자 입력값 가져오기
    const userId = document.getElementById('userId').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    try {
        // 아이디를 이메일처럼 처리
        const email = `${userId}@example.com`;
        
        // Firebase 인증
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        alert('로그인 성공!');
        window.location.href = 'dashboard.html'; // 로그인 성공 후 리디렉션

    } catch (error) {
        switch (error.code) {
            case 'auth/wrong-password':
                errorMessage.textContent = "비밀번호가 잘못되었습니다.";
                break;
            case 'auth/user-not-found':
                errorMessage.textContent = "해당 아이디의 사용자를 찾을 수 없습니다.";
                break;
            case 'auth/invalid-email':
                errorMessage.textContent = "유효하지 않은 아이디 형식입니다.";
                break;
            case 'auth/too-many-requests':
                errorMessage.textContent = "너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.";
                break;
            default:
                errorMessage.textContent = "로그인 실패: " + error.message;
        }
    }
});
