import { db } from './firebaseConfig.js';
import { collection, getDocs, query, where, limit, startAfter } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

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
            postQuery = query(postCollection, where("productNumber", ">=", searchTerm), where("productNumber", "<=", searchTerm + '\uf8ff'), limit(pageSize));
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
                imgElement.alt = `Thumbnail for post ${post.productNumber}`;
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

// 관리자 권한 확인 함수
const checkAdmin = async () => {
    return new Promise((resolve, reject) => {
        const auth = getAuth();
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists() && userDoc.data().isAdmin) {
                    resolve(true); // 관리자
                } else {
                    resolve(false); // 관리자 아님
                }
            } else {
                resolve(false); // 로그인하지 않음
            }
        });
    });
};

// 페이지가 로드된 후에 이벤트 리스너 및 초기 데이터를 불러옴
document.addEventListener('DOMContentLoaded', async () => {
    // 게시물 목록 로드
    loadPosts();

    // 관리자 권한 확인
    const isAdmin = await checkAdmin();

    const uploadButton = document.getElementById('upload-btn');
    const signupButton = document.getElementById('signup-btn');

    if (isAdmin) {
        uploadButton.style.display = 'block';
        signupButton.style.display = 'block';
    } else {
        uploadButton.style.display = 'none';
        signupButton.style.display = 'none';
    }

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
    if (uploadButton) {
        uploadButton.addEventListener('click', () => {
            window.location.href = 'upload.html'; // 업로드 페이지로 이동
        });
    }

    // 회원가입 버튼 클릭 시 회원가입 페이지로 이동
    if (signupButton) {
        signupButton.addEventListener('click', () => {
            window.location.href = 'signup.html';  // 회원가입 페이지로 이동
        });
    }
});
