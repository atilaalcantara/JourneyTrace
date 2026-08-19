# Current-state audit — 2026-08-19

Classification reflects executable paths, not labels.

| Subsystem | State | Evidence / limitation |
|---|---|---|
| Import, validation, direct array | Partial | Worker reads `File`; typed parser errors identify supported rejection categories. |
| semanticSegments / coordinate formats | Partial | Path, visits, activities, strings, `latLng`/`point`, E7 and variants are parsed; direct object shapes beyond these are unverified. |
| Filtering, statistics, worker | Partial | Upstream-style conservative filter, statistics and cancel protocol exist; UI lifecycle/stale-result manager is still absent. |
| Great-circle, timing, compression | Partial | Pure spherical interpolation, densification and four timing modes exist; only focused synthetic tests. |
| MapLibre, route rendering, preview | Placeholder | CSS illustration only; no map/animation. |
| Frames, WebCodecs, Mediabunny, MP4, codecs, fallback, cancellation, tiles, memory | Not implemented | Export button only alerts. |
| Responsive/mobile UI/accessibility | Partial | CSS breakpoint/native controls; drop zone keyboard and dialog focus behavior missing. |
| Guide/Takeout detection | Partial | Brief modal and `locations` heuristic. |
| Attribution/MIT | Partial | Visible credit/docs; no LICENSE file. |
| Docker/static deployment | Partial | Files exist; container unverified. |
| Unit tests / Playwright / benchmarks | Partial / Not implemented / Not implemented | Two parser tests only. |

## Code-quality findings

`main.tsx` couples import and journey UI. Parser schema validation relies on broad records/casts. `file.text()` creates a full main-thread string, then structured cloning duplicates returned point objects: a mobile-memory risk. Worker is terminated only after response; failed/unmounted/concurrent reads are unmanaged. Filtering is not upstream-equivalent. `lucide-react` and all UI load in the entry bundle (~197 kB pre-gzip); no export module is present. No observed network request contains Timeline data and no analytics/backend exists.
