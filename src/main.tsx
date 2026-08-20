import { lazy, Suspense, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  FileUp,
  HelpCircle,
  Map,
  MapPin,
  Menu,
  Pause,
  Play,
  Settings2,
  ShieldCheck,
  X,
} from "lucide-react";
import type { Timeline } from "./core/timeline/parser";
import type { CameraMode } from "./map/camera";
import { JourneyMapView } from "./map/JourneyMapView";
import {
  exportJourneyVideo,
  type ExportUpdate,
} from "./features/video-export/journey-export";
import {
  DEFAULT_EXPORT_SETTINGS,
  type ExportAspect,
  type ExportDuration,
  type ExportQuality,
} from "./features/video-export/config";
import "./styles.css";
import "./example-journey.css";
const VideoPocPage = lazy(() => import("./features/video-poc/VideoPocPage"));
const fmt = (n: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(n);
const requestId = () =>
  crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;
function Segment<T extends string>({
  label,
  value,
  items,
  set,
}: {
  label: string;
  value: T;
  items: { value: T; label: string }[];
  set: (value: T) => void;
}) {
  return (
    <fieldset className="segmented">
      <legend>{label}</legend>
      <div>
        {items.map((item) => (
          <button
            type="button"
            className={value === item.value ? "selected" : ""}
            aria-pressed={value === item.value}
            onClick={() => set(item.value)}
            key={item.value}
          >
            {item.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
function SourceCredit() {
  return (
    <>
      <a href="/how-to-export-google-timeline/">Google Timeline guides</a> ·{" "}
      JourneyTrace is inspired by{" "}
      <a
        href="https://github.com/mahlernim/google-timeline-visualizer"
        target="_blank"
        rel="noreferrer"
      >
        Timeline Visualizer by mahlernim
      </a>{" "}
      · MIT licensed.
    </>
  );
}
function App() {
  const [timeline, setTimeline] = useState<Timeline | null>(null),
    [error, setError] = useState(""),
    [importing, setImporting] = useState(false),
    [guide, setGuide] = useState(false),
    [menu, setMenu] = useState(false),
    [settings, setSettings] = useState(false),
    [drag, setDrag] = useState(false),
    [playing, setPlaying] = useState(false),
    [cameraMode, setCameraMode] = useState<CameraMode>("steady"),
    [quality, setQuality] = useState<ExportQuality>(
      DEFAULT_EXPORT_SETTINGS.quality,
    ),
    [aspect, setAspect] = useState<ExportAspect>(
      DEFAULT_EXPORT_SETTINGS.aspect,
    ),
    [duration, setDuration] = useState<ExportDuration>(
      DEFAULT_EXPORT_SETTINGS.duration,
    ),
    [exportUpdate, setExportUpdate] = useState<ExportUpdate | null>(null),
    [exportError, setExportError] = useState(""),
    [video, setVideo] = useState<{ url: string; size: number } | null>(null);
  const input = useRef<HTMLInputElement>(null),
    cancelExport = useRef(false);
  if (
    import.meta.env.DEV &&
    new URLSearchParams(location.search).get("videoPoc") === "1"
  )
    return (
      <Suspense fallback={<main />}>
        <VideoPocPage />
      </Suspense>
    );
  const read = (file: File) => {
    setError("");
    if (!file.name.toLowerCase().endsWith(".json")) {
      setError("Choose a JSON Timeline file.");
      return;
    }
    setImporting(true);
    const worker = new Worker(
        new URL("./workers/timeline.worker.ts", import.meta.url),
        { type: "module" },
      ),
      id = requestId(),
      fail = () => {
        worker.terminate();
        setImporting(false);
        setError("Could not read this Timeline file. Please try again.");
      };
    worker.onerror = fail;
    worker.onmessage = ({ data }) => {
      if (data.id !== id || data.type === "progress") return;
      worker.terminate();
      setImporting(false);
      if (data.type === "success") setTimeline(data.journey);
      else
        setError(
          "This doesn’t look like the Timeline file JourneyTrace needs.",
        );
    };
    try {
      worker.postMessage({ type: "process", id, file });
    } catch {
      fail();
    }
  };
  const loadExample = async () => {
    setError("");
    setImporting(true);
    try {
      const response = await fetch(
        `${import.meta.env.BASE_URL}samples/journeytrace-demo-oslo.json`,
      );
      if (!response.ok) throw new Error("Example file unavailable");
      const contents = await response.blob();
      read(
        new File([contents], "journeytrace-example-oslo.json", {
          type: "application/json",
        }),
      );
    } catch {
      setImporting(false);
      setError("Could not load the example journey. Please try again.");
    }
  };
  const startExport = async () => {
    if (!timeline) return;
    cancelExport.current = false;
    setExportError("");
    setSettings(false);
    setVideo((old) => {
      if (old) URL.revokeObjectURL(old.url);
      return null;
    });
    try {
      const blob = await exportJourneyVideo({
        journey: timeline,
        cameraMode,
        settings: { quality, aspect, duration },
        cancelled: () => cancelExport.current,
        onUpdate: setExportUpdate,
      });
      setVideo({ url: URL.createObjectURL(blob), size: blob.size });
      setExportUpdate(null);
    } catch (e) {
      setExportUpdate(null);
      setExportError(
        e instanceof DOMException && e.name === "AbortError"
          ? "Export cancelled."
          : e instanceof Error
            ? e.message
            : "Video export failed.",
      );
    }
  };
  if (timeline) {
    const cfg = `${cameraMode[0].toUpperCase()}${cameraMode.slice(1)} · ${aspect === "landscape" ? "16:9" : aspect === "portrait" ? "9:16" : "1:1"} · ${quality} · ${duration}s`,
      disabled = !!exportUpdate;
    return (
      <main className={`journey ${playing ? "is-playing" : ""}`}>
        <header className="journey-header">
          <strong>JourneyTrace</strong>
          <button
            className="overflow-button"
            aria-label="More options"
            onClick={() => setMenu(!menu)}
          >
            <Menu size={22} />
          </button>
          {menu && (
            <div className="header-menu">
              <button className="quiet" onClick={() => setTimeline(null)}>
                Import another file
              </button>
              <button className="quiet" onClick={() => setGuide(true)}>
                About
              </button>
            </div>
          )}
        </header>
        <section className="map" aria-label="Journey map">
          <JourneyMapView
            journey={timeline}
            playing={playing}
            mode={cameraMode}
          />
          <div className="map-note">
            <MapPin size={16} /> Your route is ready
          </div>
        </section>
        <section className="journey-summary">
          <p>
            {fmt(timeline.statistics.totalDistanceMeters / 1000)} km ·{" "}
            {fmt(timeline.points.length)} locations
          </p>
          <h1>
            {new Date(timeline.statistics.start).toLocaleDateString()} —{" "}
            {new Date(timeline.statistics.end).toLocaleDateString()}
          </h1>
        </section>
        <section className="mobile-configuration">
          <span>{cfg}</span>
          <button
            className="quiet"
            disabled={disabled}
            onClick={() => setSettings(true)}
          >
            <Settings2 size={18} /> Settings
          </button>
        </section>
        <section className="desktop-controls">
          <label>
            Camera
            <select
              value={cameraMode}
              disabled={disabled}
              onChange={(e) => setCameraMode(e.target.value as CameraMode)}
            >
              <option value="steady">Steady</option>
              <option value="fixed">Fixed</option>
              <option value="dynamic">Dynamic</option>
            </select>
          </label>
          <label>
            Quality
            <select
              value={quality}
              disabled={disabled}
              onChange={(e) => setQuality(e.target.value as ExportQuality)}
            >
              <option value="480p">480p · Faster</option>
              <option value="720p">720p · Recommended</option>
              <option value="1080p">1080p · Best</option>
            </select>
          </label>
          <label>
            Format
            <select
              value={aspect}
              disabled={disabled}
              onChange={(e) => setAspect(e.target.value as ExportAspect)}
            >
              <option value="landscape">Landscape · 16:9</option>
              <option value="portrait">Portrait · 9:16</option>
              <option value="square">Square · 1:1</option>
            </select>
          </label>
          <label>
            Duration
            <select value={duration} disabled={disabled} onChange={(e) => setDuration(Number(e.target.value) as ExportDuration)}>
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds</option>
              <option value={90}>90 seconds</option>
            </select>
          </label>
        </section>
        <section className="primary-actions">
          <button
            className="secondary"
            disabled={disabled}
            aria-pressed={playing}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? <Pause size={18} /> : <Play size={18} />}
            {playing ? "Pause" : "Preview"}
          </button>
          <button disabled={disabled} onClick={startExport}>
            <FileUp size={18} /> Export video
          </button>
        </section>
        {settings && (
          <div className="sheet-backdrop" onClick={() => setSettings(false)}>
            <section
              className="settings-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Video settings"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sheet-handle" />
              <h2>Video settings</h2>
              <Segment
                label="Camera"
                value={cameraMode}
                set={setCameraMode}
                items={[
                  { value: "fixed", label: "Fixed" },
                  { value: "steady", label: "Steady" },
                  { value: "dynamic", label: "Dynamic" },
                ]}
              />
              <Segment
                label="Format"
                value={aspect}
                set={setAspect}
                items={[
                  { value: "landscape", label: "16:9" },
                  { value: "portrait", label: "9:16" },
                  { value: "square", label: "1:1" },
                ]}
              />
              <Segment
                label="Quality"
                value={quality}
                set={setQuality}
                items={[
                  { value: "480p", label: "480p" },
                  { value: "720p", label: "720p" },
                  { value: "1080p", label: "1080p" },
                ]}
              />
              <Segment
                label="Duration"
                value={String(duration)}
                set={(value) => setDuration(Number(value) as ExportDuration)}
                items={[
                  { value: "15", label: "15s" },
                  { value: "30", label: "30s" },
                  { value: "60", label: "60s" },
                  { value: "90", label: "90s" },
                ]}
              />
              <button className="sheet-done" onClick={() => setSettings(false)}>
                Done
              </button>
            </section>
          </div>
        )}
        {exportUpdate && (
          <section className="export-focus" role="status">
            <h2>Creating your journey</h2>
            <div className="progress-bar">
              <i
                style={{ width: `${Math.round(exportUpdate.progress * 100)}%` }}
              />
            </div>
            <b>{Math.round(exportUpdate.progress * 100)}%</b>
            <p>{exportUpdate.detail}</p>
            <p>
              {exportUpdate.frame} / {exportUpdate.totalFrames} frames
            </p>
            <small>Everything is processed on this device.</small>
            <button
              className="quiet"
              onClick={() => {
                cancelExport.current = true;
              }}
            >
              Cancel
            </button>
          </section>
        )}
        {video && (
          <section className="export-focus complete">
            <h2>Your journey is ready.</h2>
            <p>
              {duration} sec · {quality} ·{" "}
              {aspect === "landscape"
                ? "16:9"
                : aspect === "portrait"
                  ? "9:16"
                  : "1:1"}
            </p>
            <p>{(video.size / 1024 / 1024).toFixed(1)} MB</p>
            <a href={video.url} download="journeytrace.mp4">
              Save video
            </a>
            <button className="quiet" onClick={() => setVideo(null)}>
              Create another
            </button>
          </section>
        )}
        {exportError && <p className="error journey-error">{exportError}</p>}
        <footer>
          <SourceCredit />
        </footer>
        {guide && (
          <dialog open>
            <button
              className="close"
              aria-label="Close"
              onClick={() => setGuide(false)}
            >
              <X />
            </button>
            <h2>Get your Timeline file</h2>
            <p>
              <b>Android:</b> Phone Settings → Location → Location services →
              Timeline → Export Timeline data.
            </p>
            <p>
              <b>iPhone:</b> Google Maps → profile picture → Settings → Personal
              content → Export Timeline data.
            </p>
          </dialog>
        )}
      </main>
    );
  }
  return (
    <main className="landing">
      <header>
        <strong>JourneyTrace</strong>
        <button className="quiet" onClick={() => setGuide(true)}>
          About
        </button>
      </header>
      <section className="hero">
        <div className="privacy">
          <ShieldCheck size={16} /> Private by design
        </div>
        <h1>
          Your journey,
          <br />
          in motion.
        </h1>
        <p>Turn your Google Timeline into a beautiful animated travel map.</p>
        <button
          type="button"
          className="example-journey"
          disabled={importing}
          onClick={loadExample}
        >
          <Map size={18} /> Try an example journey
        </button>
        <p className="example-copy">
          Explore a short, fictional route through Oslo before importing your
          own Timeline.
        </p>
        <div
          className={"dropzone " + (drag ? "drag" : "")}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const file = e.dataTransfer.files[0];
            if (file) read(file);
          }}
          onClick={() => !importing && input.current?.click()}
        >
          <FileUp size={28} />
          <h2>
            {importing ? "Reading your Timeline…" : "Choose Timeline file"}
          </h2>
          <span>
            {importing
              ? "This may take a moment on iPhone."
              : "JSON file from Google Timeline"}
          </span>
          <input
            ref={input}
            type="file"
            accept="application/json,.json"
            onChange={(e) => e.target.files?.[0] && read(e.target.files[0])}
          />
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <p className="device">
          <ShieldCheck size={17} /> Your Timeline stays on this device.
        </p>
        <button className="link" onClick={() => setGuide(true)}>
          <HelpCircle size={17} /> How do I get my Timeline?
        </button>
      </section>
      <footer>
        <SourceCredit />
      </footer>
      {guide && (
        <dialog open>
          <button
            className="close"
            aria-label="Close"
            onClick={() => setGuide(false)}
          >
            <X />
          </button>
          <h2>Get your Timeline file</h2>
          <p>
            <b>Android:</b> Phone Settings → Location → Location services →
            Timeline → Export Timeline data.
          </p>
          <p>
            <b>iPhone:</b> Google Maps → profile picture → Settings → Personal
            content → Export Timeline data.
          </p>
        </dialog>
      )}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
