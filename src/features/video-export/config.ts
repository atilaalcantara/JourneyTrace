export type ExportQuality = '480p' | '720p' | '1080p';
export type ExportAspect = 'landscape' | 'portrait' | 'square';
export type ExportDuration = 15 | 30 | 60 | 90;
export type ExportSettings = { quality: ExportQuality; aspect: ExportAspect; duration: ExportDuration };

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = { quality: '720p', aspect: 'landscape', duration: 30 };

const shortSide: Record<ExportQuality, number> = { '480p': 480, '720p': 720, '1080p': 1080 };
const bitrate: Record<ExportQuality, number> = { '480p': 2_500_000, '720p': 6_500_000, '1080p': 12_000_000 };

export function exportDimensions(settings: ExportSettings) {
  const height = shortSide[settings.quality];
  if (settings.aspect === 'landscape') return { width: Math.round(height * 16 / 9), height };
  if (settings.aspect === 'portrait') return { width: height, height: Math.round(height * 16 / 9) };
  return { width: height, height };
}

export function exportBitrate(settings: ExportSettings) { return bitrate[settings.quality]; }
