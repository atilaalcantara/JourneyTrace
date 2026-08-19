# Testing strategy

Current coverage is two parser checks only; it does not establish claimed compatibility.

Unit fixtures must cover direct Android and iOS, semanticSegments, E7/`geo:`/`latLng`, malformed coordinates, empty timeline, invalid JSON, Takeout-like export, outlier filtering, great-circle interpolation, anti-meridian crossing, large input, worker message/progress/cancellation, unsupported codec and export cancellation. Fixtures are synthetic only. Assert exact structural results and documented floating tolerances for distance/interpolation/timing against upstream-compatible expectations.

Critical Playwright flows: keyboard-accessible import success; malformed/Takeout guidance; date/settings changes; mobile layout; map route/attribution; preview controls; export progress then completed download; cancellation; unsupported-codec fallback. Add deterministic visual/canvas checks only after MapLibre POC establishes a stable harness. Real browser/device matrices supplement—not replace—automated tests.
