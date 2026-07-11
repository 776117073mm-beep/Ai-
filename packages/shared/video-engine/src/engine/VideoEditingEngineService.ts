import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ProjectManager, type ProjectDocument } from '../modules/project';
import { DefaultVideoCommandBus, ImportMediaCommand } from '../modules/commands';
import { DefaultVideoEventBus } from '../modules/events';
import { FFmpegAdapter, MLTAdapter, OpenTimelineIOAdapter, OpenFXAdapter, type MediaAdapter, type TimelineAdapter, type RenderAdapter, type PlaybackAdapter } from '../modules/adapters';
import { TimelineEngine, type TimelineState, type TimelineSequence } from '../modules/timeline';
import { PlaybackEngine, type PlaybackState } from '../modules/playback';
import { RenderQueue, type RenderJob } from '../modules/render';
import { AssetManager, type AssetMetadata, type MediaLibraryItem, ProxyManager, CacheManager, ImportManager } from '../modules/asset';
import { WorkspaceManager, type WorkspaceState } from '../modules/ui';
import { SelectionManager, type SelectionState } from '../modules/selection';
import { MetadataManager, type MetadataState } from '../modules/metadata';
import { PluginManager, type PluginDefinition } from '../modules/plugin';
import { HistoryManager } from '../modules/history';
import { UndoRedoManager } from '../modules/undo';
import { ClipEngine, type ClipNode } from '../modules/timeline/clip';

export interface MediaAnalysis {
  source: string;
  durationSeconds: number;
  width: number;
  height: number;
  fps: number;
  audioChannels: number;
  audioSampleRate: number;
  thumbnailPath?: string;
  proxyPath?: string;
  waveformPath?: string;
  codec?: string;
}

export interface EngineRuntimeProject {
  project: ProjectDocument;
  timeline: TimelineState;
  playback: PlaybackState;
  assets: MediaLibraryItem[];
  clips: ClipNode[];
  workspace: WorkspaceState;
  selection: SelectionState;
  metadata: MetadataState;
  renderJobs: RenderJob[];
  playhead: number;
  zoom: number;
  commandBus: DefaultVideoCommandBus;
  eventBus: DefaultVideoEventBus;
  history: HistoryManager;
  undoRedo: UndoRedoManager;
  sequence: TimelineSequence;
}

export class VideoEditingEngineService {
  private readonly projectManager = new ProjectManager();
  private readonly timelineEngine = new TimelineEngine();
  private readonly playbackEngine = new PlaybackEngine();
  private readonly renderQueue = new RenderQueue();
  private readonly assetManager = new AssetManager();
  private readonly importManager = new ImportManager();
  private readonly proxyManager = new ProxyManager();
  private readonly cacheManager = new CacheManager();
  private readonly workspaceManager = new WorkspaceManager();
  private readonly selectionManager = new SelectionManager();
  private readonly metadataManager = new MetadataManager();
  private readonly pluginManager = new PluginManager();
  private readonly historyManager = new HistoryManager();
  private readonly undoRedoManager = new UndoRedoManager();
  private readonly clipEngine = new ClipEngine();

  private readonly ffmpegAdapter: MediaAdapter & RenderAdapter;
  private readonly mltAdapter: TimelineAdapter & PlaybackAdapter;
  private readonly otiAdapter: TimelineAdapter;
  private readonly openfxAdapter: { getEffects(): PluginDefinition[] };

  private readonly projects = new Map<string, EngineRuntimeProject>();

  constructor(options?: {
    ffmpegAdapter?: MediaAdapter & RenderAdapter;
    mltAdapter?: TimelineAdapter & PlaybackAdapter;
    otiAdapter?: TimelineAdapter;
    openfxAdapter?: { getEffects(): PluginDefinition[] };
  }) {
    this.ffmpegAdapter = options?.ffmpegAdapter ?? (new FFmpegAdapter() as MediaAdapter & RenderAdapter);
    this.mltAdapter = options?.mltAdapter ?? (new MLTAdapter() as TimelineAdapter & PlaybackAdapter);
    this.otiAdapter = options?.otiAdapter ?? new OpenTimelineIOAdapter();
    this.openfxAdapter = options?.openfxAdapter ?? new OpenFXAdapter();
  }

  async createProject(name: string): Promise<EngineRuntimeProject> {
    const project = this.projectManager.createProject(name);
    const timeline = this.timelineEngine.createState(project.metadata.id);
    const playback = this.playbackEngine.createState();
    const workspace = this.workspaceManager.createWorkspace();
    const selection = this.selectionManager.createSelection();
    const metadata = this.metadataManager.createState();
    const sequence = this.timelineEngine.createSequence(`${name} Sequence`);
    timeline.sequences.push(sequence);

    const runtime: EngineRuntimeProject = {
      project,
      timeline,
      playback,
      assets: [],
      clips: [],
      workspace,
      selection,
      metadata,
      renderJobs: [],
      playhead: 0,
      zoom: 1,
      commandBus: new DefaultVideoCommandBus(),
      eventBus: new DefaultVideoEventBus(),
      history: this.historyManager,
      undoRedo: this.undoRedoManager,
      sequence
    };

    this.projects.set(project.metadata.id, runtime);
    await this.mltAdapter.createTimeline(project.metadata.id);
    await this.otiAdapter.createTimeline(project.metadata.id);
    return runtime;
  }

  async importMedia(projectId: string, sourcePath: string, originalName: string): Promise<{ project: EngineRuntimeProject; asset: MediaLibraryItem; analysis: MediaAnalysis; clip: ClipNode }> {
    const runtime = this.requireProject(projectId);
    const analysis = await (this.ffmpegAdapter as FFmpegAdapter).analyzeMedia(sourcePath, originalName);
    const metadata: AssetMetadata = {
      id: `asset-${Date.now()}`,
      source: sourcePath,
      type: 'video',
      proxyPath: analysis.proxyPath,
      durationFrames: Math.round(analysis.durationSeconds * analysis.fps),
      width: analysis.width,
      height: analysis.height
    };

    const asset = this.assetManager.registerAsset(sourcePath, metadata);
    const clip = this.addClip(projectId, asset.id, 'track-video-1');
    runtime.project.media.push(asset.id);
    runtime.assets.push(asset);
    runtime.metadata.entries.push({ key: 'importedMedia', value: originalName });

    const command = new ImportMediaCommand(asset.id, projectId);
    await runtime.commandBus.execute(command);
    return { project: runtime, asset, analysis, clip };
  }

  addClip(projectId: string, assetId: string, trackId: string): ClipNode {
    const runtime = this.requireProject(projectId);
    const clip = this.clipEngine.createClip(assetId, trackId);
    runtime.clips.push(clip);
    return clip;
  }

  trimClip(projectId: string, clipId: string, start: number, end: number): ClipNode {
    const runtime = this.requireProject(projectId);
    const clip = runtime.clips.find((entry) => entry.id === clipId);
    if (!clip) throw new Error(`Clip ${clipId} not found.`);
    clip.inPoint = start;
    clip.outPoint = end;
    return clip;
  }

  splitClip(projectId: string, clipId: string, frame: number): ClipNode[] {
    const runtime = this.requireProject(projectId);
    const clip = runtime.clips.find((entry) => entry.id === clipId);
    if (!clip) throw new Error(`Clip ${clipId} not found.`);
    const left = { ...clip, id: `${clip.id}-left`, outPoint: frame };
    const right = { ...clip, id: `${clip.id}-right`, inPoint: frame };
    runtime.clips = runtime.clips.filter((entry) => entry.id !== clipId);
    runtime.clips.push(left, right);
    return [left, right];
  }

  moveClip(projectId: string, clipId: string, trackId: string, frame: number): ClipNode {
    const runtime = this.requireProject(projectId);
    const clip = runtime.clips.find((entry) => entry.id === clipId);
    if (!clip) throw new Error(`Clip ${clipId} not found.`);
    clip.trackId = trackId;
    clip.inPoint = frame;
    return clip;
  }

  removeClip(projectId: string, clipId: string): void {
    const runtime = this.requireProject(projectId);
    runtime.clips = runtime.clips.filter((entry) => entry.id !== clipId);
  }

  setPlayhead(projectId: string, frame: number): number {
    const runtime = this.requireProject(projectId);
    runtime.playhead = frame;
    return runtime.playhead;
  }

  play(projectId: string): PlaybackState {
    const runtime = this.requireProject(projectId);
    runtime.playback.isPlaying = true;
    return runtime.playback;
  }

  pause(projectId: string): PlaybackState {
    const runtime = this.requireProject(projectId);
    runtime.playback.isPlaying = false;
    return runtime.playback;
  }

  seek(projectId: string, frame: number): PlaybackState {
    const runtime = this.requireProject(projectId);
    runtime.playback.currentFrame = frame;
    runtime.playhead = frame;
    return runtime.playback;
  }

  stepFrame(projectId: string, direction: 'forward' | 'backward'): PlaybackState {
    const runtime = this.requireProject(projectId);
    const delta = direction === 'forward' ? runtime.playback.frameStep : -runtime.playback.frameStep;
    runtime.playback.currentFrame += delta;
    runtime.playhead = runtime.playback.currentFrame;
    return runtime.playback;
  }

  setZoom(projectId: string, zoom: number): number {
    const runtime = this.requireProject(projectId);
    runtime.zoom = zoom;
    return runtime.zoom;
  }

  async exportProject(projectId: string, outputName: string): Promise<RenderJob> {
    const runtime = this.requireProject(projectId);
    const job = this.renderQueue.createJob(projectId);
    const outputPath = path.join(os.tmpdir(), `${outputName || 'export'}.mp4`);
    await (this.ffmpegAdapter as FFmpegAdapter).prepareExport(outputPath, runtime.playback.currentFrame);
    runtime.renderJobs.push(job);
    return job;
  }

  getProject(projectId: string): EngineRuntimeProject {
    return this.requireProject(projectId);
  }

  private requireProject(projectId: string): EngineRuntimeProject {
    const runtime = this.projects.get(projectId);
    if (!runtime) throw new Error(`Project ${projectId} not found.`);
    return runtime;
  }
}

export { DefaultVideoEventBus } from '../modules/events';
