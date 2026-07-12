import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import type { MediaAdapter, RenderAdapter } from './index';
import type { MediaAnalysis } from '../../engine/VideoEditingEngineService';

function runCommand(command: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || `Command failed: ${command} ${args.join(' ')}`));
    });
  });
}

function parseFps(rate: string | undefined): number {
  if (!rate) return 30;
  const [num, den] = String(rate).split('/').map(Number);
  if (!den || !num) return 30;
  return num / den;
}

export class FFmpegAdapter implements MediaAdapter, RenderAdapter {
  readonly name = 'ffmpeg';
  readonly version = '1.0.0';

  async initialize(): Promise<void> {}
  async dispose(): Promise<void> {}

  async importAsset(source: string): Promise<string> {
    return source;
  }

  async analyzeMedia(source: string, originalName: string): Promise<MediaAnalysis> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-creative-'));
    const thumbnailPath = path.join(tempDir, `${path.basename(originalName, path.extname(originalName))}.png`);
    const proxyPath = path.join(tempDir, `${path.basename(originalName, path.extname(originalName))}-proxy.mp4`);
    const waveformPath = path.join(tempDir, `${path.basename(originalName, path.extname(originalName))}.json`);

    try {
      const probe = await runCommand('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', source]);
      const parsed = JSON.parse(probe.stdout);
      const videoStream = parsed.streams.find((stream: any) => stream.codec_type === 'video') || {};
      const audioStream = parsed.streams.find((stream: any) => stream.codec_type === 'audio') || {};
      const duration = Number(parsed.format?.duration || 0);

      await this.generateThumbnail(source, thumbnailPath);
      await this.generateProxy(source, proxyPath);
      await this.generateWaveform(source, waveformPath);

      return {
        source,
        durationSeconds: duration || 1,
        width: Number(videoStream.width || 1280),
        height: Number(videoStream.height || 720),
        fps: parseFps(videoStream.avg_frame_rate || '30/1'),
        audioChannels: Number(audioStream.channels || 0),
        audioSampleRate: Number(audioStream.sample_rate || 0),
        thumbnailPath,
        proxyPath,
        waveformPath,
        codec: videoStream.codec_name || 'unknown'
      };
    } catch {
      await this.generateThumbnail(source, thumbnailPath);
      await this.generateProxy(source, proxyPath);
      await this.generateWaveform(source, waveformPath);

      return {
        source,
        durationSeconds: 1,
        width: 1280,
        height: 720,
        fps: 30,
        audioChannels: 0,
        audioSampleRate: 0,
        thumbnailPath,
        proxyPath,
        waveformPath,
        codec: 'fallback'
      };
    }
  }

  async generateThumbnail(source: string, outputPath: string): Promise<string> {
    try {
      await runCommand('ffmpeg', ['-y', '-i', source, '-ss', '1', '-frames:v', '1', '-vf', 'scale=320:-1', outputPath]);
      return outputPath;
    } catch {
      await fs.writeFile(outputPath, '');
      return outputPath;
    }
  }

  async generateWaveform(source: string, outputPath: string): Promise<string> {
    try {
      const raw = await runCommand('ffmpeg', ['-y', '-i', source, '-vn', '-ac', '1', '-ar', '16000', '-f', 's16le', '-']);
      const buffer = Buffer.from(raw.stdout, 'binary');
      const samples: number[] = [];
      for (let i = 0; i < buffer.length - 1; i += 2) {
        const sample = buffer.readInt16LE(i);
        samples.push(Math.abs(sample) / 32768);
      }
      const reduced: number[] = [];
      const bucketSize = Math.max(1, Math.floor(samples.length / 96));
      for (let index = 0; index < samples.length; index += bucketSize) {
        const chunk = samples.slice(index, index + bucketSize);
        const average = chunk.reduce((sum, value) => sum + value, 0) / Math.max(1, chunk.length);
        reduced.push(Number(average.toFixed(4)));
      }
      await fs.writeFile(outputPath, JSON.stringify(reduced.slice(0, 96)));
      return outputPath;
    } catch {
      await fs.writeFile(outputPath, JSON.stringify(Array.from({ length: 24 }, (_, index) => (Math.sin(index / 4) + 1) / 2)));
      return outputPath;
    }
  }

  async generateProxy(source: string, outputPath: string): Promise<string> {
    try {
      await runCommand('ffmpeg', ['-y', '-i', source, '-vf', 'scale=640:-1', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-c:a', 'aac', '-b:a', '128k', outputPath]);
      return outputPath;
    } catch {
      await fs.copyFile(source, outputPath);
      return outputPath;
    }
  }

  async prepareExport(outputPath: string, frameCount: number): Promise<string> {
    return `${outputPath}:${frameCount}`;
  }

  async enqueueRender(projectId: string): Promise<string> {
    return projectId;
  }
}
