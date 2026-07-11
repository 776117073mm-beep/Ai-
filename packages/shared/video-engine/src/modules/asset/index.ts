export interface AssetMetadata {
  id: string;
  source: string;
  type: 'video' | 'audio' | 'image' | 'effect' | 'font' | 'other';
  proxyPath?: string;
  durationFrames?: number;
  width?: number;
  height?: number;
}

export interface MediaLibraryItem {
  id: string;
  path: string;
  metadata: AssetMetadata;
}

export class AssetManager {
  registerAsset(path: string, metadata: AssetMetadata): MediaLibraryItem {
    return {
      id: metadata.id,
      path,
      metadata
    };
  }
}

export class ImportManager {
  importAsset(path: string): AssetMetadata {
    return {
      id: `asset-${Date.now()}`,
      source: path,
      type: 'video'
    };
  }
}

export class ProxyManager {
  createProxy(assetId: string): string {
    return `${assetId}:proxy`;
  }
}

export class CacheManager {
  createCacheKey(assetId: string): string {
    return `cache:${assetId}`;
  }
}
