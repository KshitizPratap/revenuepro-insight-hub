import { Video, Image as ImageIcon, LayoutGrid, Link as LinkIcon, FileQuestion, Layers } from 'lucide-react';
import { getMediaTypeLabel, AdCardMedia } from '@/utils/adMediaUtils';

interface AdCardProps {
  ad: {
    adName?: string;
    fb_cost_per_lead?: number;
    fb_total_leads?: number;
    fb_spend?: number;
    fb_link_clicks?: number;
    fb_impressions?: number;
    fb_video_play_actions?: number; // Using this as proxy for 3-second video views (fb_video_views not available from API)
    fb_clicks?: number;
    fb_post_reactions?: number;
    fb_post_comments?: number;
    fb_post_shares?: number;
    costPerLead?: number | null;
    costPerEstimateSet?: number | null;
    numberOfLeads?: number;
    numberOfEstimateSets?: number;
    estimateSetRate?: number | null;
    creative?: {
      id: string;
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
    };
  };
  conversionScore?: number;
  hookScore?: number;
  onClick?: () => void;
}

const SimpleMetric = ({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) => (
  <div className="flex items-center justify-between py-0.5 gap-2 group relative">
    <span className="text-gray-600 text-sm">{label}</span>
    <span className="font-semibold text-gray-900 text-sm">{value}</span>
    {tooltip && (
      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10 shadow-lg">
        {tooltip}
        <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    )}
  </div>
);

const ScoreMetric = ({ label, score, tooltip }: { label: string; score: number; tooltip?: string }) => {
  const getColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-green-400';
    if (score >= 40) return 'bg-yellow-400';
    return 'bg-red-500';
  };

  const color = getColor(score);

  return (
    <div className="flex items-center justify-between py-0.5 gap-2 group relative">
      <span className="text-gray-600 text-sm whitespace-nowrap">{label}</span>
      <div className="flex items-center gap-2 flex-1 min-w-0 max-w-[40%]">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`${color} h-2 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
        <span className="font-semibold text-gray-900 text-sm w-auto text-right flex-shrink-0">{score.toFixed(2)}%</span>
      </div>
      {tooltip && (
        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-10 shadow-lg">
          {tooltip}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export function AdCard({ ad, conversionScore, hookScore, onClick }: AdCardProps) {
  const creative = ad.creative;

  // Get media type info using new helper
  const typeInfo = getMediaTypeLabel(creative);

  // Format currency
  const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return `$${value.toFixed(2)}`;
  };

  // Format percentage
  const formatPercentage = (value?: number | null) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  // Calculate Conversion Rate: facebook leads / link clicks
  const conversionRate = ad.fb_total_leads && ad.fb_link_clicks && ad.fb_link_clicks > 0
    ? ((ad.fb_total_leads / ad.fb_link_clicks) * 100)
    : null;

  // Calculate Thumbstop Rate: 3-second video plays / impressions
  // NOTE: Using fb_video_play_actions as proxy since fb_video_views (3-sec threshold) is not available from API
  const thumbstopRate = ad.fb_video_play_actions && ad.fb_impressions && ad.fb_impressions > 0
    ? ((ad.fb_video_play_actions / ad.fb_impressions) * 100)
    : null;

  // Calculate See More Rate: (Clicks (all) - Link Clicks - Post Reactions - Post Comments - Post Shares) / Impressions
  const seeMoreClicks = (ad.fb_clicks || 0) - (ad.fb_link_clicks || 0) - (ad.fb_post_reactions || 0) - (ad.fb_post_comments || 0) - (ad.fb_post_shares || 0);
  const seeMoreRate = ad.fb_impressions && ad.fb_impressions > 0
    ? ((seeMoreClicks / ad.fb_impressions) * 100)
    : null;

  return (
    <div
      className="w-full bg-white border border-slate-200 rounded-lg shadow-lg hover:shadow-2xl hover:border-primary/10 transition-all duration-300 cursor-pointer hover:bg-gray-50 hover:scale-105"
      onClick={onClick}
    >
      {/* Media */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        <AdCardMedia creative={creative} adName={ad.adName} />

        <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[13px] px-2 py-1 rounded-md flex items-center gap-1">
          <typeInfo.icon className="w-4 h-4" />
          {typeInfo.label}
        </span>
      </div>

      {/* Content */}
      <div className="px-4 py-2.5 flex flex-col">
        {/* Title */}
        <h4 className="text-lg font-semibold text-gray-900 leading-tight mb-2 line-clamp-2">
          {ad.adName || 'Untitled Ad'}
        </h4>

        {/* Metrics */}
        <div className="space-y-0.5 text-sm">
          <ScoreMetric
            label="Conversion Rate"
            score={conversionRate ?? 0}
            tooltip="Formula: Facebook Leads / Link Clicks"
          />
          <ScoreMetric
            label="Thumbstop Rate"
            score={thumbstopRate ?? 0}
            tooltip="Formula: 3-Second Video Plays / Impressions"
          />
          <ScoreMetric
            label="See More Rate"
            score={seeMoreRate ?? 0}
            tooltip="Formula: (Clicks (all) - Link Clicks - Post Reactions - Post Comments - Post Shares) / Impressions"
          />
          <SimpleMetric
            label="Cost Per Lead"
            value={formatCurrency(ad.costPerLead)}
            tooltip="Total cost divided by number of leads"
          />
          <SimpleMetric
            label="Cost Per Estimate Set"
            value={formatCurrency(ad.costPerEstimateSet)}
            tooltip="Total cost divided by number of estimate sets"
          />
          <ScoreMetric
            label="Estimate Set Rate"
            score={ad.estimateSetRate ?? 0}
            tooltip="Percentage of leads that set estimates"
          />
        </div>
      </div>
    </div>
  );
}

