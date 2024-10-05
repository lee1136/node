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

            postElement.addEventListener('click', () => {
                window.location.href = `detail.html?id=${post.id}`;  // 상세 페이지로 이동
            });

            postGrid.appendChild(postElement);
        });

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
            const userData = userDoc.data();
            console.log("Admin status: ", userData.admin);  // 관리자 여부 확인을 위한 로그
            isAdmin = userData.admin || false;
        }
    } catch (error) {
        console.error("Error fetching admin status: ", error);
    }

    // 버튼 표시 여부 설정
    const uploadButton = document.getElementById('upload-btn');
    const signupButton = document.getElementById('signup-btn');

    if (!isAdmin) {
        if (uploadButton) uploadButton.style.display = 'none';
        if (signupButton) signupButton.style.display = 'none';
    } else {
        if (uploadButton) uploadButton.style.display = 'block';
        if (signupButton) signupButton.style.display = 'block';
    }
};

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    const uploadButton = document.getElementById('upload-btn');
    const signupButton = document.getElementById('signup-btn');

    // 페이지 로딩 시 버튼을 숨기고 관리자 확인 후에만 다시 표시
    uploadButton.style.display = 'none';
    signupButton.style.display = 'none';

    onAuthStateChanged(auth, (user) => {
        if (user) {
            checkAdminPrivileges(user);  // 관리자 여부 확인
        } else {
            console.log('User is not signed in.');
            uploadButton.style.display = 'none';
            signupButton.style.display = 'none';
        }
    });

    loadPosts();  // 게시물 목록 로드

    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim();
        loadPosts(false, searchTerm); // 검색어 변경 시 검색
    });

    const nextPageButton = document.getElementById('next-page-btn');
    if (nextPageButton) {
        nextPageButton.addEventListener('click', () => loadPosts(true));  // 다음 페이지 로드
    }

    // 업로드 버튼 클릭 시 업로드 페이지로 이동
    if (uploadButton) {
        uploadButton.addEventListener('click', () => {
            window.location.href = 'upload.html';  // 업로드 페이지로 이동
        });
    }

    // 회원가입 버튼 클릭 시 회원가입 페이지로 이동
    if (signupButton) {
        signupButton.addEventListener('click', () => {
            window.location.href = 'signup.html';  // 회원가입 페이지로 이동
        });
    }
});
