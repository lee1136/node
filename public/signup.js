import { auth, db } from './firebaseConfig.js';
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

// 회원가입 폼 이벤트 핸들러
const registerForm = document.getElementById('registerForm');
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId = document.getElementById('userId').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorMessage = document.getElementById('errorMessage');

    if (password.length < 6) {
        errorMessage.textContent = "비밀번호는 최소 6자 이상이어야 합니다.";
        return;
    }

    if (password !== confirmPassword) {
        errorMessage.textContent = "비밀번호가 일치하지 않습니다.";
        return;
    }

    try {
        const email = `${userId}@example.com`;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Firestore에 사용자 정보 저장 (admin 필드 추가)
        await setDoc(doc(db, 'users', userId), {
            uid: user.uid,
            createdAt: new Date(),
            admin: false  // 기본적으로 일반 유저로 설정
        });

        alert('회원가입 성공! 로그인 페이지로 이동합니다.');
        window.location.href = 'index.html'; 

    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            errorMessage.textContent = "이미 사용 중인 아이디입니다.";
        } else {
            errorMessage.textContent = '회원가입 실패: ' + error.message;
        }
    }
});
