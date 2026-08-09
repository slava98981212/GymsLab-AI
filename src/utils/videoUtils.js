/**
 * Validates that a video file is 20 seconds or under
 * @param {File} file 
 * @returns {Promise<{valid: boolean, duration: number, error?: string}>}
 */
export function validateVideoDuration(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const duration = video.duration;
      if (duration > 20.5) { // allow 0.5s margin
        resolve({
          valid: false,
          duration,
          error: `Video length is ${Math.round(duration)}s. Maximum allowed duration per exercise video is 20 seconds.`
        });
      } else {
        resolve({ valid: true, duration });
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, duration: 0, error: 'Could not read video metadata.' });
    };
  });
}

/**
 * Extracts 2-3 keyframe image base64 strings from a video file/blob for AI Vision analysis
 * @param {File|Blob} videoBlob 
 * @returns {Promise<string[]>} array of base64 JPEG data URLs
 */
export function extractVideoFrames(videoBlob) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(videoBlob);
    video.src = url;

    const frames = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.onloadedmetadata = () => {
      canvas.width = Math.min(640, video.videoWidth || 640);
      canvas.height = Math.min(360, video.videoHeight || 360);
      
      const duration = video.duration || 10;
      // Capture 2 key points: 30% and 70% timestamp
      const timestamps = [duration * 0.3, duration * 0.7];
      let currentIndex = 0;

      const captureFrame = () => {
        if (currentIndex >= timestamps.length) {
          URL.revokeObjectURL(url);
          resolve(frames);
          return;
        }

        video.currentTime = timestamps[currentIndex];
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          frames.push(dataUrl);
        }
        currentIndex++;
        captureFrame();
      };

      captureFrame();
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve([]);
    };
  });
}
