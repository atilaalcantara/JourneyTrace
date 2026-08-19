import { describe, expect, it } from 'vitest';
import { parseTimeline } from '../../core/timeline/parser';
import { EXPORT_DURATION_SECONDS, EXPORT_FPS, EXPORT_FRAME_COUNT, exportFrameAt, exportFrameCount, exportProgress } from './frame-iterator';

const journey = parseTimeline([
  { time: '2025-01-01T00:00:00Z', point: '-16.6869,-49.2648' },
  { time: '2025-01-01T01:00:00Z', point: '-16.6900,-49.2500' },
  { time: '2025-01-01T02:00:00Z', point: '-16.7000,-49.2400' },
]);

describe('deterministic export frames', () => {
  it('generates exactly 900 frames for the 30 second configuration', () => {
    expect(EXPORT_FPS * EXPORT_DURATION_SECONDS).toBe(900);
    expect(EXPORT_FRAME_COUNT).toBe(900);
  });

  it('uses deterministic timestamps and journey states at first, middle and final frames', () => {
    const first = exportFrameAt(journey, 0, 'steady');
    const middle = exportFrameAt(journey, 450, 'steady');
    const last = exportFrameAt(journey, 899, 'steady');
    expect(first.timestamp).toBe(0);
    expect(middle.timestamp).toBe(15_000_000);
    expect(last.timestamp).toBe(29_966_667);
    expect(first.distance).toBe(0);
    expect(middle.distance).toBeGreaterThan(first.distance);
    expect(last.distance).toBeGreaterThan(middle.distance);
    expect(last.progress).toBeLessThan(1);
  });

  it('uses the same camera mathematics as preview and propagates the selected camera', () => {
    const fixed = exportFrameAt(journey, 450, 'fixed');
    const steady = exportFrameAt(journey, 450, 'steady');
    expect(fixed.camera.center).not.toEqual(steady.camera.center);
    expect([fixed, steady].every((frame) => Number.isFinite(frame.camera.zoom))).toBe(true);
  });

  it('reports bounded real render progress', () => {
    expect(exportProgress(0)).toBe(0);
    expect(exportProgress(450)).toBe(.5);
    expect(exportProgress(900)).toBe(1);
  });

  it('scales deterministic frame counts with selected duration', () => {
    expect(exportFrameCount(15)).toBe(450);
    expect(exportFrameCount(60)).toBe(1800);
    expect(exportFrameCount(90)).toBe(2700);
  });
});
