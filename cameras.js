// Weather Camera Configuration
const CAMERA_CONFIG = {
    sources: [
        {
            id: 'camera1',
            name: 'FL511 Traffic Cam 1',
            url: 'https://173-d3.divas.cloud/CHAN-6584/CHAN-6584_1.stream/playlist.m3u8?vdswztokenhash=nWG4o8REN4OUKoC7MAPvGS-r9z2f8kthK1rHHhfCdgk=',
            location: 'Florida Highway',
            type: 'application/x-mpegURL'
        },
        {
            id: 'camera2',
            name: 'FL511 Traffic Cam 2',
            url: 'https://1-or.vdn.terrafox.net/NBL/nbl-1.stream/chunks_dvr.m3u8',
            location: 'Florida Highway',
            type: 'application/x-mpegURL'
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
        cameraElement.innerHTML = `
            <video id="camera-${source.id}" class="video-js" controls>
                <source src="${source.url}" type="application/x-mpegURL">
            </video>
            <div class="camera-info">${source.name}</div>
        `;
        this.grid.appendChild(cameraElement);

        // Initialize video player with HLS.js
        const video = cameraElement.querySelector('video');
        if (Hls.isSupported()) {
            const hls = new Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: true
            });
            hls.loadSource(source.url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(e => console.log('Auto-play prevented:', e));
            });

            // Store HLS instance for cleanup
            this.cameras.set(source.id, {
                element: cameraElement,
                source: source,
                player: video,
                hls: hls
            });

            // Error handling
            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log('Fatal network error encountered, trying to recover...');
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log('Fatal media error encountered, trying to recover...');
                            hls.recoverMediaError();
                            break;
                        default:
                            console.log('Fatal error, cannot recover');
                            hls.destroy();
                            break;
                    }
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // For Safari, which has native HLS support
            video.src = source.url;
            video.addEventListener('loadedmetadata', () => {
                video.play().catch(e => console.log('Auto-play prevented:', e));
            });

            this.cameras.set(source.id, {
                element: cameraElement,
                source: source,
                player: video
            });
        } else {
            console.log('HLS is not supported in this browser');
            cameraElement.innerHTML = `
                <div class="camera-placeholder">
                    <p>Video playback not supported in this browser</p>
                </div>
                <div class="camera-info">${source.name}</div>
            `;
        }

        // Add click handler for fullscreen
        cameraElement.addEventListener('click', () => this.showModal(source));
    }

    showModal(source) {
        const camera = this.cameras.get(source.id);
        if (!camera) return;
        
        const info = this.modal.querySelector('.camera-info');
        info.textContent = `${source.name} - ${source.location}`;
        
        // Create a new HLS instance for the modal
        if (Hls.isSupported()) {
            const hls = new Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: true
            });
            
            hls.loadSource(source.url);
            hls.attachMedia(this.modalVideo);
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log(`HLS manifest parsed for modal ${source.name}`);
                this.modalVideo.play();
            });
            
            this.modal.classList.add('visible');
            this.modalHls = hls;
        } else if (this.modalVideo.canPlayType('application/vnd.apple.mpegurl')) {
            // For Safari
            this.modalVideo.src = source.url;
            this.modalVideo.play();
            this.modal.classList.add('visible');
        }
    }

    hideModal() {
        if (this.modalHls) {
            this.modalHls.destroy();
            this.modalHls = null;
        }
        this.modalVideo.pause();
        this.modal.classList.remove('visible');
    }
}

// Initialize camera manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const cameraManager = new CameraManager();
    cameraManager.initialize();
}); 