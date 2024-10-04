// 게시물 ID 가져오기
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');

const postNameElement = document.getElementById('post-name');
const mainMediaContainer = document.getElementById('main-media-container');
const thumbnailGallery = document.getElementById('thumbnail-gallery');
const postInfoSection = document.getElementById('post-info');

// Firestore에서 게시물 데이터를 불러와 상세 페이지에 표시하는 함수
const loadPostDetail = async () => {
    if (!postId) {
        postNameElement.textContent = 'Post Not Found';
        return;
    }

    try {
        // Firestore에서 게시물 정보 가져오기
        const postDoc = await getDoc(doc(db, "posts", postId));
        
        if (postDoc.exists()) {
            const postData = postDoc.data();
            
            // productNumber 대신 name 필드로 변경
            postNameElement.textContent = postData.name || "No Product Name"; // name 필드를 사용
            
            // 메인 미디어 표시
            if (postData.media && postData.media.length > 0) {
                const mainMediaURL = postData.media[0];
                displayMainMedia(mainMediaURL);

                // 썸네일 갤러리에 나머지 미디어 추가
                postData.media.forEach((mediaURL, index) => {
                    if (index > 0) {
                        createThumbnail(mediaURL, index);
                    }
                });
            } else {
                mainMediaContainer.innerHTML = '<p>No media available</p>';
            }

            // 게시물 정보 표시
            postInfoSection.innerHTML = `
                <p><strong>Product Name:</strong> ${postData.name || 'N/A'}</p>
                <p><strong>Type:</strong> ${Array.isArray(postData.type) ? postData.type.join(', ') : postData.type || 'N/A'}</p>
                <p><strong>Size:</strong> ${postData.size || 'N/A'}</p>
                <p><strong>Weight:</strong> ${postData.weight || 'N/A'}g</p>
                <p><strong>Content:</strong> ${postData.content || 'No content available'}</p>
            `;
        } else {
            postNameElement.textContent = 'Post Not Found';
        }
    } catch (error) {
        console.error("Error loading post details:", error);
        postNameElement.textContent = 'Error loading post';
    }
};

// 메인 미디어 표시 함수
const displayMainMedia = (mediaURL) => {
    const mediaType = mediaURL.split('.').pop().split('?')[0];
    mainMediaContainer.innerHTML = '';
    if (['mp4', 'webm', 'ogg'].includes(mediaType)) {
        const videoElement = document.createElement('video');
        videoElement.src = mediaURL;
        videoElement.controls = true;
        videoElement.autoplay = true; // 자동 재생
        videoElement.loop = true; // 무한 반복
        videoElement.muted = true; // 자동 재생 시 무음 설정
        videoElement.style.width = '80%'; // 동영상 크기
        mainMediaContainer.appendChild(videoElement);
    } else {
        const imgElement = document.createElement('img');
        imgElement.src = mediaURL;
        imgElement.alt = "Main media image";
        imgElement.style.width = '60%';
        mainMediaContainer.appendChild(imgElement);
    }
};

// 썸네일 생성 함수
const createThumbnail = (mediaURL, index) => {
    const imgElement = document.createElement('img');
    imgElement.src = mediaURL;
    imgElement.alt = `Thumbnail ${index}`;
    imgElement.style.cursor = 'pointer';
    imgElement.addEventListener('click', () => {
        displayMainMedia(mediaURL);
    });
    thumbnailGallery.appendChild(imgElement);
};

// 게시물 삭제 함수
const deletePost = async () => {
    const confirmation = confirm("Are you sure you want to delete this post?");
    if (confirmation) {
        try {
            await deleteDoc(doc(db, "posts", postId));
            alert("Post deleted successfully.");
            window.location.href = 'dashboard.html'; // 대시보드로 리다이렉트
        } catch (error) {
            console.error("Error deleting post:", error);
            alert("Failed to delete post.");
        }
    }
};

// 페이지가 로드된 후 이벤트 리스너 추가
document.addEventListener('DOMContentLoaded', () => {
    const homeButton = document.getElementById('home-btn');
    const editButton = document.getElementById('edit-btn');
    const deleteButton = document.getElementById('delete-btn'); // 삭제 버튼

    // Home 버튼 이벤트 리스너
    if (homeButton) {
        homeButton.addEventListener('click', () => {
            window.location.href = 'dashboard.html'; // 대시보드 페이지로 이동
        });
    }

    // Edit 버튼 이벤트 리스너
    if (editButton) {
        editButton.addEventListener('click', () => {
            window.location.href = `edit.html?id=${postId}`; // 수정 페이지로 이동
        });
    }

    // Delete 버튼 이벤트 리스너
    if (deleteButton) {
        deleteButton.addEventListener('click', deletePost); // 삭제 버튼 클릭 시 삭제 함수 호출
    }

    // 게시물 세부 정보 로드
    loadPostDetail();
});
