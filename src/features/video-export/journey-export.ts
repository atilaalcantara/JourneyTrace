import type { Journey } from '../../core/journey/types';
import type { CameraMode } from '../../map/camera';
import { JourneyMap } from '../../map/map-adapter';
import { mapAttribution } from '../../map/map-style';
import { detectPreferredVideoCodec, mediabunnyEncodingOptions } from '../video-poc/video-poc';
import { exportFrameAt, exportFrameCount, exportProgress } from './frame-iterator';
import { DEFAULT_EXPORT_SETTINGS, exportBitrate, exportDimensions, type ExportSettings } from './config';

export type ExportStage = 'preparing' | 'loading-map' | 'rendering' | 'finalizing';
export type ExportUpdate = { stage: ExportStage; frame: number; totalFrames: number; progress: number; elapsedMs: number; detail?: string };
export type ExportOptions = { journey: Journey; cameraMode: CameraMode; settings?: ExportSettings; cancelled: () => boolean; onUpdate: (update: ExportUpdate) => void };

const abort = () => new DOMException('Cancelled', 'AbortError');
const assertNotCancelled = (cancelled: () => boolean) => { if (cancelled()) throw abort(); };

function createExportHost(width: number, height: number) {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${width}px;height:${height}px;overflow:hidden;visibility:hidden;`;
  document.body.append(host);
  return host;
}

function drawAttribution(context: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
  const text = mapAttribution;
  context.save();
  context.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
  const labelWidth = context.measureText(text).width + 20;
  const x = canvasWidth - labelWidth - 16;
  const y = canvasHeight - 42;
  context.fillStyle = 'rgba(255,255,255,.88)';
  context.fillRect(x, y, labelWidth, 26);
  context.fillStyle = '#222';
  context.fillText(text, x + 10, y + 18);
  context.restore();
}

async function waitForFrame(pending: Promise<unknown>, cancelled: () => boolean, frame: number) {
  let timer = 0;
  let canceller = 0;
  const timeout = new Promise<never>((_, reject) => { timer = window.setTimeout(() => reject(new Error(`Encoder did not accept export frame ${frame} within 10 seconds.`)), 10_000); });
  const cancelledPromise = new Promise<never>((_, reject) => { canceller = window.setInterval(() => { if (cancelled()) reject(abort()); }, 50); });
  try { await Promise.race([pending, timeout, cancelledPromise]); }
  finally { window.clearTimeout(timer); window.clearInterval(canceller); }
}

/** Browser-only, incremental export orchestration. It deliberately owns no React state. */
export async function exportJourneyVideo(options: ExportOptions): Promise<Blob> {
  const settings = options.settings ?? DEFAULT_EXPORT_SETTINGS;
  const dimensions = exportDimensions(settings);
  const totalFrames = exportFrameCount(settings.duration);
  const started = performance.now();
  const update = (stage: ExportStage, frame: number, detail?: string) => options.onUpdate({ stage, frame, totalFrames, progress: stage === 'preparing' ? .02 : stage === 'loading-map' ? .08 : stage === 'rendering' ? .08 + .84 * exportProgress(frame, totalFrames) : .94, elapsedMs: performance.now() - started, detail });
  update('preparing', 0, 'Checking HEVC/H.264 encoder');
  assertNotCancelled(options.cancelled);
  const capability = await detectPreferredVideoCodec(dimensions.width, dimensions.height, exportBitrate(settings));
  if (!capability.available || !capability.config) throw new Error(capability.reason);

  const host = createExportHost(dimensions.width, dimensions.height);
  const map = new JourneyMap(host, options.journey, 1);
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width; canvas.height = dimensions.height;
  const context = canvas.getContext('2d');
  if (!context) { map.remove(); host.remove(); throw new Error('Could not create export canvas.'); }

  let source: { add: (timestamp: number, duration: number, options?: { keyFrame?: boolean }) => Promise<void>; close: () => void } | undefined;
  try {
    update('loading-map', 0, 'Loading map tiles');
    await map.ready();
    assertNotCancelled(options.cancelled);
    const { Output, Mp4OutputFormat, BufferTarget, CanvasSource } = await import('mediabunny');
    const target = new BufferTarget();
    const output = new Output({ format: new Mp4OutputFormat(), target });
    source = new CanvasSource(canvas, mediabunnyEncodingOptions(capability.config, capability.codec, exportBitrate(settings)));
    output.addVideoTrack(source);
    await output.start();

    for (let index = 0; index < totalFrames; index += 1) {
      assertNotCancelled(options.cancelled);
      const frame = exportFrameAt(options.journey, index, options.cameraMode, settings);
      map.setProgress(frame.distance / Math.max(1, options.journey.statistics.totalDistanceMeters));
      map.setPosition(frame.position);
      map.setCamera(frame.camera);
      await map.drawInto(context, dimensions.width, dimensions.height);
      drawAttribution(context, dimensions.width, dimensions.height);
      await waitForFrame(source.add(frame.elapsed, 1 / 30, { keyFrame: index % 60 === 0 }), options.cancelled, index + 1);
      update('rendering', index + 1, `Rendering journey — ${index + 1} / ${totalFrames}`);
    }
    assertNotCancelled(options.cancelled);
    update('finalizing', totalFrames, 'Finalizing MP4');
    source.close();
    await output.finalize();
    if (!target.buffer) throw new Error('MP4 muxing returned no output.');
    return new Blob([target.buffer], { type: 'video/mp4' });
  } finally {
    source?.close();
    map.remove();
    host.remove();
    canvas.width = 1; canvas.height = 1;
  }
}
