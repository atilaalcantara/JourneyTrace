export const WIDTH = 1280;
export const HEIGHT = 720;
export const FPS = 30;
export const FRAMES = 150;
export const FRAME_DURATION_US = 1_000_000 / FPS;
const ENCODER_PROBE_TIMEOUT_MS = 10_000;

export type ExportCodec = 'avc' | 'hevc';
export type Capability = { available: boolean; codec?: ExportCodec; config?: VideoEncoderConfig; reason?: string };
function h264Candidates(width: number, height: number) {
  // Level 3 is enough for 720p, but 1920×1080 needs at least AVC Level 4.
  return width * height > 1280 * 720
    ? ['avc1.42E028', 'avc1.4D0028', 'avc1.640028']
    : ['avc1.42E01E', 'avc1.4D401F'];
}

function createConfig(codec: string, family: ExportCodec, width = WIDTH, height = HEIGHT, bitrate = 4_000_000): VideoEncoderConfig {
  return family === 'hevc'
    ? ({ codec, width, height, bitrate, framerate: FPS, latencyMode: 'quality', hevc: { format: 'hevc' } } as unknown as VideoEncoderConfig)
    : { codec, width, height, bitrate, framerate: FPS, latencyMode: 'quality', avc: { format: 'avc' } };
}

function timeoutAfter(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) => window.setTimeout(() => reject(new Error(message)), ms));
}

async function waitForFrame(
  pendingFrame: Promise<unknown>,
  cancelled: () => boolean,
  message: string,
): Promise<void> {
  let timeoutId = 0;
  let cancellationId = 0;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), 10_000);
  });
  const cancellation = new Promise<never>((_, reject) => {
    cancellationId = window.setInterval(() => {
      if (cancelled()) reject(new DOMException('Cancelled', 'AbortError'));
    }, 50);
  });
  try {
    await Promise.race([pendingFrame, timeout, cancellation]);
  } finally {
    window.clearTimeout(timeoutId);
    window.clearInterval(cancellationId);
  }
}

/** `isConfigSupported` can succeed on Safari while the encoder never outputs a packet. */
async function probeEncoder(config: VideoEncoderConfig): Promise<boolean> {
  const canvas = document.createElement('canvas');
  canvas.width = config.width;
  canvas.height = config.height;
  const context = canvas.getContext('2d');
  if (!context) return false;
  context.fillStyle = '#2563eb';
  context.fillRect(0, 0, config.width, config.height);

  let encoder: VideoEncoder | undefined;
  try {
    const producedPacket = new Promise<void>((resolve, reject) => {
      encoder = new VideoEncoder({ output: () => resolve(), error: reject });
    });
    const activeEncoder = encoder;
    if (!activeEncoder) return false;
    activeEncoder.configure(config);
    // Some hardware encoders buffer the first keyframe until a following frame
    // or flush. A one-frame probe incorrectly rejects those Safari encoders.
    for (let index = 0; index < 2; index += 1) {
      const frame = new VideoFrame(canvas, { timestamp: index * Math.round(FRAME_DURATION_US), duration: FRAME_DURATION_US });
      activeEncoder.encode(frame, { keyFrame: index === 0 });
      frame.close();
    }
    void activeEncoder.flush().catch(() => undefined);
    await Promise.race([producedPacket, timeoutAfter(ENCODER_PROBE_TIMEOUT_MS, 'The browser accepted H.264 but produced no encoded packet.')]);
    return true;
  } catch {
    return false;
  } finally {
    if (encoder && encoder.state !== 'closed') encoder.close();
    canvas.width = 1;
    canvas.height = 1;
  }
}

export async function detectH264(width = WIDTH, height = HEIGHT, bitrate = 4_000_000): Promise<Capability> {
  if (!('VideoEncoder' in globalThis)) return { available: false, reason: 'WebCodecs VideoEncoder is unavailable.' };
  for (const codec of h264Candidates(width, height)) {
    const config = createConfig(codec, 'avc', width, height, bitrate);
    try {
      const result = await VideoEncoder.isConfigSupported(config);
      if (result.supported && await probeEncoder(config)) return { available: true, codec: 'avc', config };
    } catch { /* Try the next profile. */ }
  }
  return { available: false, reason: 'H.264 encoding did not produce a test packet in this browser. Try a current Chromium build.' };
}

export async function detectHevc(width = WIDTH, height = HEIGHT, bitrate = 4_000_000): Promise<Capability> {
  if (!('VideoEncoder' in globalThis)) return { available: false, reason: 'WebCodecs VideoEncoder is unavailable.' };
  // Main profile, level 4 for HD/1080p; hvc1 is the MP4/QuickTime variant.
  for (const codec of ['hvc1.1.6.L120.B0', 'hev1.1.6.L120.B0']) {
    const config = createConfig(codec, 'hevc', width, height, bitrate);
    try {
      const result = await VideoEncoder.isConfigSupported(config);
      if (result.supported && await probeEncoder(config)) return { available: true, codec: 'hevc', config };
    } catch { /* H.264 remains the compatibility fallback. */ }
  }
  return { available: false, reason: 'HEVC encoding is unavailable.' };
}

/** Prefer the more efficient HEVC only after it has actually encoded test frames. */
export async function detectPreferredVideoCodec(width = WIDTH, height = HEIGHT, bitrate = 4_000_000): Promise<Capability> {
  const hevc = await detectHevc(width, height, bitrate);
  return hevc.available ? hevc : detectH264(width, height, bitrate);
}

export const frameTimestamp = (index: number) => Math.round(index * FRAME_DURATION_US);
export const frameProgress = (index: number) => index / (FRAMES - 1);

export function drawFrame(context: CanvasRenderingContext2D, index: number) {
  const progress = frameProgress(index);
  context.fillStyle = '#f4f4f5'; context.fillRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = '#18181b'; context.font = '600 34px sans-serif'; context.fillText('JourneyTrace video POC', 56, 72);
  context.fillStyle = '#2563eb'; context.beginPath(); context.arc(80 + progress * (WIDTH - 160), HEIGHT / 2, 28, 0, Math.PI * 2); context.fill();
  context.fillRect(56, HEIGHT - 80, (WIDTH - 112) * progress, 10);
  context.fillStyle = '#71717a'; context.font = '24px monospace'; context.fillText(`Frame ${index + 1}/${FRAMES}  ${(index / FPS).toFixed(3)}s`, 56, 130);
}

export function mediabunnyEncodingOptions(config: VideoEncoderConfig, codec: ExportCodec = 'avc', bitrate = config.bitrate ?? 4_000_000) {
  return { codec, fullCodecString: config.codec, bitrate, bitrateMode: 'variable' as const, latencyMode: 'quality' as const, keyFrameInterval: 2, contentHint: 'detail' };
}

export async function generateSyntheticVideo(cancelled: () => boolean, onProgress: (progress: number) => void) {
  const capability = await detectH264();
  if (!capability.available || !capability.config) throw new Error(capability.reason);
  const { Output, Mp4OutputFormat, BufferTarget, CanvasSource } = await import('mediabunny');
  const target = new BufferTarget(); const output = new Output({ format: new Mp4OutputFormat(), target });
  const canvas = document.createElement('canvas'); canvas.width = WIDTH; canvas.height = HEIGHT;
  const context = canvas.getContext('2d'); if (!context) throw new Error('Could not create the test canvas.');
  let packets = 0;
  const source = new CanvasSource(canvas, { ...mediabunnyEncodingOptions(capability.config), onEncodedPacket: () => { packets += 1; } });
  output.addVideoTrack(source); await output.start();
  try {
    for (let index = 0; index < FRAMES; index += 1) {
      if (cancelled()) throw new DOMException('Cancelled', 'AbortError');
      drawFrame(context, index);
      await waitForFrame(
        source.add(index / FPS, 1 / FPS, { keyFrame: index % 60 === 0 }),
        cancelled,
        `Mediabunny/WebCodecs stalled on frame ${index + 1}; ${packets} encoded packets were produced.`,
      );
      if (cancelled()) throw new DOMException('Cancelled', 'AbortError');
      onProgress((index + 1) / FRAMES);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    source.close(); await output.finalize();
    if (!target.buffer) throw new Error('MP4 muxing returned no output.');
    return new Blob([target.buffer], { type: 'video/mp4' });
  } finally {
    source.close(); canvas.width = 1; canvas.height = 1;
  }
}
