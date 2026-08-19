import type { Journey } from '../../core/journey/types';
import type { CameraMode } from '../../map/camera';
import { frameState } from '../../map/deterministic';
import { DEFAULT_EXPORT_SETTINGS, exportDimensions, type ExportSettings } from './config';

export const EXPORT_WIDTH = 1280;
export const EXPORT_HEIGHT = 720;
export const EXPORT_FPS = 30;
export const EXPORT_DURATION_SECONDS = 30;
export const EXPORT_FRAME_COUNT = EXPORT_FPS * EXPORT_DURATION_SECONDS;
export const exportFrameCount = (duration: number) => EXPORT_FPS * duration;

export type ExportFrame = ReturnType<typeof frameState> & { index: number; timestamp: number; duration: number };

export function exportFrameAt(journey: Journey, index: number, mode: CameraMode, settings: ExportSettings = DEFAULT_EXPORT_SETTINGS): ExportFrame {
  const totalFrames = exportFrameCount(settings.duration);
  if (!Number.isInteger(index) || index < 0 || index >= totalFrames) throw new RangeError('Invalid export frame index.');
  const dimensions = exportDimensions(settings);
  const state = frameState(journey, index, EXPORT_FPS, settings.duration, mode, dimensions);
  return { ...state, index, timestamp: Math.round(index * 1_000_000 / EXPORT_FPS), duration: Math.round(1_000_000 / EXPORT_FPS) };
}

export function exportProgress(frame: number, totalFrames = EXPORT_FRAME_COUNT) { return Math.max(0, Math.min(1, frame / totalFrames)); }
