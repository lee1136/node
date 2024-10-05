import { auth, db } from './firebaseConfig.js';
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

// 회원가입 폼 이벤트 핸들러
const registerForm = document.getElementById('registerForm');
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId = document.getElementById('userId').value; // 사용자 아이디 입력값
    const password = document.getElementById('password').value; // 비밀번호 입력값
    const confirmPassword = document.getElementById('confirmPassword').value; // 비밀번호 확인
    const errorMessage = document.getElementById('errorMessage'); // 오류 메시지 표시 영역

    // 비밀번호 유효성 검사
    if (password.length < 6) {
        errorMessage.textContent = "비밀번호는 최소 6자 이상이어야 합니다.";
        return;
    }

    if (password !== confirmPassword) {
        errorMessage.textContent = "비밀번호가 일치하지 않습니다.";
        return;
    }

    try {
        // 아이디를 이메일 형식으로 변환
        const email = `${userId}@example.com`;

        // Firebase 인증을 이용해 회원가입 처리
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Firestore에 사용자 정보 저장 (관리자 여부 추가 가능)
        await setDoc(doc(db, 'users', userId), {
            uid: user.uid,
            createdAt: new Date(),
            admin: false,  // 기본적으로 admin이 false로 설정됨
        });

        alert('회원가입 성공! 로그인 페이지로 이동합니다.');
        window.location.href = 'index.html'; // 회원가입 후 로그인 페이지로 이동

    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            errorMessage.textContent = "이미 사용 중인 아이디입니다.";
        } else {
            errorMessage.textContent = '회원가입 실패: ' + error.message;
        }
    }
});
