export async function extractFramesFromVideo(
  file: File,
  frameCount: number,
  onProgress?: (progress: number) => void
): Promise<File[]> {
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;

  const url = URL.createObjectURL(file);
  video.src = url;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Impossible de charger la vidéo'));
  });

  // Need to play briefly to ensure frames are available
  video.currentTime = 0;
  await new Promise<void>((resolve) => {
    video.onseeked = () => resolve();
  });

  const duration = video.duration;
  const interval = duration / frameCount;
  const frames: File[] = [];

  for (let i = 0; i < frameCount; i++) {
    video.currentTime = Math.min(i * interval, duration - 0.01);
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
    });

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);

    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/png')
    );

    frames.push(new File([blob], `frame-${String(i + 1).padStart(2, '0')}.png`, { type: 'image/png' }));
    onProgress?.((i + 1) / frameCount);
  }

  URL.revokeObjectURL(url);
  return frames;
}
