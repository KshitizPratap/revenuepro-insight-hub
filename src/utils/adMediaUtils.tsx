import { Image as ImageIcon, Video, LayoutGrid } from 'lucide-react';
import React from 'react';

export interface Creative {
  id?: string;
  name?: string;
  mediaType?: 'IMAGE' | 'VIDEO' | 'MIXED';
  creativeMode?: 'STATIC' | 'STATIC_CAROUSEL' | 'DYNAMIC_ASSET_FEED' | 'DYNAMIC_CATALOG';
  thumbnailUrl?: string;
  imageHashes?: string[];
  imageUrls?: string[];
  videoIds?: string[];
  videoUrls?: string[];
  previewIframe?: string[];
  primary_text?: string;
  headline?: string;
  description?: string;
  body?: string;
  childAttachments?: Array<{
    name?: string;
    description?: string;
    imageUrl?: string;
    imageHash?: string;
    link?: string;
    videoId?: string;
  }>;
  callToAction?: {
    type?: string;
    value?: any;
  };
  objectStorySpec?: {
    page_id?: string;
    link_data?: {
      link?: string;
      message?: string;
      name?: string;
      image_hash?: string;
    };
  };
}

export interface MediaTypeInfo {
  icon: typeof ImageIcon;
  label: string;
  color?: string;
}

export interface AdModalMediaConfig {
  type: 'image' | 'video' | 'iframe' | 'none';
  urls?: string[];
  iframeHtml?: string;
  iframeSrc?: string;
  iframeWidth?: string;
  iframeHeight?: string;
}

export function getMediaTypeLabel(creative?: Creative | null): MediaTypeInfo {
  if (!creative) {
    return { icon: ImageIcon, label: 'No Creative', color: 'bg-gray-500' };
  }

  if (creative.mediaType) {
    switch (creative.mediaType) {
      case 'IMAGE':
        return { icon: ImageIcon, label: 'Image', color: 'bg-orange-500' };
      case 'VIDEO':
        return { icon: Video, label: 'Video', color: 'bg-blue-500' };
      case 'MIXED':
        return { icon: LayoutGrid, label: 'Mixed', color: 'bg-purple-500' };
      default:
        return { icon: ImageIcon, label: 'Other', color: 'bg-gray-500' };
    }
  }

  return { icon: ImageIcon, label: 'No Creative', color: 'bg-gray-500' };
}

export function getAdCardImageUrl(creative?: Creative | null): string | null {
  if (!creative) return null;

  if (creative.imageUrls && creative.imageUrls.length > 0) {
    return creative.imageUrls[0];
  }

  return creative.thumbnailUrl || null;
}

export function getAdModalMedia(creative?: Creative | null): AdModalMediaConfig {
  if (!creative) {
    return { type: 'none' };
  }

  const mediaType = creative.mediaType;

  if (mediaType === 'IMAGE') {
    if (creative.imageUrls && creative.imageUrls.length > 0) {
      return { type: 'image', urls: creative.imageUrls };
    }
    if (creative.previewIframe && creative.previewIframe.length > 0) {
      const iframeData = extractIframeData(creative.previewIframe[0]);
      return {
        type: 'iframe',
        iframeHtml: creative.previewIframe[0],
        iframeSrc: iframeData.src,
        iframeWidth: iframeData.width,
        iframeHeight: iframeData.height,
      };
    }
    return { type: 'none' };
  }

  if (mediaType === 'VIDEO') {
    if (creative.videoUrls && creative.videoUrls.length > 0) {
      return { type: 'video', urls: creative.videoUrls };
    }
    if (creative.previewIframe && creative.previewIframe.length > 0) {
      const iframeData = extractIframeData(creative.previewIframe[0]);
      return {
        type: 'iframe',
        iframeHtml: creative.previewIframe[0],
        iframeSrc: iframeData.src,
        iframeWidth: iframeData.width,
        iframeHeight: iframeData.height,
      };
    }
    return { type: 'none' };
  }

  if (mediaType === 'MIXED') {
    const hasImages = creative.imageUrls && creative.imageUrls.length > 0;
    const hasVideos = creative.videoUrls && creative.videoUrls.length > 0;

    if (hasImages && hasVideos) {
      return { type: 'image', urls: creative.imageUrls };
    }
    if (hasImages) {
      return { type: 'image', urls: creative.imageUrls };
    }
    if (hasVideos) {
      return { type: 'video', urls: creative.videoUrls };
    }
  }

  if (creative.previewIframe && creative.previewIframe.length > 0) {
    const iframeData = extractIframeData(creative.previewIframe[0]);
    return {
      type: 'iframe',
      iframeHtml: creative.previewIframe[0],
      iframeSrc: iframeData.src,
      iframeWidth: iframeData.width,
      iframeHeight: iframeData.height,
    };
  }

  if (creative.thumbnailUrl) {
    return { type: 'image', urls: [creative.thumbnailUrl] };
  }

  return { type: 'none' };
}

function decodeHtmlEntities(html: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = html;
  return textarea.value;
}

function extractIframeData(iframeHtml: string): { src?: string; width?: string; height?: string } {
  try {
    const decodedHtml = decodeHtmlEntities(iframeHtml);
    const srcMatch = decodedHtml.match(/src=["']([^"']+)["']/);
    const widthMatch = decodedHtml.match(/width=["']?(\d+)["']?/);
    const heightMatch = decodedHtml.match(/height=["']?(\d+)["']?/);

    const src = srcMatch ? decodeURIComponent(srcMatch[1]) : undefined;
    const width = widthMatch ? widthMatch[1] : undefined;
    const height = heightMatch ? heightMatch[1] : undefined;

    return { src, width, height };
  } catch (error) {
    return {};
  }
}

export function renderPreviewIframe(iframeHtml: string): {
  src?: string;
  width?: string;
  height?: string;
  dangerouslySetInnerHTML?: { __html: string };
} | null {
  if (!iframeHtml) return null;

  try {
    const decodedHtml = decodeHtmlEntities(iframeHtml);
    const iframeData = extractIframeData(decodedHtml);

    if (iframeData.src) {
      return {
        src: iframeData.src,
        width: iframeData.width || '100%',
        height: iframeData.height || '400',
      };
    }

    return {
      dangerouslySetInnerHTML: { __html: decodedHtml },
    };
  } catch (error) {
    try {
      const decodedHtml = decodeHtmlEntities(iframeHtml);
      return {
        dangerouslySetInnerHTML: { __html: decodedHtml },
      };
    } catch (decodeError) {
      return {
        dangerouslySetInnerHTML: { __html: iframeHtml },
      };
    }
  }
}

export function renderSingleImage(
  url: string,
  alt: string = 'Ad creative',
  className: string = 'w-full object-cover'
): React.ReactElement {
  return (
    <div className="w-full bg-slate-100">
      <img
        src={url}
        alt={alt}
        className={className}
        loading="eager"
        crossOrigin="anonymous"
        onError={(e) => {
          console.error('[renderSingleImage] Image failed to load:', url);
        }}
      />
    </div>
  );
}

export function renderImageGrid(
  urls: string[],
  alt: string = 'Ad creative',
  maxImages: number = 4,
  gridCols: number = 2
): React.ReactElement {
  const gridClass = gridCols === 2 ? 'grid-cols-2' : gridCols === 3 ? 'grid-cols-3' : 'grid-cols-4';
  
  return (
    <div className="w-full bg-slate-100">
      <div className={`grid ${gridClass} gap-1`}>
        {urls.slice(0, maxImages).map((url, idx) => (
          <img
            key={idx}
            src={url}
            alt={`${alt} - ${idx + 1}`}
            className="w-full object-cover aspect-square"
            loading="eager"
            crossOrigin="anonymous"
            onError={(e) => {
              console.error('[renderImageGrid] Image failed to load:', url);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function renderSingleVideo(
  url: string,
  className: string = 'w-full object-cover',
  showControls: boolean = true
): React.ReactElement {
  return (
    <div className="w-full bg-slate-100">
      <video
        src={url}
        className={className}
        controls={showControls}
        playsInline
        onError={(e) => {
          console.error('[renderSingleVideo] Video failed to load:', url);
        }}
      />
    </div>
  );
}

export function renderVideoStack(
  urls: string[],
  className: string = 'w-full object-cover',
  showControls: boolean = true
): React.ReactElement {
  return (
    <div className="w-full bg-slate-100">
      <div className="space-y-2">
        {urls.map((url, idx) => (
          <video
            key={idx}
            src={url}
            className={className}
            controls={showControls}
            playsInline
            muted
            crossOrigin="anonymous"
            onError={(e) => {
              console.error('[renderVideoStack] Video failed to load:', url);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function renderIframe(
  iframeHtml: string,
  className: string = 'w-full bg-slate-100 flex items-center justify-center'
): React.ReactElement | null {
  const iframeProps = renderPreviewIframe(iframeHtml);
  
  if (!iframeProps) {
    return (
      <div className="w-full aspect-video flex items-center justify-center bg-slate-100">
        <span className="text-sm text-slate-400">Unable to load preview</span>
      </div>
    );
  }

  if (iframeProps.src) {
    return (
      <div className={className}>
        <iframe
          src={iframeProps.src}
          width={iframeProps.width || '100%'}
          height={iframeProps.height || '400'}
          className="w-full border-0"
          style={{ minHeight: '400px' }}
          allow="autoplay; encrypted-media"
          allowFullScreen
          onError={() => {
            console.error('[renderIframe] Iframe failed to load:', iframeProps.src);
          }}
        />
      </div>
    );
  }

  if (iframeProps.dangerouslySetInnerHTML) {
    return (
      <div className={className}>
        <div
          dangerouslySetInnerHTML={iframeProps.dangerouslySetInnerHTML}
          className="w-full"
        />
      </div>
    );
  }

  return null;
}

export function renderEmptyMedia(message: string = 'No media content'): React.ReactElement {
  return (
    <div className="w-full aspect-video flex items-center justify-center bg-slate-100">
      <span className="text-sm text-slate-400">{message}</span>
    </div>
  );
}

export function renderAdModalMedia(
  mediaConfig: AdModalMediaConfig,
  adName?: string
): React.ReactElement | null {
  if (mediaConfig.type === 'image' && mediaConfig.urls && mediaConfig.urls.length > 0) {
    if (mediaConfig.urls.length === 1) {
      return renderSingleImage(mediaConfig.urls[0], adName || 'Ad creative');
    } else {
      return renderImageGrid(mediaConfig.urls, adName || 'Ad creative');
    }
  }

  if (mediaConfig.type === 'video' && mediaConfig.urls && mediaConfig.urls.length > 0) {
    if (mediaConfig.urls.length === 1) {
      return renderSingleVideo(mediaConfig.urls[0]);
    } else {
      return renderVideoStack(mediaConfig.urls);
    }
  }

  if (mediaConfig.type === 'iframe' && mediaConfig.iframeHtml) {
    return renderIframe(mediaConfig.iframeHtml);
  }

  return renderEmptyMedia();
}

interface AdCardMediaProps {
  creative: Creative | undefined | null;
  adName?: string;
}

export const AdCardMedia = React.memo(function AdCardMedia({ creative, adName }: AdCardMediaProps) {
  const isVideo = React.useMemo(() => creative?.mediaType === 'VIDEO', [creative?.mediaType]);
  const isDynamicVideo = React.useMemo(() => {
    return creative?.creativeMode === 'DYNAMIC_ASSET_FEED' && creative?.mediaType === 'VIDEO';
  }, [creative?.creativeMode, creative?.mediaType]);
  
  const imageUrl = React.useMemo(() => {
    if (!creative) return null;
    
    if (isDynamicVideo) {
      return null;
    }
    
    if (isVideo) {
      if (creative.imageUrls && creative.imageUrls.length > 0) {
        return creative.imageUrls[0];
      }
      return null;
    }
    
    return getAdCardImageUrl(creative);
  }, [creative, isVideo, isDynamicVideo]);

  const handleImageError = React.useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('[AdCardMedia] Image/Thumbnail failed to load:', imageUrl);
  }, [imageUrl]);

  if (!creative) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
        <div className="bg-gray-100 rounded-full p-4 mb-2">
          <ImageIcon className="w-12 h-12 text-gray-400" />
        </div>
        <span className="text-xs text-gray-400">No Media</span>
      </div>
    );
  }

  if (isDynamicVideo) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg p-6 shadow-md">
          <Video className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 text-center mb-2">Facebook Ad Preview</p>
          <p className="text-xs text-gray-500 text-center">Click to view ad preview</p>
        </div>
      </div>
    );
  }

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={adName || 'Ad creative'}
        className="w-full h-full object-cover"
        loading="eager"
        crossOrigin="anonymous"
        style={{ imageRendering: '-webkit-optimize-contrast' }}
        onError={handleImageError}
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
      <div className="bg-gray-100 rounded-full p-4 mb-2">
        <ImageIcon className="w-12 h-12 text-gray-400" />
      </div>
      <span className="text-xs text-gray-400">No Media</span>
    </div>
  );
}, (prevProps, nextProps) => {
  const prevCreative = prevProps.creative;
  const nextCreative = nextProps.creative;

  if (prevCreative?.id !== nextCreative?.id) return false;
  if (prevCreative?.mediaType !== nextCreative?.mediaType) return false;
  if (prevCreative?.creativeMode !== nextCreative?.creativeMode) return false;
  if (prevCreative?.imageUrls?.[0] !== nextCreative?.imageUrls?.[0]) return false;
  if (prevProps.adName !== nextProps.adName) return false;

  return true;
});

export function renderAdCardMedia(
  creative: Creative | undefined | null,
  adName?: string
): React.ReactElement {
  return <AdCardMedia creative={creative} adName={adName} />;
}
