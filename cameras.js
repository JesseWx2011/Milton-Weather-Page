// Weather Camera Configuration
const CAMERA_CONFIG = {
    sources: [
        {
            id: 'fl511_6573',
            name: 'Pensacola - North View',
            url: 'https://streaming.myescambia.com:8080',
            type: 'image' // Treat as an image
        },
        {
            id: 'camera2',
            name: 'Milton Webcam',
            url: 'https://panhandlewx.altervista.org/wp-content/Latest.jpg?' + new Date().getTime(),
            type: 'image'
        }
    ]
};

// Camera Feed Management
class CameraManager {
    constructor() {
        this.cameras = new Map();
        this.grid = document.getElementById('cameras-grid');
        this.setupModal();
    }

    setupModal() {
        const modal = document.createElement('div');
        modal.className = 'camera-modal';
        modal.innerHTML = `
            <div class="camera-modal-content">
                <button class="camera-modal-close">&times;</button>
                <video id="modal-video" class="video-js vjs-default-skin" controls loop style="display:none;">
                    <p class="vjs-no-js">Please enable JavaScript to view this video.</p>
                </video>
                <img id="modal-img" style="width:100%; display:none;" />
                <div class="camera-info"></div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.camera-modal-close')
            .addEventListener('click', () => this.hideModal());

        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hideModal();
        });

        this.modal = modal;
        this.modalVideo = modal.querySelector('#modal-video');
        this.modalImg = modal.querySelector('#modal-img');
    }

    async initialize() {
        this.grid.innerHTML = '';
        for (const source of CAMERA_CONFIG.sources) {
            console.log("Initializing camera:", source.name, source.url);
            await this.addCamera(source);
        }
    }

    async addCamera(source) {
        const cameraElement = document.createElement('div');
        cameraElement.className = 'camera-feed';

        if (source.type === 'video') {
            const video = document.createElement('video-js');
            video.className = 'video-js vjs-default-skin';
            video.setAttribute('controls', '');
            video.setAttribute('preload', 'auto');
            video.setAttribute('width', '100%');
            video.setAttribute('height', '100%');
            video.setAttribute('data-setup', '{}');

            const sourceElement = document.createElement('source');
            sourceElement.setAttribute('src', source.url);
            sourceElement.setAttribute('type', 'application/x-mpegURL');
            video.appendChild(sourceElement);

            cameraElement.appendChild(video);
            this.grid.appendChild(cameraElement);

            console.log("Creating Video.js player for:", source.name);
            const player = videojs(video, {
                fluid: true,
                aspectRatio: '16:9',
                playbackRates: [0.5, 1, 1.5, 2],
                autoplay: true,
                muted: true,
                loop: true,
                html5: { hls: { overrideNative: true } }
            });

            player.on('error', () => {
                console.error('Error loading video stream:', source.name);
                cameraElement.innerHTML = `
                    <div class="camera-placeholder">
                        <p>Unable to load camera feed</p>
                    </div>
                `;
            });

            this.cameras.set(source.id, { element: cameraElement, source, player });

        } else { // Image type
            const img = document.createElement('img');
            img.src = source.url;
            img.alt = source.name;
            img.style.width = '100%';
            cameraElement.appendChild(img);
            this.cameras.set(source.id, { element: cameraElement, source });

            this.grid.appendChild(cameraElement);
        }

        const cameraInfo = document.createElement('div');
        cameraInfo.className = 'camera-info';
        cameraInfo.textContent = source.name;
        cameraElement.appendChild(cameraInfo);

        cameraElement.addEventListener('click', () => this.showModal(source));
    }

    showModal(source) {
        const camera = this.cameras.get(source.id);
        if (!camera) return;

        console.log("Showing modal for:", source.name, source.url);

        const info = this.modal.querySelector('.camera-info');
        info.textContent = source.name;

        if (source.type === 'video') {
            this.modalVideo.style.display = 'block';
            this.modalImg.style.display = 'none';

            if (this.modalPlayer) {
                this.modalPlayer.dispose();
                this.modalPlayer = null;
            }

            const modalPlayer = videojs(this.modalVideo, {
                fluid: true,
                aspectRatio: '16:9',
                playbackRates: [0.5, 1, 1.5, 2],
                html5: { hls: { overrideNative: true } }
            });

            modalPlayer.src({ src: source.url, type: 'application/x-mpegURL' });
            this.modalPlayer = modalPlayer;

        } else { // Image modal
            this.modalVideo.style.display = 'none';
            this.modalImg.style.display = 'block';
            this.modalImg.src = source.url;
        }

        this.modal.classList.add('visible');
    }

    hideModal() {
        if (this.modalPlayer) {
            this.modalPlayer.dispose();
            this.modalPlayer = null;
        }
        this.modal.classList.remove('visible');
    }
}

// Initialize cameras
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing cameras...");
    const cameraManager = new CameraManager();
    cameraManager.initialize();
});
