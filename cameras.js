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
            url: 'https://mistrtoothless-sat-images.hf.space/latest.jpg',
            timelapseUrl: 'https://images.ambientweather.net/videos/latest/4CEBD61DF4FD.mp4',
            type: 'image'
        }
    ]
};

// Camera Feed Management
class CameraManager {
    constructor() {
        this.cameras = new Map();
        this.grid = document.getElementById('cameras-grid');
        if (!this.grid) {
            console.warn('No element with id "cameras-grid" found. Cameras will not be rendered.');
        }
        this.setupModal();
    }

    setupModal() {
        const modal = document.createElement('div');
        modal.className = 'camera-modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="camera-modal-content">
                <button class="camera-modal-close" aria-label="Close camera modal">&times;</button>
                <div class="camera-modal-body">
                    <video id="modal-video" controls loop style="display:none; width:100%; height:auto; max-height:70vh;"></video>
                    <img id="modal-img" style="display:none; width:100%; height:auto; max-height:70vh;" alt="Camera snapshot" />
                </div>
                <div class="camera-info" style="margin-top:8px; font-weight:bold;"></div>
            </div>
        `;
        // Basic styles to ensure modal overlays (index.css may override; keep minimal inline fallbacks)
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.right = '0';
        modal.style.bottom = '0';
        modal.style.background = 'rgba(0,0,0,0.6)';
        modal.style.zIndex = '9999';
        modal.style.display = 'none';
        modal.querySelector('.camera-modal-content').style.maxWidth = '900px';
        modal.querySelector('.camera-modal-content').style.margin = '5% auto';
        modal.querySelector('.camera-modal-content').style.background = '#fff';
        modal.querySelector('.camera-modal-content').style.padding = '12px';
        modal.querySelector('.camera-modal-content').style.borderRadius = '8px';
        modal.querySelector('.camera-modal-content').style.boxSizing = 'border-box';

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.camera-modal-close');
        closeBtn.addEventListener('click', () => this.hideModal());

        // Clicking outside modal-content closes modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hideModal();
        });

        this.modal = modal;
        this.modalVideo = modal.querySelector('#modal-video');
        this.modalImg = modal.querySelector('#modal-img');
        this.modalInfo = modal.querySelector('.camera-info');
    }

    showModal() {
        if (!this.modal) return;
        this.modal.style.display = 'block';
    }

    hideModal() {
        if (!this.modal) return;
        // pause and clear modal video
        try {
            if (this.modalVideo) {
                this.modalVideo.pause();
                this.modalVideo.removeAttribute('src');
                this.modalVideo.load();
                this.modalVideo.style.display = 'none';
            }
        } catch (e) { /* ignore */ }
        if (this.modalImg) {
            this.modalImg.style.display = 'none';
            this.modalImg.removeAttribute('src');
        }
        this.modal.style.display = 'none';
    }

    async initialize() {
        if (!this.grid) return;
        this.grid.innerHTML = '';
        for (const source of CAMERA_CONFIG.sources) {
            try {
                await this.addCamera(source);
            } catch (err) {
                console.error('Error adding camera', source, err);
            }
        }
    }

    async addCamera(source) {
        const cameraElement = document.createElement('div');
        cameraElement.className = 'camera-feed';
        cameraElement.style.position = 'relative';
        cameraElement.style.overflow = 'hidden';
        cameraElement.style.background = '#000';
        cameraElement.style.cursor = 'pointer';

        // Header/title for the camera
        const header = document.createElement('div');
        header.className = 'camera-feed-header';
        header.textContent = source.name || '';
        header.style.position = 'absolute';
        header.style.left = '8px';
        header.style.top = '8px';
        header.style.zIndex = '6';
        header.style.background = 'rgba(0,0,0,0.45)';
        header.style.color = '#fff';
        header.style.padding = '4px 8px';
        header.style.borderRadius = '6px';
        header.style.fontSize = '0.9rem';
        header.style.pointerEvents = 'none';
        cameraElement.appendChild(header);

        if (source.type === 'video') {
            // If you ever have video HLS streams, the repository already includes video.js dependencies.
            const videoWrapper = document.createElement('div');
            videoWrapper.style.width = '100%';
            videoWrapper.style.height = '100%';

            const video = document.createElement('video');
            video.setAttribute('controls', '');
            video.setAttribute('playsinline', '');
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.objectFit = 'cover';

            const sourceEl = document.createElement('source');
            sourceEl.src = source.url;
            // Let browser try types; if HLS, you may want videojs/HLS handling elsewhere
            sourceEl.type = 'application/x-mpegURL';

            video.appendChild(sourceEl);
            videoWrapper.appendChild(video);
            cameraElement.appendChild(videoWrapper);
            this.grid.appendChild(cameraElement);

            // store
            this.cameras.set(source.id, { element: cameraElement, source, player: video });
        } else {
            // Image + optional timelapse support
            const container = document.createElement('div');
            container.className = 'camera-image-container';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.position = 'relative';
            container.style.display = 'block';

            const img = document.createElement('img');
            img.src = source.url;
            img.alt = source.name || 'Camera';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.display = 'block';

            container.appendChild(img);

            let timelapseVideo = null;
            let toggleBtn = null;

            if (source.timelapseUrl) {
                // Create timelapse video element but keep hidden by default
                timelapseVideo = document.createElement('video');
                timelapseVideo.src = source.timelapseUrl;
                timelapseVideo.setAttribute('playsinline', '');
                timelapseVideo.loop = true;
                timelapseVideo.muted = true;
                timelapseVideo.controls = true;
                timelapseVideo.style.display = 'none';
                timelapseVideo.style.width = '100%';
                timelapseVideo.style.height = '300px';
                timelapseVideo.style.objectFit = 'cover';

                container.appendChild(timelapseVideo);

                // Toggle button
                toggleBtn = document.createElement('button');
                toggleBtn.type = 'button';
                toggleBtn.className = 'camera-toggle';
                toggleBtn.textContent = 'Show 24h timelapse';
                // Basic inline style; prefer moving to main CSS but provide fallback so it appears
                toggleBtn.style.position = 'absolute';
                toggleBtn.style.top = '10px';
                toggleBtn.style.left = '10px';
                toggleBtn.style.zIndex = '7';
                toggleBtn.style.background = 'rgba(255,255,255,0.95)';
                toggleBtn.style.border = '1px solid #ddd';
                toggleBtn.style.padding = '6px 10px';
                toggleBtn.style.borderRadius = '6px';
                toggleBtn.style.fontSize = '0.9rem';
                toggleBtn.style.cursor = 'pointer';
                toggleBtn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';

                // Stop the toggle click from opening the modal
                toggleBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    const showingVideo = timelapseVideo.style.display !== 'none';
                    if (showingVideo) {
                        // switch to image
                        try { timelapseVideo.pause(); } catch (e) {}
                        timelapseVideo.style.display = 'none';
                        img.style.display = 'block';
                        toggleBtn.textContent = 'Show 24h timelapse';
                    } else {
                        // switch to video
                        img.style.display = 'none';
                        timelapseVideo.style.display = 'block';
                        timelapseVideo.play().catch(() => {});
                        toggleBtn.textContent = 'Show live image';
                    }
                });

                container.appendChild(toggleBtn);
            }

            // Clicking the camera opens modal with the current view
            cameraElement.addEventListener('click', (e) => {
                // Prevent propagation if the toggle button itself was clicked (defensive)
                if (e.target === toggleBtn) return;

                // show modal
                this.showModal();

                // Decide to show timelapse or image based on what's currently visible in the grid
                if (timelapseVideo && timelapseVideo.style.display !== 'none') {
                    // Show video in modal
                    this.modalImg.style.display = 'none';
                    this.modalVideo.style.display = 'block';
                    // Use the timelapse mp4 in modal
                    try {
                        this.modalVideo.pause();
                        this.modalVideo.src = source.timelapseUrl;
                        this.modalVideo.load();
                        // try to autoplay (may be blocked if not muted)
                        this.modalVideo.muted = true;
                        this.modalVideo.play().catch(() => {});
                    } catch (err) {
                        console.warn('Could not play modal video:', err);
                    }
                } else {
                    // Show image in modal
                    try {
                        if (this.modalVideo) {
                            this.modalVideo.pause();
                            this.modalVideo.removeAttribute('src');
                            this.modalVideo.load();
                            this.modalVideo.style.display = 'none';
                        }
                    } catch (e) { /* ignore */ }
                    this.modalImg.style.display = 'block';
                    // cache-bust query to try to get the latest snapshot
                    this.modalImg.src = source.url + '?_cb=' + Date.now();
                }

                if (this.modalInfo) this.modalInfo.textContent = source.name || '';
            });

            cameraElement.appendChild(container);
            if (this.grid) this.grid.appendChild(cameraElement);

            // store camera references for later if needed
            this.cameras.set(source.id, {
                element: cameraElement,
                source,
                img,
                timelapseVideo,
                toggleBtn
            });
        }
    }
}

// Initialize camera manager on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        const manager = new CameraManager();
        manager.initialize().catch((err) => console.error('Camera initialization error:', err));
        // Expose for debugging from console
        window.__CameraManager = manager;
    } catch (e) {
        console.error('Failed to initialize CameraManager:', e);
    }
});