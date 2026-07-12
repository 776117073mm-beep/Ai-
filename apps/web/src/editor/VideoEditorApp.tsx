import { useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent, ChangeEvent, MouseEvent, SyntheticEvent } from 'react';
import { formatTimecode, getClipWidthPx, getFrameFromPosition, toFrameCount } from './timelineUtils';

interface AssetItem {
  id: string;
  name: string;
  path: string;
  thumbnailUrl?: string;
  proxyUrl?: string;
  waveformUrl?: string;
  analysis?: {
    durationSeconds?: number;
    width?: number;
    height?: number;
    fps?: number;
    codec?: string;
    audioChannels?: number;
    audioSampleRate?: number;
  };
}

interface ClipItem {
  id: string;
  assetId: string;
  trackId: string;
  startFrame: number;
  durationFrames: number;
  trimIn: number;
  trimOut: number;
}

interface ProjectState {
  id: string;
  name: string;
  version: number;
  assets: AssetItem[];
  timeline: ClipItem[];
  settings: {
    playhead: number;
    zoom: number;
    playbackRate: number;
    workspace: {
      leftCollapsed: boolean;
      rightCollapsed: boolean;
      aiCollapsed: boolean;
    };
  };
  workspace: {
    leftCollapsed: boolean;
    rightCollapsed: boolean;
    aiCollapsed: boolean;
  };
}

const API_BASE = 'http://127.0.0.1:3100';

export function VideoEditorApp() {
  const [project, setProject] = useState<ProjectState | null>(null);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [timeline, setTimeline] = useState<ClipItem[]>([]);
  const [mediaStatus, setMediaStatus] = useState('Ready');
  const [isImporting, setIsImporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [currentAssetId, setCurrentAssetId] = useState<string | null>(null);
  const [playhead, setPlayhead] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [workspace, setWorkspace] = useState({ leftCollapsed: false, rightCollapsed: false, aiCollapsed: true });
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [waveformMap, setWaveformMap] = useState<Record<string, number[]>>({});
  const [draggedClipId, setDraggedClipId] = useState<string | null>(null);
  const [resizingClipId, setResizingClipId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const resizeStartRef = useRef<{ clipId: string; startX: number; initialDuration: number } | null>(null);

  useEffect(() => {
    const storedProjectId = window.localStorage.getItem('video-editor-project-id');
    if (storedProjectId) {
      void loadProject(storedProjectId);
      return;
    }
    void createProject();
  }, []);

  useEffect(() => {
    if (!project) return;
    setAssets(project.assets || []);
    setTimeline(project.timeline || []);
    setWorkspace(project.workspace || workspace);
    setPlayhead(project.settings?.playhead || 0);
    setZoom(project.settings?.zoom || 1);
    if (!currentAssetId && (project.assets?.length || 0) > 0) {
      setCurrentAssetId(project.assets[0].id);
    }
  }, [project]);

  useEffect(() => {
    if (!resizingClipId) return;
    const handleMove = (event: MouseEvent) => {
      if (!resizeStartRef.current || !resizeStartRef.current.clipId) return;
      const deltaFrames = Math.max(1, Math.round((event.clientX - resizeStartRef.current.startX) / Math.max(1, 8 * zoom)));
      const nextDuration = Math.max(1, resizeStartRef.current.initialDuration + deltaFrames);
      updateClip(resizeStartRef.current.clipId, { durationFrames: nextDuration, trimOut: nextDuration });
    };
    const handleUp = () => {
      setResizingClipId(null);
      resizeStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMove as unknown as EventListener);
    window.addEventListener('mouseup', handleUp as unknown as EventListener);
    return () => {
      window.removeEventListener('mousemove', handleMove as unknown as EventListener);
      window.removeEventListener('mouseup', handleUp as unknown as EventListener);
    };
  }, [resizingClipId, zoom]);

  const selectedAsset = useMemo(() => assets.find((asset) => asset.id === currentAssetId) || null, [assets, currentAssetId]);
  const selectedClip = useMemo(() => timeline.find((clip) => clip.id === selectedClipId) || null, [timeline, selectedClipId]);
  const durationFrames = useMemo(() => toFrameCount(selectedAsset?.analysis?.durationSeconds, selectedAsset?.analysis?.fps), [selectedAsset?.analysis?.durationSeconds, selectedAsset?.analysis?.fps]);

  useEffect(() => {
    if (!selectedAsset?.waveformUrl) return;
    const existing = waveformMap[selectedAsset.id];
    if (existing) return;
    void fetch(`${API_BASE}${selectedAsset.waveformUrl}`)
      .then((response) => response.json())
      .then((payload) => {
        setWaveformMap((value) => ({ ...value, [selectedAsset.id]: payload as number[] }));
      })
      .catch(() => undefined);
  }, [selectedAsset?.id, selectedAsset?.waveformUrl]);

  async function createProject() {
    try {
      const response = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Creative Project' })
      });
      const nextProject = await response.json();
      window.localStorage.setItem('video-editor-project-id', nextProject.id);
      setProject(nextProject);
      setMediaStatus('Project ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create project');
    }
  }

  async function loadProject(projectId: string) {
    try {
      const response = await fetch(`${API_BASE}/api/projects/${projectId}`);
      const nextProject = await response.json();
      window.localStorage.setItem('video-editor-project-id', nextProject.id);
      setProject(nextProject);
      setMediaStatus('Project restored');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load project');
    }
  }

  async function saveProject(nextProject: ProjectState) {
    if (!nextProject?.id) return;
    window.localStorage.setItem('video-editor-project-id', nextProject.id);
    await fetch(`${API_BASE}/api/projects/${nextProject.id}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextProject)
    });
  }

  async function importFiles(files: FileList | File[]) {
    if (!project) return;
    setIsImporting(true);
    setError('');
    setUploadProgress(10);
    setMediaStatus('Preparing import...');

    let currentProject = project;
    let currentAssets = assets;
    let currentTimeline = timeline;

    for (const file of Array.from(files)) {
      try {
        setUploadProgress(20);
        setMediaStatus(`Analyzing ${file.name}`);
        console.log('[frontend] selected file', file.name, file.type, file.size);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('filename', file.name);

        console.log('[frontend] upload request', `${API_BASE}/api/projects/${project.id}/import`);
        const response = await fetch(`${API_BASE}/api/projects/${project.id}/import`, {
          method: 'POST',
          body: formData
        });
        const payload = await response.json();
        console.log('[frontend] api response', payload);
        if (!response.ok) throw new Error(payload.error || 'Import failed');

        const nextAssets = [...currentAssets, payload.asset];
        const nextTimeline = [...currentTimeline, payload.clip];
        currentAssets = nextAssets;
        currentTimeline = nextTimeline;
        currentProject = {
          ...currentProject,
          assets: nextAssets,
          timeline: nextTimeline,
          settings: {
            ...currentProject.settings,
            playhead: 0,
            zoom
          },
          workspace
        };

        setProject(currentProject);
        setAssets(nextAssets);
        setTimeline(nextTimeline);
        setCurrentAssetId(payload.asset.id);
        setSelectedClipId(payload.clip.id);
        setUploadProgress(90);
        setMediaStatus(`Imported ${file.name}`);
        await saveProject(currentProject);
      } catch (err) {
        console.error('[frontend] import failed', err);
        setError(err instanceof Error ? err.message : 'Import failed');
      }
    }

    setUploadProgress(100);
    setIsImporting(false);
    setMediaStatus('Import complete');
    window.setTimeout(() => setUploadProgress(0), 900);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const droppedFiles = event.dataTransfer?.files;
    if (droppedFiles?.length) void importFiles(droppedFiles);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files?.length) void importFiles(files);
  }

  async function addAssetToTimeline(assetId: string) {
    if (!project) return;
    const asset = assets.find((entry) => entry.id === assetId);
    if (!asset) return;

    try {
      const response = await fetch(`${API_BASE}/api/projects/${project.id}/clips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, trackId: 'video-1', startFrame: playhead })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not add clip');

      const nextTimeline = [...timeline, payload.clip];
      const nextProject = { ...project, timeline: nextTimeline, settings: { ...project.settings, playhead, zoom }, workspace };
      setProject(nextProject);
      setTimeline(nextTimeline);
      setCurrentAssetId(assetId);
      setSelectedClipId(payload.clip.id);
      setMediaStatus(`Added ${asset.name} to timeline`);
      await saveProject(nextProject);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add clip');
    }
  }

  async function togglePlay() {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      return;
    }
    try {
      await videoRef.current.play();
      setIsPlaying(true);
    } catch {
      setError('Playback is blocked until the video is ready.');
    }
  }

  function seekTo(frame: number) {
    if (!videoRef.current) return;
    const fps = selectedAsset?.analysis?.fps || 30;
    const time = frame / Math.max(1, fps);
    videoRef.current.currentTime = time;
    setPlayhead(frame);
    setPlaybackTime(time);
  }

  function stepFrame(direction: 'forward' | 'backward') {
    const delta = direction === 'forward' ? 1 : -1;
    const nextFrame = playhead + delta;
    seekTo(nextFrame);
  }

  function handleTimeUpdate(event: SyntheticEvent<HTMLVideoElement>) {
    const currentTarget = event.currentTarget;
    const currentTime = currentTarget.currentTime || 0;
    const fps = selectedAsset?.analysis?.fps || 30;
    const nextFrame = Math.floor(currentTime * fps);
    setPlayhead(nextFrame);
    setPlaybackTime(currentTime);
  }

  function handleLoadedMetadata() {
    if (!videoRef.current) return;
    setVideoDuration(videoRef.current.duration || 0);
  }

  function removeClip(clipId: string) {
    const nextTimeline = timeline.filter((clip) => clip.id !== clipId);
    setTimeline(nextTimeline);
    if (project) {
      const nextProject = { ...project, timeline: nextTimeline };
      setProject(nextProject);
      void saveProject(nextProject);
    }
  }

  function splitClip(clipId: string) {
    const clip = timeline.find((item) => item.id === clipId);
    if (!clip) return;
    const midpoint = Math.floor((clip.startFrame + clip.durationFrames) / 2);
    const left = { ...clip, id: `${clip.id}-left`, durationFrames: Math.max(1, midpoint - clip.startFrame), trimOut: Math.max(1, midpoint - clip.startFrame) };
    const right = { ...clip, id: `${clip.id}-right`, startFrame: midpoint, trimIn: midpoint, trimOut: clip.trimOut };
    const nextTimeline = timeline.filter((item) => item.id !== clipId).concat([left, right]);
    setTimeline(nextTimeline);
    if (project) {
      const nextProject = { ...project, timeline: nextTimeline };
      setProject(nextProject);
      void saveProject(nextProject);
    }
  }

  function updateClip(clipId: string, updates: Partial<ClipItem>) {
    const nextTimeline = timeline.map((clip) => (clip.id === clipId ? { ...clip, ...updates } : clip));
    setTimeline(nextTimeline);
    if (project) {
      const nextProject = { ...project, timeline: nextTimeline };
      setProject(nextProject);
      void saveProject(nextProject);
    }
  }

  function handleTimelineDrop(event: DragEvent<HTMLDivElement>) {
    const clipId = event.dataTransfer.getData('text/plain');
    const clip = timeline.find((item) => item.id === clipId);
    if (!clip) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const frame = getFrameFromPosition(event.clientX - rect.left, zoom);
    updateClip(clip.id, { startFrame: frame });
    setDraggedClipId(null);
  }

  function startResize(event: MouseEvent<HTMLDivElement>, clipId: string) {
    event.stopPropagation();
    const clip = timeline.find((item) => item.id === clipId);
    if (!clip) return;
    resizeStartRef.current = { clipId, startX: event.clientX, initialDuration: clip.durationFrames };
    setResizingClipId(clipId);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)', color: '#f8fafc', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '12px 18px', background: 'rgba(2, 6, 23, 0.94)', backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.02em' }}>AI Creative Studio</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>{project?.name || 'Creating project…'}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ padding: '8px 10px', background: '#0f172a', borderRadius: 10, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', fontSize: 13 }}>
                Import media
                <input type="file" hidden multiple onChange={handleFileChange} />
              </label>
              <button style={{ padding: '8px 10px', background: '#2563eb', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontSize: 13 }} onClick={() => project && void saveProject(project)}>
                Save project
              </button>
            </div>
          </div>
        </header>

        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <aside style={{ width: workspace.leftCollapsed ? 56 : 280, borderRight: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15, 23, 42, 0.92)', padding: 14, overflow: 'auto', transition: 'width 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <strong>Media Browser</strong>
              <button style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }} onClick={() => setWorkspace((value) => ({ ...value, leftCollapsed: !value.leftCollapsed }))}>☰</button>
            </div>
            {!workspace.leftCollapsed && (
              <div onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} style={{ border: '1px dashed rgba(255,255,255,0.16)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.03)', marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Drag and drop media here</div>
                {isImporting ? <div style={{ fontSize: 13 }}>Processing… {uploadProgress}%</div> : <div style={{ fontSize: 13 }}>Drop a real video to analyze, transcode a proxy, and populate the editor.</div>}
                {uploadProgress > 0 && (
                  <div style={{ height: 6, marginTop: 8, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #38bdf8, #2563eb)', transition: 'width 0.2s ease' }} />
                  </div>
                )}
              </div>
            )}
            {!workspace.leftCollapsed && assets.map((asset) => (
              <div key={asset.id} style={{ width: '100%', border: currentAssetId === asset.id ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent', background: currentAssetId === asset.id ? 'rgba(37, 99, 235, 0.2)' : 'transparent', color: 'white', textAlign: 'left', padding: 10, borderRadius: 12, marginTop: 8 }}>
                <button onClick={() => { setCurrentAssetId(asset.id); setSelectedClipId(null); }} style={{ width: '100%', border: 'none', background: 'transparent', color: 'white', textAlign: 'left', padding: 0, cursor: 'pointer' }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{asset.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{asset.analysis?.durationSeconds ? `${asset.analysis.durationSeconds.toFixed(1)}s` : 'Analyzing'}</div>
                  {asset.thumbnailUrl ? <div style={{ height: 70, borderRadius: 8, marginTop: 8, overflow: 'hidden', background: '#020617' }}><img src={`${API_BASE}${asset.thumbnailUrl}`} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div> : null}
                </button>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={(event) => { event.stopPropagation(); void addAssetToTimeline(asset.id); }} style={{ flex: 1, padding: '6px 8px', borderRadius: 8, background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer' }}>Add to timeline</button>
                </div>
              </div>
            ))}
          </aside>

          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <section style={{ flex: 1, borderBottom: '1px solid rgba(255,255,255,0.08)', padding: 16, background: 'rgba(2, 6, 23, 0.78)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <strong>Preview</strong>
                <div style={{ color: '#94a3b8', fontSize: 13 }}>{formatTimecode(playbackTime)} / {formatTimecode(videoDuration)} · Frame {playhead}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #111827 0%, #020617 100%)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 20px 60px rgba(2,6,23,0.35)' }}>
                {selectedAsset?.proxyUrl ? (
                  <video key={selectedAsset.id} ref={videoRef} src={`${API_BASE}${selectedAsset.proxyUrl}`} controls={false} style={{ width: '100%', maxHeight: 380, background: '#000' }} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} />
                ) : (
                  <div style={{ color: '#94a3b8', textAlign: 'center' }}>Import a video to preview it here.</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                <button onClick={() => void togglePlay()} style={{ padding: '8px 10px', borderRadius: 10, background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer' }}>{isPlaying ? 'Pause' : 'Play'}</button>
                <button onClick={() => stepFrame('backward')} style={{ padding: '8px 10px', borderRadius: 10, background: '#0f172a', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>◀</button>
                <button onClick={() => stepFrame('forward')} style={{ padding: '8px 10px', borderRadius: 10, background: '#0f172a', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>▶</button>
                <button onClick={() => seekTo(0)} style={{ padding: '8px 10px', borderRadius: 10, background: '#0f172a', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>Reset</button>
                <input type="range" min="0.5" max="3" step="0.25" value={zoom} onChange={(event) => { const nextZoom = Number(event.target.value); setZoom(nextZoom); void saveProject({ ...project!, settings: { ...project!.settings, zoom: nextZoom } } as ProjectState); }} style={{ accentColor: '#38bdf8' }} />
                <span style={{ color: '#94a3b8', marginLeft: 8 }}>Zoom {zoom.toFixed(2)}x</span>
              </div>
            </section>

            <section style={{ flex: 1, padding: 16, background: '#020617', minHeight: 280 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <strong>Timeline</strong>
                <div style={{ color: '#94a3b8', fontSize: 13 }}>Drag clips · Split and trim · Preview sync</div>
              </div>
              <div onDragOver={(event) => event.preventDefault()} onDrop={handleTimelineDrop} style={{ background: '#111827', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 12, minHeight: 220, overflowX: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 8, color: '#94a3b8', fontSize: 12 }}>
                  <div style={{ width: 150 }}>Track 1</div>
                  <div style={{ flex: 1, position: 'relative', height: 28 }}>
                    <div style={{ position: 'absolute', inset: 0, borderBottom: '1px solid rgba(255,255,255,0.08)' }} />
                    <div style={{ position: 'absolute', left: `${Math.min(100, Math.max(0, (playhead / Math.max(1, durationFrames)) * 100))}%`, top: 0, bottom: 0, width: 2, background: '#38bdf8' }} />
                  </div>
                </div>
                {timeline.map((clip) => {
                  const asset = assets.find((entry) => entry.id === clip.assetId);
                  const width = getClipWidthPx(clip.durationFrames, zoom);
                  const waveform = waveformMap[clip.assetId] || [];
                  return (
                    <div key={clip.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ width: 150, color: '#94a3b8', fontSize: 12, paddingRight: 8 }}>{asset?.name || 'Asset'}</div>
                      <div style={{ flex: 1, position: 'relative', height: 76, borderRadius: 12, border: selectedClipId === clip.id ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255,255,255,0.08)', background: selectedClipId === clip.id ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255,255,255,0.03)', overflow: 'hidden' }}>
                        <div draggable onDragStart={(event) => { event.dataTransfer.setData('text/plain', clip.id); setDraggedClipId(clip.id); }} onDragEnd={() => setDraggedClipId(null)} onClick={() => { setSelectedClipId(clip.id); setCurrentAssetId(clip.assetId); seekTo(clip.startFrame); }} style={{ position: 'absolute', left: clip.startFrame * 8 * zoom, width, height: '100%', background: 'linear-gradient(135deg, rgba(37,99,235,0.35), rgba(56,189,248,0.15))', borderRadius: 10, display: 'flex', alignItems: 'center', padding: 8, cursor: 'grab', boxSizing: 'border-box' }}>
                          {asset?.thumbnailUrl ? <img src={`${API_BASE}${asset.thumbnailUrl}`} alt={asset.name} style={{ width: 72, height: 48, objectFit: 'cover', borderRadius: 8, marginRight: 8 }} /> : null}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{asset?.name || 'Clip'}</div>
                            <div style={{ fontSize: 11, color: '#cbd5e1' }}>{clip.durationFrames}f</div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <button onClick={(event) => { event.stopPropagation(); splitClip(clip.id); }} style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '4px 6px', borderRadius: 6, cursor: 'pointer' }}>Split</button>
                            <button onClick={(event) => { event.stopPropagation(); removeClip(clip.id); }} style={{ background: '#7f1d1d', border: 'none', color: 'white', padding: '4px 6px', borderRadius: 6, cursor: 'pointer' }}>Delete</button>
                          </div>
                        </div>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                          {waveform.slice(0, 48).map((value, index) => <div key={`${clip.id}-${index}`} style={{ width: 2, height: `${Math.max(6, value * 34)}px`, background: 'rgba(148,163,184,0.45)', margin: '0 1px' }} />)}
                        </div>
                        <div onMouseDown={(event) => startResize(event, clip.id)} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 8, background: 'rgba(56,189,248,0.25)', cursor: 'ew-resize' }} />
                      </div>
                    </div>
                  );
                })}
                {draggedClipId ? <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 8 }}>Drop clip to reposition it.</div> : null}
              </div>
            </section>
          </main>

          <aside style={{ width: workspace.rightCollapsed ? 56 : 320, borderLeft: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15, 23, 42, 0.92)', padding: 12, overflow: 'auto', transition: 'width 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong>Inspector</strong>
              <button style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }} onClick={() => setWorkspace((value) => ({ ...value, rightCollapsed: !value.rightCollapsed }))}>☰</button>
            </div>
            {!workspace.rightCollapsed && (
              <>
                {selectedAsset && (
                  <div style={{ marginBottom: 10, padding: 10, background: '#111827', borderRadius: 12 }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Selected media</div>
                    <div>{selectedAsset.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Duration: {selectedAsset.analysis?.durationSeconds?.toFixed(1) || '—'}s</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Resolution: {selectedAsset.analysis?.width || 0} × {selectedAsset.analysis?.height || 0}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Codec: {selectedAsset.analysis?.codec || '—'}</div>
                  </div>
                )}
                {selectedClip && (
                  <div style={{ padding: 10, background: '#111827', borderRadius: 12, marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Clip controls</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      <button onClick={() => updateClip(selectedClip.id, { startFrame: playhead })} style={{ padding: '6px 8px', borderRadius: 8, background: '#2563eb', color: 'white', border: 'none' }}>Set start</button>
                      <button onClick={() => splitClip(selectedClip.id)} style={{ padding: '6px 8px', borderRadius: 8, background: '#0f172a', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>Split</button>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Frame range: {selectedClip.startFrame} → {selectedClip.startFrame + selectedClip.durationFrames}</div>
                  </div>
                )}
                <div style={{ padding: 10, background: '#111827', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>AI Assistant</div>
                  <div style={{ color: '#cbd5e1', fontSize: 13 }}>{workspace.aiCollapsed ? 'Open the assistant to suggest edits, titles, and pacing.' : 'Assistant ready for prompts.'}</div>
                  <button onClick={() => setWorkspace((value) => ({ ...value, aiCollapsed: !value.aiCollapsed }))} style={{ marginTop: 8, padding: '6px 8px', borderRadius: 8, background: '#0f172a', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>{workspace.aiCollapsed ? 'Expand' : 'Collapse'}</button>
                </div>
              </>
            )}
          </aside>
        </div>

        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '10px 16px', background: 'rgba(17, 24, 39, 0.96)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>{mediaStatus}</div>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>{error || 'Real media import and playback are active.'}</div>
        </footer>
      </div>
    </div>
  );
}
