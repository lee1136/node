import { db, auth } from './firebaseConfig.js';
import { collection, getDocs, query, where, limit, startAfter, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

let isAdmin = false; // 관리자인지 여부 확인
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
            postQuery = query(currentQuery, startAfter(lastVisible), limit(pageSize)); // 이전 쿼리의 마지막 문서부터 시작
        }

        const postSnapshot = await getDocs(postQuery);
        let postList = postSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 마지막으로 로드한 문서를 저장하여 다음 페이지에서 사용
        if (postSnapshot.docs.length > 0) {
            lastVisible = postSnapshot.docs[postSnapshot.docs.length - 1]; // 마지막 문서 저장
        } else {
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
                const videoElement = document.createElement('video');
                videoElement.src = thumbnailURL;
                videoElement.controls = true;
                videoElement.style.width = '100%'; 
                postElement.appendChild(videoElement);
            } else {
                const imgElement = document.createElement('img');
                imgElement.src = thumbnailURL;
                imgElement.alt = `Thumbnail for post ${post.name}`;
                postElement.appendChild(imgElement);
            }

            // 게시물을 클릭하면 상세 페이지로 이동
            postElement.addEventListener('click', () => {
                window.location.href = `detail.html?id=${post.id}`;
            });

            postGrid.appendChild(postElement);
        });

        // "다음 페이지" 버튼 표시 여부 결정
        const nextPageButton = document.getElementById('next-page-btn');
        if (postList.length < pageSize || !lastVisible) {
            nextPageButton.style.display = 'none';
        } else {
            nextPageButton.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        const postGrid = document.getElementById('post-grid');
        postGrid.innerHTML = '<p>Failed to load posts</p>';
    }
};

const checkAdminPrivileges = async (user) => {
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const isAdmin = userData.admin || false; // admin 필드를 boolean으로 가져옴
            
            // 관리자 권한에 따라 버튼을 보이거나 숨김
            const uploadButton = document.getElementById('upload-btn');
            const signupButton = document.getElementById('signup-btn');
            
            if (isAdmin) {
                uploadButton.style.display = 'block'; // 관리자일 경우 버튼을 보이게 함
                signupButton.style.display = 'block';
            } else {
                uploadButton.style.display = 'none'; // 일반 사용자일 경우 버튼 숨김
                signupButton.style.display = 'none';
            }
        } else {
            console.log('No user document found');
        }
    } catch (error) {
        console.error('Error checking admin privileges:', error);
    }
};

// 페이지가 로드된 후 이벤트 리스너 및 초기 데이터 로드
document.addEventListener('DOMContentLoaded', () => {
    // Firebase 인증 상태 변화 감지
    onAuthStateChanged(auth, (user) => {
        if (user) {
            checkAdminPrivileges(user);  // 관리자 여부 확인
        } else {
            console.log('User is not signed in.');
        }
    });

    // 게시물 목록 로드
    loadPosts();

    // 검색 기능 처리
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim();
        loadPosts(false, searchTerm); 
    });

    // 다음 페이지로 이동
    const nextPageButton = document.getElementById('next-page-btn');
    if (nextPageButton) {
        nextPageButton.addEventListener('click', () => loadPosts(true));
    }

    // 업로드 버튼 클릭 시 업로드 페이지로 이동
    const uploadButton = document.getElementById('upload-btn');
    if (uploadButton) {
        uploadButton.addEventListener('click', () => {
            window.location.href = 'upload.html';
        });
    }

    // 회원가입 버튼 클릭 시 회원가입 페이지로 이동
    const signupButton = document.getElementById('signup-btn');
    if (signupButton) {
        signupButton.addEventListener('click', () => {
            window.location.href = 'signup.html';
        });
    }
});
