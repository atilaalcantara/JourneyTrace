# Original Timeline Visualizer analysis

This analysis is from a read-only inspection of mahlernim/google-timeline-visualizer at `main` on 2026-08-19. JourneyTrace is a separate web implementation, inspired by and based on Timeline Visualizer by mahlernim. The upstream project is MIT licensed (Copyright © 2025 mahlernim); any substantial port must retain its copyright and permission notice.

## Actual upstream behavior

The Android parser streams JSON, accepts a top-level array or object with `semanticSegments`, and distinguishes `timelineObjects`/`locations` legacy files and `rawSignals`-only files. Segments supply timestamped `timelinePath`, visit `topCandidate.placeLocation`, and activity start/end. A path time may be explicit or an offset from segment start. String/object coordinates support `geo:`, query suffixes, degrees, whitespace, `latLng`/`point`, and E7 scaling. Valid points are Web-Mercator-safe (±85.05112878) and longitude ±180, stably time-sorted, and same-millisecond duplicate coordinates removed.

It uses haversine distance and binary search over cumulative distance. Great-circle interpolation is used for position and a render route is densified to ≤50 km samples (maximum 512 per segment), including anti-meridian-safe normalized longitude. Conservative GPS filtering removes only runs of 1–3 implausible excursions that rejoin within 200 km/12 hours, have 500 km ingress/egress, exceed 1,300 km/h, and form a ≤200 km cluster. Filter-off is supported.

Compression changes timing, never geometry: segment distance exponents are 1.00/0.92/0.85/0.75 and a monotone cubic interpolation maps elapsed fraction to real distance. The animation adds a 1.5 s outro (1 s overview transition plus hold). Fixed camera has fixed zoom; steady uses 650 km context and gentle response; dynamic uses 100–350 km context, leg awareness and faster response. Upstream prepares tiles, paints its own map canvas, includes OpenStreetMap/CARTO attribution, and encodes Android MP4. Its tests cover parser fixtures, filtering, timing, painter/animation, camera, export state, and Android large-import behavior.

## Compatibility versus web choices

Compatibility needs equivalent input acceptance, normalization, filtering semantics, haversine/spherical interpolation, date-line behavior, compression and observable camera behavior within tolerance. The web may use MapLibre, WebCodecs, browser-oriented streaming, another attributed provider/style, and different codecs/dimensions. Do not copy Android storage/lifecycle, MediaCodec, custom painter, or UI architecture blindly.
