import { db, auth } from './firebaseConfig.js';
import { collection, getDocs, query, where, limit, startAfter, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

let isAdmin = false;
let lastVisible = null; // 마지막으로 로드한 게시물의 참조를 저장
const pageSize = 2; // 한 페이지당 게시물 수
let currentQuery = null; // 현재 쿼리 저장 (검색 쿼리 및 Type 필터링 포함)

// Firestore에서 데이터를 로드하여 대시보드에 표시하는 함수
const loadPosts = async (isNextPage = false, searchTerm = '', selectedType = '') => {
    try {
        const postCollection = collection(db, "posts");
        let postQuery = query(postCollection, limit(pageSize));

        // Type이 선택된 경우 해당 Type으로 필터링
        if (selectedType && selectedType !== 'all') {
            postQuery = query(postCollection, where("type", "array-contains", selectedType), limit(pageSize));
        }

        // 검색어가 입력된 경우
        if (searchTerm) {
            postQuery = query(postCollection, where("name", ">=", searchTerm), where("name", "<=", searchTerm + '\uf8ff'), limit(pageSize));
        }

        // 페이징 처리
        if (isNextPage && lastVisible) {
            console.log('Loading next page, starting after:', lastVisible);
            postQuery = query(currentQuery, startAfter(lastVisible), limit(pageSize)); // 이전 쿼리의 마지막 문서부터 시작
        }

        const postSnapshot = await getDocs(postQuery);
        let postList = postSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 마지막으로 로드한 문서를 저장하여 다음 페이지에서 사용
        if (postSnapshot.docs.length > 0) {
            lastVisible = postSnapshot.docs[postSnapshot.docs.length - 1]; // 마지막 문서 저장
            console.log('New lastVisible:', lastVisible);
        } else {
            console.log('No more posts to load.');
            lastVisible = null; // 더 이상 게시물이 없으면 lastVisible을 null로 설정
        }

        currentQuery = postQuery; // 현재 쿼리 저장

        const postGrid = document.getElementById('post-grid');
        postGrid.innerHTML = '';

        if (postList.length === 0) {
            postGrid.innerHTML = '<p>No posts available</p>';
            return;
        }

        postList.forEach(post => {
            const thumbnailURL = post.thumbnail || 'default-thumbnail.png';  // 기본 이미지 설정
            const mediaType = thumbnailURL.split('.').pop();  // 파일 확장자로 타입 추출

            const postElement = document.createElement('div');
            postElement.classList.add('post-item');

            if (mediaType === 'mp4' || mediaType === 'webm' || mediaType === 'ogg') {
                // 영상 파일일 경우 비디오 태그 생성
                const videoElement = document.createElement('video');
                videoElement.src = thumbnailURL;
                videoElement.controls = true;  // 비디오 컨트롤러 추가
                videoElement.style.width = '100%';  // 비디오 크기 조정
                postElement.appendChild(videoElement);
            } else {
                // 이미지 파일일 경우 이미지 태그 생성
                const imgElement = document.createElement('img');
                imgElement.src = thumbnailURL;
                imgElement.alt = `Thumbnail for post ${post.name}`;
                postElement.appendChild(imgElement);
            }

            // 게시물을 클릭하면 상세 페이지로 이동
            postElement.addEventListener('click', () => {
                window.location.href = `detail.html?id=${post.id}`;  // 제품 ID를 URL에 포함
            });

            postGrid.appendChild(postElement);
        });

        // "다음 페이지" 버튼 표시 여부 결정
        const nextPageButton = document.getElementById('next-page-btn');
        if (postList.length < pageSize || !lastVisible) {
            nextPageButton.style.display = 'none'; // 더 이상 게시물이 없으면 숨김
        } else {
            nextPageButton.style.display = 'block'; // 다음 페이지가 있을 경우 표시
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        const postGrid = document.getElementById('post-grid');
        postGrid.innerHTML = '<p>Failed to load posts</p>';
    }
};

// 관리자 여부 확인 함수
const checkAdminPrivileges = async (user) => {
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            // Firestore의 admin 필드를 사용하여 관리자 여부 확인
            isAdmin = userDoc.data().admin || false;
            console.log('Admin status:', isAdmin); // 관리자인지 확인

            // 관리자 권한에 따라 버튼을 제어 (버튼을 관리자만 볼 수 있도록)
            const uploadButton = document.getElementById('upload-btn');
            const signupButton = document.getElementById('signup-btn');

            if (isAdmin) {
                if (uploadButton) uploadButton.style.display = 'block';
                if (signupButton) signupButton.style.display = 'block';
            } else {
                if (uploadButton) uploadButton.style.display = 'none';
                if (signupButton) signupButton.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error checking admin privileges:', error);
    }
};

// 페이지가 로드된 후에 이벤트 리스너 및 초기 데이터를 불러옴
document.addEventListener('DOMContentLoaded', () => {
    // Firebase 인증 상태 변화 감지
    onAuthStateChanged(auth, (user) => {
        if (user) {
            checkAdminPrivileges(user);  // 관리자 여부 확인 후 버튼 제어
            // 게시물 목록 로드
            loadPosts();
        } else {
            console.log('User is not signed in.');
            // 로그아웃된 경우 버튼 숨기기
            const uploadButton = document.getElementById('upload-btn');
            const signupButton = document.getElementById('signup-btn');
            if (uploadButton) uploadButton.style.display = 'none';
            if (signupButton) signupButton.style.display = 'none';
        }
    });

    // 검색 기능 처리
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim();
        loadPosts(false, searchTerm); // 검색어가 변경될 때마다 검색
    });

    // 다음 페이지로 이동하는 함수
    const nextPageButton = document.getElementById('next-page-btn');
    if (nextPageButton) {
        nextPageButton.addEventListener('click', () => loadPosts(true)); // 다음 페이지 로드
    }

    // 업로드 버튼 클릭 시 업로드 페이지로 이동
    const uploadButton = document.getElementById('upload-btn');
    if (uploadButton) {
        uploadButton.addEventListener('click', () => {
            window.location.href = 'upload.html'; // 업로드 페이지로 이동
        });
    }

    // 회원가입 버튼 클릭 시 회원가입 페이지로 이동
    const signupButton = document.getElementById('signup-btn');
    if (signupButton) {
        signupButton.addEventListener('click', () => {
            window.location.href = 'signup.html';  // 회원가입 페이지로 이동
        });
    }
});
