# Browser POC results

All physical-browser results are **NOT TESTED**. The development POC is available at `/?videoPoc=1` only while running Vite in development mode.

| Platform | Browser | WebCodecs | H.264 | MP4 | Playback | Notes |
|---|---|---|---|---|---|---|
| macOS | Safari | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Test locally. |
| iPhone | Safari | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Use HTTPS for meaningful capability results. |
| macOS | Chrome | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Test locally. |
| Windows | Chrome/Edge | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Test locally. |
| Android | Chrome | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Test locally. |
| Desktop | Firefox | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Test locally. |

## Manual test

On macOS run `npm run dev`, open `http://localhost:5173/?videoPoc=1`, press **Generate test video**, then download and play the MP4. For iPhone run `npm run dev -- --host`; a LAN HTTP address is not a trustworthy WebCodecs test because secure-context requirements can differ. Use a local trusted HTTPS development certificate/server before drawing conclusions about Safari iOS support.
