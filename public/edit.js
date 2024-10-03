import { db, storage } from './firebaseConfig.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

// 게시물 ID 가져오기
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');

const postNameElement = document.getElementById('post-name');
const productNameInput = document.getElementById('product-name');
const productTypeInput = document.getElementById('product-type');
const productSizeInput = document.getElementById('product-size');
const productWeightInput = document.getElementById('product-weight');
const productContentInput = document.getElementById('product-content');
const mainMediaContainer = document.getElementById('main-media-container');
const thumbnailGallery = document.getElementById('thumbnail-gallery');
const mediaFilesInput = document.getElementById('mediaFiles');
const previewGrid = document.getElementById('preview-grid');
const deleteMediaBtn = document.getElementById('delete-media-btn');

let existingMediaURLs = [];
let selectedMediaIndex = null;
let newMediaURLs = [];

// Firestore에서 게시물 데이터를 불러와 수정 가능한 폼에 표시하는 함수
const loadPostDetailForEdit = async () => {
    if (!postId) {
        postNameElement.textContent = 'Post Not Found';
        return;
    }

    try {
        const postDoc = await getDoc(doc(db, "posts", postId));
        if (postDoc.exists()) {
            const postData = postDoc.data();
            postNameElement.textContent = postData.productNumber || "No Product Number";

            // 폼 필드에 기존 데이터 채우기
            productNameInput.value = postData.name || '';
            productTypeInput.value = postData.type || '';
            productSizeInput.value = postData.size || '';
            productWeightInput.value = postData.weight || '';
            productContentInput.value = postData.content || '';

            existingMediaURLs = postData.media || [];

            // 메인 미디어 표시
            const mainMediaURL = existingMediaURLs[0];
            displayMainMedia(mainMediaURL);

            // 썸네일 갤러리 표시
            existingMediaURLs.forEach((mediaURL, index) => {
                createThumbnail(mediaURL, index);
            });
        } else {
            postNameElement.textContent = 'Post Not Found';
        }
    } catch (error) {
        console.error("Error loading post details for edit:", error);
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
        videoElement.style.width = '60%';
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
    imgElement.addEventListener('click', () => {
        displayMainMedia(mediaURL);
        selectedMediaIndex = index;
        deleteMediaBtn.style.display = 'block';
    });
    thumbnailGallery.appendChild(imgElement);
};

// 미디어 파일 미리보기
mediaFilesInput.addEventListener('change', (event) => {
    const files = event.target.files;
    previewGrid.innerHTML = '';
    Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const mediaType = file.type.split('/')[0];
            if (mediaType === 'image') {
                const imgElement = document.createElement('img');
                imgElement.src = e.target.result;
                previewGrid.appendChild(imgElement);
            } else if (mediaType === 'video') {
                const videoElement = document.createElement('video');
                videoElement.src = e.target.result;
                videoElement.controls = true;
                previewGrid.appendChild(videoElement);
            }
        };
        reader.readAsDataURL(file);
    });
});

// 미디어 삭제 버튼 클릭 시
deleteMediaBtn.addEventListener('click', async () => {
    if (selectedMediaIndex !== null && existingMediaURLs[selectedMediaIndex]) {
        const mediaURL = existingMediaURLs[selectedMediaIndex];

        const storageRef = ref(storage, mediaURL);
        try {
            await deleteObject(storageRef);
            existingMediaURLs.splice(selectedMediaIndex, 1);
            selectedMediaIndex = null;
            deleteMediaBtn.style.display = 'none';
            alert('Media deleted successfully!');
            thumbnailGallery.innerHTML = '';
            existingMediaURLs.forEach((mediaURL, index) => createThumbnail(mediaURL, index));
        } catch (error) {
            console.error('Error deleting media:', error);
            alert('Error deleting media');
        }
    }
});

// 게시물 수정 폼 제출 처리
document.getElementById('submit-btn').addEventListener('click', async (e) => {
    e.preventDefault();

    const updatedData = {
        name: productNameInput.value,
        type: productTypeInput.value,
        size: productSizeInput.value,
        weight: productWeightInput.value,
        content: productContentInput.value,
        media: existingMediaURLs
    };

    const files = mediaFilesInput.files;
    if (files.length > 0) {
        newMediaURLs = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const storageRef = ref(storage, `media/${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            newMediaURLs.push(downloadURL);
        }
        updatedData.media = [...existingMediaURLs, ...newMediaURLs];
    }

    try {
        await updateDoc(doc(db, "posts", postId), updatedData);
        alert('Post updated successfully!');
        window.location.href = `detail.html?id=${postId}`;
    } catch (error) {
        console.error('Error updating post:', error);
        alert('Error updating post');
    }
});

// 뒤로가기 버튼 클릭 시
document.getElementById('back-btn').addEventListener('click', () => {
    window.history.back();
});

// 추가 미디어 버튼 클릭 시 파일 선택 트리거
document.getElementById('add-media-btn').addEventListener('click', () => {
    const mediaInput = document.getElementById('mediaFiles');
    if (mediaInput) {
        mediaInput.click(); 
    }
});

// 페이지 로드 시 게시물 세부 정보 불러오기
window.addEventListener('DOMContentLoaded', loadPostDetailForEdit);
