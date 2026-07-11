export interface PlaybackState {
  isPlaying: boolean;
  currentFrame: number;
  speed: number;
  loop: boolean;
  frameStep: number;
  proxyMode: 'full' | 'proxy' | 'auto';
  gpuEnabled: boolean;
  backgroundDecode: boolean;
  cacheEnabled: boolean;
  hdrReady: boolean;
}

export class PlaybackEngine {
  createState(): PlaybackState {
    return {
      isPlaying: false,
      currentFrame: 0,
      speed: 1,
      loop: false,
      frameStep: 1,
      proxyMode: 'auto',
      gpuEnabled: true,
      backgroundDecode: true,
      cacheEnabled: true,
      hdrReady: false
    };
  }
}
