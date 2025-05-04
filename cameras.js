// Weather Camera Configuration
const CAMERA_CONFIG = {
    sources: [
        {
            id: 'camera1',
            name: 'Gulf Breeze Pier Cam',
            url: 'https://5ed7b8fd7bf40.streamlock.net:444/gulfbreezerecovery/gulfbreezerecoverybeachcam/playlist.m3u8',
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
                <video id="modal-video" class="video-js vjs-default-skin" controls>
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
                html5: {
                    hls: {
                        overrideNative: true
                    }
                }
            });

            // Handle errors
            player.on('error', function() {
                console.error('Error loading video stream:', source.name);
                cameraElement.innerHTML = `
                    <div class="camera-placeholder">
                        <p>Unable to load camera feed</p>
                    </div>
                `;
            });

            // Store player instance for cleanup
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

        // Add click handler for fullscreen
        cameraElement.addEventListener('click', () => this.showModal(source));
    }

    showModal(source) {
        const camera = this.cameras.get(source.id);
        if (!camera) return;
        
        const info = this.modal.querySelector('.camera-info');
        info.textContent = source.name;
        
        // Create a new video.js instance for the modal
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

        // Set the source
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

// Initialize camera manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const cameraManager = new CameraManager();
    cameraManager.initialize();
}); 