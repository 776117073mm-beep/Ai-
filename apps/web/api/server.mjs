import http from 'node:http';
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const PORT = Number(process.env.PORT || 3100);
const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'apps/web/api/data');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

mkdirSync(PROJECTS_DIR, { recursive: true });
mkdirSync(UPLOADS_DIR, { recursive: true });

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(stderr || `Command failed: ${command} ${args.join(' ')}`));
      }
    });
  });
}

function parseFps(rate) {
  if (!rate) return 30;
  const [num, den] = String(rate).split('/').map(Number);
  if (!den || !num) return 30;
  return num / den;
}

async function analyzeMedia(filePath, originalName) {
  try {
    const probe = await runCommand('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', filePath]);
    const parsed = JSON.parse(probe.stdout);
    const videoStream = parsed.streams.find((stream) => stream.codec_type === 'video') || {};
    const audioStream = parsed.streams.find((stream) => stream.codec_type === 'audio') || {};
    const duration = Number(parsed.format?.duration || 0);
    const fps = parseFps(videoStream.avg_frame_rate || '30/1');
    return {
      source: filePath,
      originalName,
      durationSeconds: duration || 1,
      width: Number(videoStream.width || 1280),
      height: Number(videoStream.height || 720),
      fps,
      codec: videoStream.codec_name || 'unknown',
      audioChannels: Number(audioStream.channels || 0),
      audioSampleRate: Number(audioStream.sample_rate || 0),
      metadata: {
        formatName: parsed.format?.format_name || 'unknown',
        size: Number(parsed.format?.size || 0)
      }
    };
  } catch {
    const stats = await fs.stat(filePath);
    return {
      source: filePath,
      originalName,
      durationSeconds: 1,
      width: 1280,
      height: 720,
      fps: 30,
      codec: 'fallback',
      audioChannels: 0,
      audioSampleRate: 0,
      metadata: {
        formatName: 'fallback',
        size: stats.size
      }
    };
  }
}

async function generateThumbnail(inputPath, outputPath) {
  try {
    await runCommand('ffmpeg', ['-y', '-i', inputPath, '-ss', '1', '-frames:v', '1', '-vf', 'scale=320:-1', outputPath]);
    return outputPath;
  } catch {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
      <rect width="320" height="180" rx="24" fill="#0f172a" />
      <rect x="24" y="24" width="272" height="132" rx="16" fill="#111827" stroke="#38bdf8" stroke-width="2" />
      <circle cx="114" cy="90" r="28" fill="#2563eb" />
      <path d="M162 70h84v40h-84z" fill="#38bdf8" opacity="0.8" />
      <text x="24" y="156" font-family="Inter, Arial, sans-serif" font-size="18" fill="#f8fafc">Imported media</text>
    </svg>`;
    writeFileSync(outputPath, svg);
    return outputPath;
  }
}

export function buildWaveformSamples(buffer) {
  const samples = [];
  for (let i = 0; i < buffer.length - 1; i += 2) {
    const sample = buffer.readInt16LE(i);
    samples.push(Math.abs(sample) / 32768);
  }

  const reduced = [];
  const bucketSize = Math.max(1, Math.floor(samples.length / 96));
  for (let index = 0; index < samples.length; index += bucketSize) {
    const chunk = samples.slice(index, index + bucketSize);
    const average = chunk.reduce((sum, value) => sum + value, 0) / Math.max(1, chunk.length);
    reduced.push(Number(average.toFixed(4)));
  }

  return reduced.slice(0, 96);
}

async function generateWaveform(inputPath, outputPath) {
  try {
    const raw = await runCommand('ffmpeg', ['-y', '-i', inputPath, '-vn', '-ac', '1', '-ar', '16000', '-f', 's16le', '-']);
    const buffer = Buffer.from(raw.stdout, 'binary');
    const waveform = buildWaveformSamples(buffer);
    writeFileSync(outputPath, JSON.stringify(waveform));
    return outputPath;
  } catch {
    const fallback = Array.from({ length: 96 }, (_, index) => Number((Math.sin(index / 8) + 1) / 2).toFixed(4));
    writeFileSync(outputPath, JSON.stringify(fallback));
    return outputPath;
  }
}

async function generateProxy(inputPath, outputPath) {
  try {
    await runCommand('ffmpeg', ['-y', '-i', inputPath, '-vf', 'scale=640:-1', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-c:a', 'aac', '-b:a', '128k', outputPath]);
    return outputPath;
  } catch {
    await fs.copyFile(inputPath, outputPath);
    return outputPath;
  }
}

export function extractMultipartFileInfo(body, contentType, fallbackName) {
  let originalName = fallbackName;
  let fileBuffer = body;

  if (!contentType.includes('multipart/form-data')) {
    return { originalName, fileBuffer };
  }

  const boundary = contentType.split('boundary=')[1];
  if (!boundary) {
    return { originalName, fileBuffer };
  }

  const parts = body.toString('binary').split(`--${boundary}`);
  const filePart = parts.find((part) => part.includes('filename='));
  if (!filePart) {
    return { originalName, fileBuffer };
  }

  const fileHeader = filePart.split('\r\n\r\n')[0];
  const fileNameMatch = fileHeader.match(/filename="([^"]+)"/);
  const parsedFileName = fileNameMatch?.[1] || fallbackName;
  const rawFileBody = filePart.split('\r\n\r\n')[1] || '';
  const fileBody = rawFileBody.replace(/\r\n--.*$/s, '').replace(/\n--.*$/s, '').replace(/\r\n$/, '').replace(/\n$/, '');
  return {
    originalName: parsedFileName,
    fileBuffer: Buffer.from(fileBody || '', 'binary')
  };
}

function getProjectFile(projectId) {
  return path.join(PROJECTS_DIR, `${projectId}.json`);
}

async function readProject(projectId) {
  const file = getProjectFile(projectId);
  if (!existsSync(file)) return null;
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function writeProject(project) {
  const file = getProjectFile(project.id);
  await fs.writeFile(file, JSON.stringify(project, null, 2));
}

function createClipFromAsset(asset, analysis, startFrame = 0) {
  const durationFrames = Math.max(1, Math.round((analysis?.durationSeconds || 0) * (analysis?.fps || 30)));
  return {
    id: `clip-${Date.now()}`,
    assetId: asset.id,
    trackId: 'video-1',
    startFrame,
    durationFrames,
    trimIn: 0,
    trimOut: durationFrames
  };
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case '.json':
      return 'application/json';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.mp4':
    case '.m4v':
      return 'video/mp4';
    case '.webm':
      return 'video/webm';
    case '.mp3':
      return 'audio/mpeg';
    default:
      return 'application/octet-stream';
  }
}

function createServer() {
  const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, { ok: true, ffmpeg: 'ready' });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/projects') {
    const body = JSON.parse((await readBody(req)).toString() || '{}');
    const project = {
      id: `project-${Date.now()}`,
      name: body.name || 'Untitled Project',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assets: [],
      timeline: [],
      settings: {
        playhead: 0,
        zoom: 1,
        playbackRate: 1,
        workspace: {
          leftCollapsed: false,
          rightCollapsed: false,
          aiCollapsed: true
        }
      },
      workspace: {
        leftCollapsed: false,
        rightCollapsed: false,
        aiCollapsed: true
      }
    };
    await writeProject(project);
    sendJson(res, 201, project);
    return;
  }

  const projectMatch = url.pathname.match(/^\/api\/projects\/([^/]+)$/);
  if (req.method === 'GET' && projectMatch) {
    const project = await readProject(projectMatch[1]);
    if (!project) {
      sendJson(res, 404, { error: 'Project not found' });
      return;
    }
    sendJson(res, 200, project);
    return;
  }

  if (req.method === 'POST' && projectMatch && url.pathname.endsWith('/save')) {
    const body = JSON.parse((await readBody(req)).toString() || '{}');
    const project = { ...body, updatedAt: new Date().toISOString() };
    await writeProject(project);
    sendJson(res, 200, project);
    return;
  }

  const addClipMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/clips$/);
  if (req.method === 'POST' && addClipMatch) {
    const projectId = addClipMatch[1];
    const project = await readProject(projectId);
    if (!project) {
      sendJson(res, 404, { error: 'Project not found' });
      return;
    }
    const body = JSON.parse((await readBody(req)).toString() || '{}');
    const asset = project.assets.find((entry) => entry.id === body.assetId);
    if (!asset) {
      sendJson(res, 404, { error: 'Asset not found' });
      return;
    }
    const analysis = asset.analysis || {};
    const clip = createClipFromAsset(asset, analysis, Number(body.startFrame || 0));
    project.timeline.push(clip);
    project.updatedAt = new Date().toISOString();
    await writeProject(project);
    sendJson(res, 200, { clip, project });
    return;
  }

  const importMatch = url.pathname.match(/^\/api\/projects\/([^/]+)\/import$/);
  if (req.method === 'POST' && importMatch) {
    const projectId = importMatch[1];
    const project = await readProject(projectId);
    if (!project) {
      sendJson(res, 404, { error: 'Project not found' });
      return;
    }

    const contentType = req.headers['content-type'] || '';
    const body = await readBody(req);
    const fallbackName = (req.headers['x-file-name'] || req.headers['x-filename'] || 'import.mp4').toString();
    const { originalName, fileBuffer } = extractMultipartFileInfo(body, contentType, fallbackName);

    if (contentType.includes('multipart/form-data')) {
      console.log('[backend] received file via multipart', originalName, fileBuffer.length);
    } else {
      console.log('[backend] received file body', body.length);
    }

    const extension = path.extname(String(originalName));
    const fileName = `${Date.now()}${extension}`;
    const filePath = path.join(UPLOADS_DIR, fileName);
    await fs.writeFile(filePath, fileBuffer);

    try {
      const analysis = await analyzeMedia(filePath, String(originalName));
      const projectFolder = path.join(UPLOADS_DIR, projectId);
      mkdirSync(projectFolder, { recursive: true });
      const thumbnailPath = path.join(projectFolder, `${Date.now()}-thumb.svg`);
      const proxyPath = path.join(projectFolder, `${Date.now()}-proxy.mp4`);
      const waveformPath = path.join(projectFolder, `${Date.now()}-wave.json`);
      const thumbnail = await generateThumbnail(filePath, thumbnailPath);
      const proxy = await generateProxy(filePath, proxyPath);
      const waveform = await generateWaveform(filePath, waveformPath);

      const asset = {
        id: `asset-${Date.now()}`,
        name: String(originalName),
        path: filePath,
        thumbnailUrl: `/media/${projectId}/${path.basename(thumbnail)}`,
        proxyUrl: `/media/${projectId}/${path.basename(proxy)}`,
        waveformUrl: `/media/${projectId}/${path.basename(waveform)}`,
        analysis: {
          ...analysis,
          thumbnailPath: thumbnail,
          proxyPath: proxy,
          waveformPath: waveform
        }
      };

      const clip = createClipFromAsset(asset, analysis, 0);

      project.assets.push(asset);
      project.timeline.push(clip);
      project.updatedAt = new Date().toISOString();
      await writeProject(project);

      console.log('[backend] generated asset', asset.id, asset.name, asset.thumbnailUrl, asset.proxyUrl);
      sendJson(res, 200, { asset, clip, analysis, project });
      return;
    } catch (error) {
      console.error('[backend] import failed', error);
      sendJson(res, 500, { error: error.message || 'Import failed' });
      return;
    }
  }

  const mediaMatch = url.pathname.match(/^\/media\/([^/]+)\/(.+)$/);
  if (req.method === 'GET' && mediaMatch) {
    const mediaPath = path.join(UPLOADS_DIR, mediaMatch[1], mediaMatch[2]);
    if (!existsSync(mediaPath)) {
      sendJson(res, 404, { error: 'Media not found' });
      return;
    }
    res.writeHead(200, { 'Content-Type': getContentType(mediaPath), 'Access-Control-Allow-Origin': '*' });
    createReadStream(mediaPath).pipe(res);
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
  });
  return server;
}

export function startServer() {
  const server = createServer();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Video editor API listening on http://127.0.0.1:${PORT}`);
  });
  return server;
}

if (isMainModule) {
  startServer();
}

export { createServer };
