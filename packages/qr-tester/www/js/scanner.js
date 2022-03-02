import { CANVAS_SIZE, WORKER_DATA_RATE } from './constants.js';
import { showElement, hideElement } from './dom.js';
import { initWorker } from './worker.js';

export default class Scanner {
  #container = null;
  #video = null;
  #ctx = null;
  #oldTime = 0;

  constructor(canvasId) {
    this.container = document.getElementById(canvasId);
    this.ctx = this.container.getContext('2d');
  }

  tick(time) {
    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      this.container.width = Math.min(CANVAS_SIZE.WIDTH, this.video.videoWidth);
      this.container.height = Math.min(CANVAS_SIZE.HEIGHT, this.video.videoHeight);
      this.ctx.drawImage(this.video, 0, 0);

      if (time - this.oldTime > WORKER_DATA_RATE) {
        this.oldTime = time;
        const imageData = this.ctx.getImageData(0, 0, this.container.width, this.container.height);
        this.worker.postMessage({data: imageData.data, width: imageData.width, height: imageData.height});
      }
    }

    requestAnimationFrame(time => this.tick(time));
  }

  async start(cb) {
    showElement(this.container);

    this.video = document.createElement("video");
    this.worker = initWorker((data, ms) => {
      this.stop();
      cb(data, ms);
    });

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'environment',
        width: { min: 340, ideal: 2560, max: 4096 },
        height: { min: 340, ideal: 1440, max: 2160 },
      },
    });

    this.video.srcObject = stream;
    this.video.setAttribute('playsinline', 'true');
    this.video.play();
    requestAnimationFrame(time => this.tick(time));
  }

  stop() {
    hideElement(this.container);
    this.video.pause();
    this.video.srcObject.getVideoTracks().forEach(track => track.stop());
    this.video.srcObject = null;
  }
}
