import { db } from './firebaseConfig.js';
import { doc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { checkAdminPermission } from './checkAdminPermission.js';

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
        const postDoc = await getDoc(doc(db, "posts", postId));
        if (postDoc.exists()) {
            const postData = postDoc.data();
            postNameElement.textContent = postData.name || "No Product Number";

            // 미디어 및 게시물 정보 표시
            displayMainMedia(postData.media[0]);
            postData.media.slice(1).forEach((mediaURL, index) => createThumbnail(mediaURL, index));

            postInfoSection.innerHTML = `
                <p><strong>Product Number:</strong> ${postData.productNumber || 'N/A'}</p>
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

// 메인 미디어 표시
const displayMainMedia = (mediaURL) => {
    const mediaType = mediaURL.split('.').pop().split('?')[0];
    mainMediaContainer.innerHTML = '';
    if (['mp4', 'webm', 'ogg'].includes(mediaType)) {
        const videoElement = document.createElement('video');
        videoElement.src = mediaURL;
        videoElement.controls = true;
        videoElement.autoplay = true;
        videoElement.loop = true;
        videoElement.muted = true;
        videoElement.style.width = '80%';
        mainMediaContainer.appendChild(videoElement);
    } else {
        const imgElement = document.createElement('img');
        imgElement.src = mediaURL;
        imgElement.alt = "Main media image";
        imgElement.style.width = '60%';
        mainMediaContainer.appendChild(imgElement);
    }
};

// 썸네일 생성
const createThumbnail = (mediaURL, index) => {
    const imgElement = document.createElement('img');
    imgElement.src = mediaURL;
    imgElement.alt = `Thumbnail ${index}`;
    imgElement.style.cursor = 'pointer';
    imgElement.addEventListener('click', () => displayMainMedia(mediaURL));
    thumbnailGallery.appendChild(imgElement);
};

// 게시물 삭제
const deletePost = async () => {
    if (confirm("Are you sure you want to delete this post?")) {
        try {
            await deleteDoc(doc(db, "posts", postId));
            alert("Post deleted successfully.");
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error("Error deleting post:", error);
            alert("Failed to delete post.");
        }
    }
};

// 페이지가 로드된 후 관리자 권한 확인 및 이벤트 리스너 추가
document.addEventListener('DOMContentLoaded', async () => {
    const isAdmin = await checkAdminPermission();

    // 관리자가 아니면 수정, 삭제 버튼 숨김
    if (!isAdmin) {
        document.getElementById('edit-btn').style.display = 'none';
        document.getElementById('delete-btn').style.display = 'none';
    }

    document.getElementById('home-btn').addEventListener('click', () => window.location.href = 'dashboard.html');
    document.getElementById('edit-btn').addEventListener('click', () => window.location.href = `edit.html?id=${postId}`);
    document.getElementById('delete-btn').addEventListener('click', deletePost);

    loadPostDetail();
});
