# Map rendering POC

MapLibre GL JS 6.4.1 is integrated through `src/map`. The development basemap is OpenFreeMap Liberty (`tiles.openfreemap.org`), with MapLibre’s visible attribution control; it requires OpenStreetMap/OpenFreeMap attribution and has no JourneyTrace proxy or key. Timeline-derived data stays in an in-memory GeoJSON source.

The route uploads once with `lineMetrics: true`. A `line-gradient` plus `line-progress` changes reveal progress without resending source geometry. Anti-meridian jumps split geometry into `MultiLineString` segments. `frameState()` maps frame/fps/duration deterministically to elapsed time, timing-derived progress and pure camera state. `waitForFrameReady()` waits for `render`/`idle` plus `areTilesLoaded`, with only a defensive timeout; `capture()` uses `canvas.toBlob` after readiness.

Implemented preview is rAF-driven and updates MapLibre outside React rendering. Fixed/Steady/Dynamic pure camera calculations exist; the UI currently uses Steady only. Capture and map POC have not yet been measured in a real browser session. No video encoding POC has been implemented yet; Mediabunny 1.55.1 is installed for that dedicated follow-up. This is an incomplete Phase 4 result, not evidence of MP4 feasibility.
