# Initial performance budget

Budgets are targets to validate on representative mid-range Android and iPhone hardware, not current measurements.

| Metric | Initial target | Notes |
|---|---:|---|
| Critical JS | ≤250 kB gzip | Current MapLibre integration is ~307 kB gzip and exceeds this target; code-splitting is required. |
| Export code | Separate lazy chunk | No export cost before user asks. |
| Parse main-thread blocking | ≤50 ms task | File decoding/worker handoff must be profiled; current `file.text()` may exceed it. |
| Processing | <5 s for 100k synthetic points | Device-dependent; report hardware and percentiles. |
| Preview | ≥30 FPS typical route | Measure with map/style/device data. |
| Export frames | Bounded memory, no frame accumulation | Exact time is hardware/codec dependent. |
| Peak memory | Establish from POC D before launch | iOS memory limits require physical-device measurements. |

Benchmarks record input size/point count, browser/OS/device, duration, long-task count, heap where available, canvas/map memory proxies, encoder queue and peak process memory. Cancellation must return close to pre-export baseline after GC opportunity; browser memory APIs are advisory and cannot be the sole pass condition.

Run `npm run benchmark` for reproducible synthetic 1k/10k/100k engine timing. It measures worker-independent parse/normalization/filter/densification timing; browser main-thread blocking and heap observations remain a real-device follow-up.
