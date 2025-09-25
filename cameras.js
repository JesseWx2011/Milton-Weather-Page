// Weather Camera Configuration (initial, Camera 1 URL will be replaced after token fetch)
const CAMERA_CONFIG = {
    sources: [
        {
            id: 'camera1',
            name: 'I-10 Rest Area',
            url: '', // will be set dynamically
            type: 'video'
        },
        {
            id: 'camera2',
            name: 'Navarre Beach Cam',
            url: 'https://1-or.vdn.terrafox.net/NBL/nbl-1.stream/chunks_dvr.m3u8',
            type: 'video'
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
                <video id="modal-video" class="video-js vjs-default-skin" controls loop>
                    <p class="vjs-no-js">Please enable JavaScript to view this video.</p>
                </video>
                <div class="camera-info"></div>
            </div>
        `;
        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.camera-modal-close');
        closeBtn.addEventListener('click', () => this.hideModal());

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        });

        this.modal = modal;
        this.modalVideo = modal.querySelector('#modal-video');
    }

    async initialize() {
        this.grid.innerHTML = '';
        for (const source of CAMERA_CONFIG.sources) {
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

            // Initialize video.js player
            const player = videojs(video, {
                fluid: true,
                aspectRatio: '16:9',
                playbackRates: [0.5, 1, 1.5, 2],
                autoplay: true,
                muted: true,
                loop: true,
                html5: {
                    hls: {
                        overrideNative: true
                    }
                }
            });

            player.on('error', function() {
                console.error('Error loading video stream:', source.name);
                cameraElement.innerHTML = `
                    <div class="camera-placeholder">
                        <p>Unable to load camera feed</p>
                    </div>
                `;
            });

            this.cameras.set(source.id, {
                element: cameraElement,
                source: source,
                player: player
            });
        } else {
            const img = document.createElement('img');
            img.src = source.url;
            img.alt = source.name;
            cameraElement.appendChild(img);
        }

        const cameraInfo = document.createElement('div');
        cameraInfo.className = 'camera-info';
        cameraInfo.textContent = source.name;
        cameraElement.appendChild(cameraInfo);

        this.grid.appendChild(cameraElement);

        cameraElement.addEventListener('click', () => this.showModal(source));
    }

    showModal(source) {
        const camera = this.cameras.get(source.id);
        if (!camera) return;

        const info = this.modal.querySelector('.camera-info');
        info.textContent = source.name;

        const modalPlayer = videojs(this.modalVideo, {
            fluid: true,
            aspectRatio: '16:9',
            playbackRates: [0.5, 1, 1.5, 2],
            html5: {
                hls: {
                    overrideNative: true
                }
            }
        });

        modalPlayer.src({
            src: source.url,
            type: 'application/x-mpegURL'
        });

        this.modal.classList.add('visible');
        this.modalPlayer = modalPlayer;
    }

    hideModal() {
        if (this.modalPlayer) {
            this.modalPlayer.dispose();
            this.modalPlayer = null;
        }
        this.modal.classList.remove('visible');
    }
}

// Fetch token, then set Camera 1 URL and initialize cameras
document.addEventListener('DOMContentLoaded', () => {
    fetch("https://divas.cloud/VDS-API/SecureTokenUri/GetSecureTokenUriBySourceId", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            token: "A5CBCF70-80ED-4225-8C23-DDE840829225",
            sourceId: "479",
            systemSourceId: "District 3-CHP"
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log("Token response:", data);

        // Expecting ?token=xxxx string from API
        const tokenString = data?.token ? `?token=${data.token}` : "";
        CAMERA_CONFIG.sources[0].url = `https://dis-se2.divas.cloud:8200/chan-7318_h/xflow.m3u8${tokenString}`;

        // Initialize CameraManager with updated URL
        const cameraManager = new CameraManager();
        cameraManager.initialize();
    })
    .catch(err => {
        console.error("Error fetching token:", err);
        // Still init cameras (without secure URL) if request fails
        const cameraManager = new CameraManager();
        cameraManager.initialize();
    });
});
