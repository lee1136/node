import { storage, db } from './firebaseConfig.js';
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('upload-form');
    const mediaFilesInput = document.getElementById('mediaFiles');
    const productNameInput = document.getElementById('product-name');
    const sizeInput = document.getElementById('size');
    const weightInput = document.getElementById('weight');
    const sizeUnitInput = document.getElementById('size-unit');
    const previewGrid = document.getElementById('preview-grid');
    const loadingOverlay = document.getElementById('loading-overlay'); // 로딩 오버레이

    let selectedThumbnail = null;
    let mediaURLs = [];

    // 뒤로가기 버튼 설정
    const backButton = document.getElementById('back-btn');
    backButton.addEventListener('click', () => {
        window.history.back(); // 이전 페이지로 이동
    });

    // 미디어 파일 미리보기 (이미지 및 동영상)
    mediaFilesInput.addEventListener('change', (event) => {
        const files = event.target.files;
        previewGrid.innerHTML = ''; // 기존 미리보기 초기화
        Array.from(files).forEach((file, index) => {
            const mediaType = file.type.split('/')[0]; // 이미지 또는 비디오 확인
            const reader = new FileReader();
            reader.onload = (e) => {
                if (mediaType === 'image') {
                    const imgElement = document.createElement('img');
                    imgElement.src = e.target.result;
                    imgElement.alt = `preview-${index}`;
                    imgElement.classList.add('preview-thumbnail');
                    imgElement.addEventListener('click', () => {
                        const selected = document.querySelector('.selected');
                        if (selected) selected.classList.remove('selected');
                        imgElement.classList.add('selected');
                        selectedThumbnail = index;
                    });
                    previewGrid.appendChild(imgElement);
                } else if (mediaType === 'video') {
                    const videoElement = document.createElement('video');
                    videoElement.src = e.target.result;
                    videoElement.controls = true;
                    videoElement.classList.add('preview-thumbnail');
                    videoElement.alt = `preview-${index}`;
                    videoElement.addEventListener('click', () => {
                        const selected = document.querySelector('.selected');
                        if (selected) selected.classList.remove('selected');
                        videoElement.classList.add('selected');
                        selectedThumbnail = index;
                    });
                    previewGrid.appendChild(videoElement);
                }
            };
            reader.readAsDataURL(file);
        });
    });

    // 업로드 폼 제출 처리
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!mediaFilesInput.files.length) {
            alert('Please upload at least one image or video.');
            return;
        }
        if (!productNameInput.value || !weightInput.value || !sizeInput.value) {
            alert('Name, weight, and size are required fields.');
            return;
        }

        // 중량 값 유효성 검사 (소숫점 2자리 허용)
        const weight = parseFloat(weightInput.value);
        if (isNaN(weight) || weight <= 0) {
            alert('Please enter a valid weight.');
            return;
        }

        // 업로드 시작 시 로딩 오버레이 표시
        loadingOverlay.style.display = 'flex';

        const productName = productNameInput.value;
        const type = Array.from(document.querySelectorAll('#type-container input:checked')).map(el => el.value).join(', ');
        const size = `${sizeInput.value}${sizeUnitInput.value}`;
        const content = document.getElementById('content').value;
        const files = mediaFilesInput.files;

        mediaURLs = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const storageRef = ref(storage, `media/${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            mediaURLs.push(downloadURL);
        }

        const thumbnailURL = mediaURLs[selectedThumbnail] || mediaURLs[0];

        try {
            await addDoc(collection(db, "posts"), {
                name: productName,
                type: type,
                size: size,
                weight: weight.toFixed(2), // 소숫점 2자리로 고정
                content: content,
                media: mediaURLs,
                thumbnail: thumbnailURL,
                createdAt: new Date()
            });
            alert('Post uploaded successfully!');
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Error uploading post:', error);
            alert('Error uploading post');
        } finally {
            // 업로드 완료 시 로딩 오버레이 숨김
            loadingOverlay.style.display = 'none';
        }
    });
});
