import * as maplibregl from 'maplibre-gl';
import type { Map } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { Journey } from '../core/journey/types';
import { routeGeometry } from './route-layer';
import { developmentStyle } from './map-style';
import { waitForFrameReady } from './readiness';
import type { CameraState } from './camera';
import { journeyBounds } from './bounds';

// Vite must emit MapLibre's module worker as a self-contained production asset.
maplibregl.setWorkerUrl(workerUrl);

const reveal = (progress: number) => ['step', ['line-progress'], '#2563eb', Math.max(0, Math.min(1, progress)), 'rgba(37,99,235,0)'] as unknown as maplibregl.ExpressionSpecification;

/** Shared MapLibre adapter for both preview and the short-lived export map. */
export class JourneyMap {
  readonly map: Map;
  private readonly loaded: Promise<void>;

  constructor(node: HTMLElement, journey: Journey, pixelRatio = Math.min(devicePixelRatio, 2)) {
    this.map = new maplibregl.Map({ container: node, style: developmentStyle, center: [journey.points[0].lng, journey.points[0].lat], zoom: 10, pixelRatio, canvasContextAttributes: { preserveDrawingBuffer: true } });
    this.map.on('error', event => console.error('[JourneyTrace map]', event.error));
    this.loaded = new Promise((resolve) => this.map.once('load', () => {
      const route = routeGeometry(journey);
      this.map.addSource('journey', { type: 'geojson', data: route, lineMetrics: true });
      this.map.addLayer({ id: 'journey-base', type: 'line', source: 'journey', paint: { 'line-color': '#71717a', 'line-opacity': .32, 'line-width': 3 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
      this.map.addLayer({ id: 'journey-route', type: 'line', source: 'journey', paint: { 'line-width': 5, 'line-gradient': reveal(0) }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
      this.map.addSource('marker', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [journey.points[0].lng, journey.points[0].lat] } } });
      this.map.addLayer({ id: 'marker', type: 'circle', source: 'marker', paint: { 'circle-radius': 7, 'circle-color': '#2563eb', 'circle-stroke-color': '#fff', 'circle-stroke-width': 3 } });
      const bounds = journeyBounds(journey);
      this.map.fitBounds([[bounds.west, bounds.south], [bounds.east, bounds.north]], { padding: Math.min(96, Math.max(32, node.clientWidth * .08)), duration: 0, maxZoom: 13 });
      resolve();
    }));
  }

  setProgress(progress: number) { if (this.map.getLayer('journey-route')) this.map.setPaintProperty('journey-route', 'line-gradient', reveal(progress)); }
  setPosition(position: { lng: number; lat: number }) { (this.map.getSource('marker') as maplibregl.GeoJSONSource | undefined)?.setData({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [position.lng, position.lat] } }); }
  setCamera(state: CameraState) { this.map.jumpTo(state); }
  async ready(timeoutMs = 10_000) { await this.loaded; await waitForFrameReady(this.map, timeoutMs); }
  async drawInto(context: CanvasRenderingContext2D, width: number, height: number) { await this.ready(); context.drawImage(this.map.getCanvas(), 0, 0, width, height); }
  remove() { this.map.remove(); }
}
