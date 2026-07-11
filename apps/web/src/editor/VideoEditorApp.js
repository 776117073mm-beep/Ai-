import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatTimecode, getClipWidthPx, getFrameFromPosition, toFrameCount } from './timelineUtils';
const API_BASE = 'http://127.0.0.1:3100';
export function VideoEditorApp() {
    const [project, setProject] = useState(null);
    const [assets, setAssets] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [mediaStatus, setMediaStatus] = useState('Ready');
    const [isImporting, setIsImporting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const [currentAssetId, setCurrentAssetId] = useState(null);
    const [playhead, setPlayhead] = useState(0);
    const [playbackTime, setPlaybackTime] = useState(0);
    const [videoDuration, setVideoDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [workspace, setWorkspace] = useState({ leftCollapsed: false, rightCollapsed: false, aiCollapsed: true });
    const [selectedClipId, setSelectedClipId] = useState(null);
    const [waveformMap, setWaveformMap] = useState({});
    const [draggedClipId, setDraggedClipId] = useState(null);
    const [resizingClipId, setResizingClipId] = useState(null);
    const videoRef = useRef(null);
    const resizeStartRef = useRef(null);
    useEffect(() => {
        const storedProjectId = window.localStorage.getItem('video-editor-project-id');
        if (storedProjectId) {
            void loadProject(storedProjectId);
            return;
        }
        void createProject();
    }, []);
    useEffect(() => {
        if (!project)
            return;
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
        if (!resizingClipId)
            return;
        const handleMove = (event) => {
            if (!resizeStartRef.current || !resizeStartRef.current.clipId)
                return;
            const deltaFrames = Math.max(1, Math.round((event.clientX - resizeStartRef.current.startX) / Math.max(1, 8 * zoom)));
            const nextDuration = Math.max(1, resizeStartRef.current.initialDuration + deltaFrames);
            updateClip(resizeStartRef.current.clipId, { durationFrames: nextDuration, trimOut: nextDuration });
        };
        const handleUp = () => {
            setResizingClipId(null);
            resizeStartRef.current = null;
        };
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [resizingClipId, zoom]);
    const selectedAsset = useMemo(() => assets.find((asset) => asset.id === currentAssetId) || null, [assets, currentAssetId]);
    const selectedClip = useMemo(() => timeline.find((clip) => clip.id === selectedClipId) || null, [timeline, selectedClipId]);
    const durationFrames = useMemo(() => toFrameCount(selectedAsset?.analysis?.durationSeconds, selectedAsset?.analysis?.fps), [selectedAsset?.analysis?.durationSeconds, selectedAsset?.analysis?.fps]);
    useEffect(() => {
        if (!selectedAsset?.waveformUrl)
            return;
        const existing = waveformMap[selectedAsset.id];
        if (existing)
            return;
        void fetch(`${API_BASE}${selectedAsset.waveformUrl}`)
            .then((response) => response.json())
            .then((payload) => {
            setWaveformMap((value) => ({ ...value, [selectedAsset.id]: payload }));
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
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Could not create project');
        }
    }
    async function loadProject(projectId) {
        try {
            const response = await fetch(`${API_BASE}/api/projects/${projectId}`);
            const nextProject = await response.json();
            window.localStorage.setItem('video-editor-project-id', nextProject.id);
            setProject(nextProject);
            setMediaStatus('Project restored');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load project');
        }
    }
    async function saveProject(nextProject) {
        if (!nextProject?.id)
            return;
        window.localStorage.setItem('video-editor-project-id', nextProject.id);
        await fetch(`${API_BASE}/api/projects/${nextProject.id}/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nextProject)
        });
    }
    async function importFiles(files) {
        if (!project)
            return;
        setIsImporting(true);
        setError('');
        setUploadProgress(10);
        setMediaStatus('Preparing import...');
        for (const file of Array.from(files)) {
            try {
                setUploadProgress(20);
                setMediaStatus(`Analyzing ${file.name}`);
                const response = await fetch(`${API_BASE}/api/projects/${project.id}/import`, {
                    method: 'POST',
                    headers: { 'x-file-name': file.name },
                    body: file
                });
                const payload = await response.json();
                if (!response.ok)
                    throw new Error(payload.error || 'Import failed');
                const nextAssets = [...assets, payload.asset];
                const nextTimeline = [...timeline, payload.clip];
                const nextProject = {
                    ...project,
                    assets: nextAssets,
                    timeline: nextTimeline,
                    settings: {
                        ...project.settings,
                        playhead: 0,
                        zoom
                    },
                    workspace
                };
                setProject(nextProject);
                setAssets(nextAssets);
                setTimeline(nextTimeline);
                setCurrentAssetId(payload.asset.id);
                setSelectedClipId(payload.clip.id);
                setUploadProgress(90);
                setMediaStatus(`Imported ${file.name}`);
                await saveProject(nextProject);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Import failed');
            }
        }
        setUploadProgress(100);
        setIsImporting(false);
        setMediaStatus('Import complete');
        window.setTimeout(() => setUploadProgress(0), 900);
    }
    function handleDrop(event) {
        event.preventDefault();
        const droppedFiles = event.dataTransfer?.files;
        if (droppedFiles?.length)
            void importFiles(droppedFiles);
    }
    function handleFileChange(event) {
        const files = event.target.files;
        if (files?.length)
            void importFiles(files);
    }
    async function togglePlay() {
        if (!videoRef.current)
            return;
        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
            return;
        }
        try {
            await videoRef.current.play();
            setIsPlaying(true);
        }
        catch {
            setError('Playback is blocked until the video is ready.');
        }
    }
    function seekTo(frame) {
        if (!videoRef.current)
            return;
        const fps = selectedAsset?.analysis?.fps || 30;
        const time = frame / Math.max(1, fps);
        videoRef.current.currentTime = time;
        setPlayhead(frame);
        setPlaybackTime(time);
    }
    function stepFrame(direction) {
        const delta = direction === 'forward' ? 1 : -1;
        const nextFrame = playhead + delta;
        seekTo(nextFrame);
    }
    function handleTimeUpdate(event) {
        const currentTarget = event.currentTarget;
        const currentTime = currentTarget.currentTime || 0;
        const fps = selectedAsset?.analysis?.fps || 30;
        const nextFrame = Math.floor(currentTime * fps);
        setPlayhead(nextFrame);
        setPlaybackTime(currentTime);
    }
    function handleLoadedMetadata() {
        if (!videoRef.current)
            return;
        setVideoDuration(videoRef.current.duration || 0);
    }
    function removeClip(clipId) {
        const nextTimeline = timeline.filter((clip) => clip.id !== clipId);
        setTimeline(nextTimeline);
        if (project) {
            const nextProject = { ...project, timeline: nextTimeline };
            setProject(nextProject);
            void saveProject(nextProject);
        }
    }
    function splitClip(clipId) {
        const clip = timeline.find((item) => item.id === clipId);
        if (!clip)
            return;
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
    function updateClip(clipId, updates) {
        const nextTimeline = timeline.map((clip) => (clip.id === clipId ? { ...clip, ...updates } : clip));
        setTimeline(nextTimeline);
        if (project) {
            const nextProject = { ...project, timeline: nextTimeline };
            setProject(nextProject);
            void saveProject(nextProject);
        }
    }
    function handleTimelineDrop(event) {
        const clipId = event.dataTransfer.getData('text/plain');
        const clip = timeline.find((item) => item.id === clipId);
        if (!clip)
            return;
        const rect = event.currentTarget.getBoundingClientRect();
        const frame = getFrameFromPosition(event.clientX - rect.left, zoom);
        updateClip(clip.id, { startFrame: frame });
        setDraggedClipId(null);
    }
    function startResize(event, clipId) {
        event.stopPropagation();
        const clip = timeline.find((item) => item.id === clipId);
        if (!clip)
            return;
        resizeStartRef.current = { clipId, startX: event.clientX, initialDuration: clip.durationFrames };
        setResizingClipId(clipId);
    }
    return (_jsx("div", { style: { minHeight: '100vh', background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)', color: '#f8fafc', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }, children: _jsxs("div", { style: { display: 'flex', flexDirection: 'column', height: '100vh' }, children: [_jsx("header", { style: { borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '12px 18px', background: 'rgba(2, 6, 23, 0.94)', backdropFilter: 'blur(10px)' }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: 20, fontWeight: 700, letterSpacing: '0.02em' }, children: "AI Creative Studio" }), _jsx("div", { style: { color: '#94a3b8', fontSize: 12 }, children: project?.name || 'Creating project…' })] }), _jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center' }, children: [_jsxs("label", { style: { padding: '8px 10px', background: '#0f172a', borderRadius: 10, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', fontSize: 13 }, children: ["Import media", _jsx("input", { type: "file", hidden: true, multiple: true, onChange: handleFileChange })] }), _jsx("button", { style: { padding: '8px 10px', background: '#2563eb', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontSize: 13 }, onClick: () => project && void saveProject(project), children: "Save project" })] })] }) }), _jsxs("div", { style: { display: 'flex', flex: 1, minHeight: 0 }, children: [_jsxs("aside", { style: { width: workspace.leftCollapsed ? 56 : 280, borderRight: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15, 23, 42, 0.92)', padding: 14, overflow: 'auto', transition: 'width 0.2s ease' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }, children: [_jsx("strong", { children: "Media Browser" }), _jsx("button", { style: { background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }, onClick: () => setWorkspace((value) => ({ ...value, leftCollapsed: !value.leftCollapsed })), children: "\u2630" })] }), !workspace.leftCollapsed && (_jsxs("div", { onDragOver: (event) => event.preventDefault(), onDrop: handleDrop, style: { border: '1px dashed rgba(255,255,255,0.16)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.03)', marginBottom: 10 }, children: [_jsx("div", { style: { fontSize: 12, color: '#94a3b8', marginBottom: 8 }, children: "Drag and drop media here" }), isImporting ? _jsxs("div", { style: { fontSize: 13 }, children: ["Processing\u2026 ", uploadProgress, "%"] }) : _jsx("div", { style: { fontSize: 13 }, children: "Drop a real video to analyze, transcode a proxy, and populate the editor." }), uploadProgress > 0 && (_jsx("div", { style: { height: 6, marginTop: 8, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }, children: _jsx("div", { style: { height: '100%', width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #38bdf8, #2563eb)', transition: 'width 0.2s ease' } }) }))] })), !workspace.leftCollapsed && assets.map((asset) => (_jsxs("button", { onClick: () => { setCurrentAssetId(asset.id); setSelectedClipId(null); }, style: { width: '100%', border: currentAssetId === asset.id ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent', background: currentAssetId === asset.id ? 'rgba(37, 99, 235, 0.2)' : 'transparent', color: 'white', textAlign: 'left', padding: 10, borderRadius: 12, marginTop: 8, cursor: 'pointer' }, children: [_jsx("div", { style: { fontSize: 12, fontWeight: 600 }, children: asset.name }), _jsx("div", { style: { fontSize: 11, color: '#94a3b8', marginTop: 4 }, children: asset.analysis?.durationSeconds ? `${asset.analysis.durationSeconds.toFixed(1)}s` : 'Analyzing' }), asset.thumbnailUrl ? _jsx("div", { style: { height: 70, borderRadius: 8, marginTop: 8, overflow: 'hidden', background: '#020617' }, children: _jsx("img", { src: `${API_BASE}${asset.thumbnailUrl}`, alt: asset.name, style: { width: '100%', height: '100%', objectFit: 'cover' } }) }) : null] }, asset.id)))] }), _jsxs("main", { style: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }, children: [_jsxs("section", { style: { flex: 1, borderBottom: '1px solid rgba(255,255,255,0.08)', padding: 16, background: 'rgba(2, 6, 23, 0.78)' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }, children: [_jsx("strong", { children: "Preview" }), _jsxs("div", { style: { color: '#94a3b8', fontSize: 13 }, children: [formatTimecode(playbackTime), " / ", formatTimecode(videoDuration), " \u00B7 Frame ", playhead] })] }), _jsx("div", { style: { background: 'linear-gradient(135deg, #111827 0%, #020617 100%)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 20px 60px rgba(2,6,23,0.35)' }, children: selectedAsset?.proxyUrl ? (_jsx("video", { ref: videoRef, src: `${API_BASE}${selectedAsset.proxyUrl}`, controls: false, style: { width: '100%', maxHeight: 380, background: '#000' }, onTimeUpdate: handleTimeUpdate, onLoadedMetadata: handleLoadedMetadata }, selectedAsset.id)) : (_jsx("div", { style: { color: '#94a3b8', textAlign: 'center' }, children: "Import a video to preview it here." })) }), _jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }, children: [_jsx("button", { onClick: () => void togglePlay(), style: { padding: '8px 10px', borderRadius: 10, background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer' }, children: isPlaying ? 'Pause' : 'Play' }), _jsx("button", { onClick: () => stepFrame('backward'), style: { padding: '8px 10px', borderRadius: 10, background: '#0f172a', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }, children: "\u25C0" }), _jsx("button", { onClick: () => stepFrame('forward'), style: { padding: '8px 10px', borderRadius: 10, background: '#0f172a', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }, children: "\u25B6" }), _jsx("button", { onClick: () => seekTo(0), style: { padding: '8px 10px', borderRadius: 10, background: '#0f172a', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }, children: "Reset" }), _jsx("input", { type: "range", min: "0.5", max: "3", step: "0.25", value: zoom, onChange: (event) => { const nextZoom = Number(event.target.value); setZoom(nextZoom); void saveProject({ ...project, settings: { ...project.settings, zoom: nextZoom } }); }, style: { accentColor: '#38bdf8' } }), _jsxs("span", { style: { color: '#94a3b8', marginLeft: 8 }, children: ["Zoom ", zoom.toFixed(2), "x"] })] })] }), _jsxs("section", { style: { flex: 1, padding: 16, background: '#020617', minHeight: 280 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }, children: [_jsx("strong", { children: "Timeline" }), _jsx("div", { style: { color: '#94a3b8', fontSize: 13 }, children: "Drag clips \u00B7 Split and trim \u00B7 Preview sync" })] }), _jsxs("div", { onDragOver: (event) => event.preventDefault(), onDrop: handleTimelineDrop, style: { background: '#111827', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 12, minHeight: 220, overflowX: 'auto' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', paddingBottom: 8, color: '#94a3b8', fontSize: 12 }, children: [_jsx("div", { style: { width: 150 }, children: "Track 1" }), _jsxs("div", { style: { flex: 1, position: 'relative', height: 28 }, children: [_jsx("div", { style: { position: 'absolute', inset: 0, borderBottom: '1px solid rgba(255,255,255,0.08)' } }), _jsx("div", { style: { position: 'absolute', left: `${Math.min(100, Math.max(0, (playhead / Math.max(1, durationFrames)) * 100))}%`, top: 0, bottom: 0, width: 2, background: '#38bdf8' } })] })] }), timeline.map((clip) => {
                                                    const asset = assets.find((entry) => entry.id === clip.assetId);
                                                    const width = getClipWidthPx(clip.durationFrames, zoom);
                                                    const waveform = waveformMap[clip.assetId] || [];
                                                    return (_jsxs("div", { style: { display: 'flex', alignItems: 'center', marginBottom: 8 }, children: [_jsx("div", { style: { width: 150, color: '#94a3b8', fontSize: 12, paddingRight: 8 }, children: asset?.name || 'Asset' }), _jsxs("div", { style: { flex: 1, position: 'relative', height: 76, borderRadius: 12, border: selectedClipId === clip.id ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255,255,255,0.08)', background: selectedClipId === clip.id ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255,255,255,0.03)', overflow: 'hidden' }, children: [_jsxs("div", { draggable: true, onDragStart: (event) => { event.dataTransfer.setData('text/plain', clip.id); setDraggedClipId(clip.id); }, onDragEnd: () => setDraggedClipId(null), onClick: () => { setSelectedClipId(clip.id); setCurrentAssetId(clip.assetId); seekTo(clip.startFrame); }, style: { position: 'absolute', left: clip.startFrame * 8 * zoom, width, height: '100%', background: 'linear-gradient(135deg, rgba(37,99,235,0.35), rgba(56,189,248,0.15))', borderRadius: 10, display: 'flex', alignItems: 'center', padding: 8, cursor: 'grab', boxSizing: 'border-box' }, children: [asset?.thumbnailUrl ? _jsx("img", { src: `${API_BASE}${asset.thumbnailUrl}`, alt: asset.name, style: { width: 72, height: 48, objectFit: 'cover', borderRadius: 8, marginRight: 8 } }) : null, _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontSize: 12, fontWeight: 600 }, children: asset?.name || 'Clip' }), _jsxs("div", { style: { fontSize: 11, color: '#cbd5e1' }, children: [clip.durationFrames, "f"] })] }), _jsxs("div", { style: { display: 'flex', gap: 6, alignItems: 'center' }, children: [_jsx("button", { onClick: (event) => { event.stopPropagation(); splitClip(clip.id); }, style: { background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '4px 6px', borderRadius: 6, cursor: 'pointer' }, children: "Split" }), _jsx("button", { onClick: (event) => { event.stopPropagation(); removeClip(clip.id); }, style: { background: '#7f1d1d', border: 'none', color: 'white', padding: '4px 6px', borderRadius: 6, cursor: 'pointer' }, children: "Delete" })] })] }), _jsx("div", { style: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }, children: waveform.slice(0, 48).map((value, index) => _jsx("div", { style: { width: 2, height: `${Math.max(6, value * 34)}px`, background: 'rgba(148,163,184,0.45)', margin: '0 1px' } }, `${clip.id}-${index}`)) }), _jsx("div", { onMouseDown: (event) => startResize(event, clip.id), style: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 8, background: 'rgba(56,189,248,0.25)', cursor: 'ew-resize' } })] })] }, clip.id));
                                                }), draggedClipId ? _jsx("div", { style: { color: '#94a3b8', fontSize: 12, marginTop: 8 }, children: "Drop clip to reposition it." }) : null] })] })] }), _jsxs("aside", { style: { width: workspace.rightCollapsed ? 56 : 320, borderLeft: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15, 23, 42, 0.92)', padding: 12, overflow: 'auto', transition: 'width 0.2s ease' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, children: [_jsx("strong", { children: "Inspector" }), _jsx("button", { style: { background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }, onClick: () => setWorkspace((value) => ({ ...value, rightCollapsed: !value.rightCollapsed })), children: "\u2630" })] }), !workspace.rightCollapsed && (_jsxs(_Fragment, { children: [selectedAsset && (_jsxs("div", { style: { marginBottom: 10, padding: 10, background: '#111827', borderRadius: 12 }, children: [_jsx("div", { style: { fontSize: 12, color: '#94a3b8', marginBottom: 6 }, children: "Selected media" }), _jsx("div", { children: selectedAsset.name }), _jsxs("div", { style: { fontSize: 12, color: '#94a3b8', marginTop: 6 }, children: ["Duration: ", selectedAsset.analysis?.durationSeconds?.toFixed(1) || '—', "s"] }), _jsxs("div", { style: { fontSize: 12, color: '#94a3b8' }, children: ["Resolution: ", selectedAsset.analysis?.width || 0, " \u00D7 ", selectedAsset.analysis?.height || 0] }), _jsxs("div", { style: { fontSize: 12, color: '#94a3b8' }, children: ["Codec: ", selectedAsset.analysis?.codec || '—'] })] })), selectedClip && (_jsxs("div", { style: { padding: 10, background: '#111827', borderRadius: 12, marginBottom: 10 }, children: [_jsx("div", { style: { fontSize: 12, color: '#94a3b8', marginBottom: 8 }, children: "Clip controls" }), _jsxs("div", { style: { display: 'flex', gap: 6, marginBottom: 8 }, children: [_jsx("button", { onClick: () => updateClip(selectedClip.id, { startFrame: playhead }), style: { padding: '6px 8px', borderRadius: 8, background: '#2563eb', color: 'white', border: 'none' }, children: "Set start" }), _jsx("button", { onClick: () => splitClip(selectedClip.id), style: { padding: '6px 8px', borderRadius: 8, background: '#0f172a', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }, children: "Split" })] }), _jsxs("div", { style: { fontSize: 12, color: '#94a3b8' }, children: ["Frame range: ", selectedClip.startFrame, " \u2192 ", selectedClip.startFrame + selectedClip.durationFrames] })] })), _jsxs("div", { style: { padding: 10, background: '#111827', borderRadius: 12 }, children: [_jsx("div", { style: { fontSize: 12, color: '#94a3b8', marginBottom: 8 }, children: "AI Assistant" }), _jsx("div", { style: { color: '#cbd5e1', fontSize: 13 }, children: workspace.aiCollapsed ? 'Open the assistant to suggest edits, titles, and pacing.' : 'Assistant ready for prompts.' }), _jsx("button", { onClick: () => setWorkspace((value) => ({ ...value, aiCollapsed: !value.aiCollapsed })), style: { marginTop: 8, padding: '6px 8px', borderRadius: 8, background: '#0f172a', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }, children: workspace.aiCollapsed ? 'Expand' : 'Collapse' })] })] }))] })] }), _jsxs("footer", { style: { borderTop: '1px solid rgba(255,255,255,0.08)', padding: '10px 16px', background: 'rgba(17, 24, 39, 0.96)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("div", { style: { color: '#94a3b8', fontSize: 12 }, children: mediaStatus }), _jsx("div", { style: { color: '#94a3b8', fontSize: 12 }, children: error || 'Real media import and playback are active.' })] })] }) }));
}
