# Implementation plan

Already present: Vite/React shell, basic local import, worker invocation, partial parser, basic stats/UI, documentation and deployment files. Do not repeat these as completed product functionality.

1. **Timeline-engine compatibility.** Split formats/coordinates/validator; implement normalization, filtering, spherical interpolation, date-line-safe route, timing and statistics as pure functions. Verify against synthetic fixtures and upstream behavior tolerances.
2. **Worker contract.** Stream/chunk where browser APIs permit, define progress/error/cancel messages, transfer compact data, and test cleanup.
3. **Map POC B — deterministic capture.** Integrate a minimal MapLibre adapter; prove fixed frame stepping, route progress/camera positioning, `idle`/render completion and canvas capture independent of machine speed.
4. **POC C — tile readiness.** Determine all tiles needed per export camera state, await loaded tiles before capture, and demonstrate no blank/partial tiles in recorded frames.
5. **Preview and accessible controls.** Build real route preview, date/settings controls, Journey UI primitives, responsive bottom sheet and guide.
6. **POC A — Safari/iOS encoding.** On physical Safari/iOS test WebCodecs presence, H.264 configurations, Mediabunny MP4 muxing, download/playback and memory. Record devices/OS/results.
7. **POC E — browser codec matrix.** Repeat capability/mux/playback tests for Safari, Chrome, Edge and Firefox. Define preferred and fallback paths from evidence.
8. **Export pipeline.** After POCs, implement lazy codec selection, deterministic render, attribution, frame close/backpressure, progress and cancellation.
9. **POC D — mobile memory.** Use synthetic large data to measure JSON, normalized route, map, encoder and peak export memory. Cancel mid-export and confirm release.
10. **Deployment/compatibility hardening.** Verify container, CSP/tile policy, real-device responsive flows and performance budget.

Every milestone has a demo, automated test where feasible, and documented observed device/browser results before proceeding.
