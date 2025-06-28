const cameraGrid = document.getElementById('cameraGrid');
const overlay = document.getElementById('overlay');

const CAMERA_STORAGE_KEY = 'cameraAppCameras';

function loadCameras() {
    const saved = localStorage.getItem(CAMERA_STORAGE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch {
            // fallback to default if corrupted
        }
    }
    return Array.from({ length: 9 }, (_, i) => ({
        name: `Camera ${i + 1}`,
        url: '',
    }));
}

function saveCameras(cameras) {
    localStorage.setItem(CAMERA_STORAGE_KEY, JSON.stringify(cameras));
}

let cameras = loadCameras();

function createCameraCell(index) {
    const cell = document.createElement('div');
    cell.className = 'camera-cell';
    let videoHtml = '';
    const url = cameras[index].url;
    if (url) {
        videoHtml = `<video id="video-${index}" class="camera-video-placeholder" muted playsinline autoplay style="width:100%;height:calc(100% - 41px);background:#000;"></video>`;
    } else {
        videoHtml = `<div class="camera-video-placeholder"></div>`;
    }
    cell.innerHTML = `
        ${videoHtml}
        <div class="camera-name-background"></div>
        <div class="camera-name-text">${cameras[index].name}</div>
        <div class="popup-menu" id="popup-${index}">
            <label style='color:#fff;font-size:14px;'>Camera Name</label>
            <input type="text" id="name-input-${index}" value="${cameras[index].name}" style="width:100%;margin-bottom:8px;">
            <label style='color:#fff;font-size:14px;'>m3u8/mpd Link</label>
            <input type="text" id="url-input-${index}" value="${cameras[index].url}" style="width:100%;margin-bottom:12px;">
            <button onclick="saveCameraSettings(${index})">Save</button>
            <button onclick="testCameraUrl(${index})">Test Link</button>
        </div>
    `;
    cell.addEventListener('click', (e) => {
        if (!cell.querySelector('.popup-menu').classList.contains('active')) {
            document.querySelectorAll('.popup-menu').forEach(menu => menu.classList.remove('active'));
            overlay.classList.add('active');
            cell.querySelector('.popup-menu').classList.add('active');
        }
        e.stopPropagation();
    });
    setTimeout(() => {
        if (url) {
            setupVideoPlayer(`video-${index}`, url);
        }
    }, 0);
    return cell;
}

function setupVideoPlayer(videoId, url) {
    const video = document.getElementById(videoId);
    if (!video) return;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
    } else if (window.Hls) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
    } else {
        video.outerHTML = '<div style="color:#fff;text-align:center;padding:80px 0;">HLS not supported</div>';
    }
}

function renderGrid() {
    cameraGrid.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        cameraGrid.appendChild(createCameraCell(i));
    }
}

function closeAllPopups() {
    document.querySelectorAll('.popup-menu').forEach(menu => menu.classList.remove('active'));
    overlay.classList.remove('active');
}

document.body.addEventListener('click', closeAllPopups);
overlay.addEventListener('click', closeAllPopups);

window.saveCameraSettings = function(index) {
    const nameInput = document.getElementById(`name-input-${index}`);
    const urlInput = document.getElementById(`url-input-${index}`);
    if (!nameInput || !urlInput) return;
    cameras[index].name = nameInput.value.trim() || `Camera ${index + 1}`;
    cameras[index].url = urlInput.value.trim();
    saveCameras(cameras);
    renderGrid();
    closeAllPopups();
};

window.testCameraUrl = function(index) {
    const url = document.getElementById(`url-input-${index}`).value.trim();
    if (!url) {
        alert('No URL set for this camera.');
        return;
    }
    const proxyUrl = `http://localhost:3000/`;
    fetch(proxyUrl + encodeURIComponent(url))
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(() => {
            alert('Camera URL is accessible!');
        })
        .catch(error => {
            alert('Error accessing camera URL: ' + error.message);
        });
};

renderGrid(); 