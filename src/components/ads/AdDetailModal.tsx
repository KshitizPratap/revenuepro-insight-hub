import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Loader2, CalendarIcon } from 'lucide-react';
import { useState, useMemo } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { fetchAdPerformanceBoard } from '@/service/adPerformanceBoardService';
import { useUserContext } from '@/utils/UserContext';
import { useUserStore } from '@/stores/userStore';
import { format } from 'date-fns';
import { getMediaTypeLabel, getAdModalMedia, renderAdModalMedia } from '@/utils/adMediaUtils';

interface AdDetailModalProps {
  open: boolean;
  onClose: () => void;
  ad: {
    adName?: string;
    campaignName?: string;
    adSetName?: string;
    fb_cost_per_lead?: number;
    fb_total_leads?: number;
    fb_spend?: number;
    costPerLead?: number | null;
    numberOfLeads?: number;
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
    };
    fb_impressions?: number;
    fb_clicks?: number;
    fb_ctr?: number;
    fb_cpc?: number;
    fb_cpm?: number;
    fb_link_clicks?: number;
    fb_video_views?: number;
    fb_post_reactions?: number;
    fb_post_comments?: number;
    fb_post_shares?: number;
    fb_frequency?: number;
    fb_reach?: number;
    fb_video_continuous_2_sec_watched?: number;
    optimizationGoal?: string;
    revenue?: number;
    costPerEstimateSet?: number | null;
    numberOfEstimateSets?: number;
    costOfMarketingPercent?: number | null;
    averageJobSize?: number | null;
    conversion_rate?: number | null;
    thumbstop_rate?: number | null;
    see_more_rate?: number | null;
    holdRate?: number | null;
    costPerLinkClick?: number | null;
    resultRate?: number | null;
    fb_post_saves?: number;
  };
  conversionScore?: number;
  hookScore?: number;
  leadsConversionRate?: number;
  startDate?: string;
  endDate?: string;
  clientId?: string;
  optimizationGoal?: string;
}

export function AdDetailModal({ open, onClose, ad, startDate, endDate, clientId: clientIdProp }: AdDetailModalProps) {
  const creative = ad.creative;
  const { user } = useUserContext();
  const { selectedUserId } = useUserStore();

  const clientId = clientIdProp || selectedUserId || (user as any)?._id;

  const [isPerformanceOpen, setIsPerformanceOpen] = useState(true);
  const [isEfficiencyOpen, setIsEfficiencyOpen] = useState(true);
  const [isInteractionsOpen, setIsInteractionsOpen] = useState(false);

  const [modalStartDate, setModalStartDate] = useState<string>(startDate || '');
  const [modalEndDate, setModalEndDate] = useState<string>(endDate || '');
  const [customStart, setCustomStart] = useState<Date>(startDate ? new Date(startDate) : new Date());
  const [customEnd, setCustomEnd] = useState<Date>(endDate ? new Date(endDate) : new Date());
  const [startMonth, setStartMonth] = useState<Date>(startDate ? new Date(startDate) : new Date());
  const [endMonth, setEndMonth] = useState<Date>(endDate ? new Date(endDate) : new Date());
  const [openPicker, setOpenPicker] = useState(false);
  const currentYear = new Date().getFullYear();

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      setCustomStart(date);
      setStartMonth(date);
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      const today = new Date();
      const selected = date > today ? today : date;
      setCustomEnd(selected);
      setEndMonth(selected);
    }
  };

  const formatCustomRangeLabel = (start: Date, end: Date): string => {
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    if (startYear === endYear) {
      return `${format(start, "MMM dd")} - ${format(end, "MMM dd, yyyy")}`;
    } else {
      return `${format(start, "MMM dd, yyyy")} - ${format(end, "MMM dd, yyyy")}`;
    }
  };

  const { data: modalAdData, isLoading: isLoadingModalData } = useQuery({
    queryKey: ['ad-detail-modal', ad.adName, modalStartDate, modalEndDate, clientId],
    queryFn: async () => {
      if (!modalStartDate || !modalEndDate || !clientId) {
        return null;
      }

      const response = await fetchAdPerformanceBoard({
        clientId,
        groupBy: 'ad',
        filters: {
          startDate: modalStartDate,
          endDate: modalEndDate,
          adName: ad.adName,
        },
        columns: {
          adName: true,
          campaignName: true,
          adSetName: true,
          revenue: true,
          costPerEstimateSet: true,
          numberOfEstimateSets: true,
          costOfMarketingPercent: true,
          averageJobSize: true,
          costPerLead: true,
          numberOfLeads: true,
          conversion_rate: true,
          thumbstop_rate: true,
          see_more_rate: true,
          holdRate: true,
          costPerLinkClick: true,
          fb_cpm: true,
          resultRate: true,
          fb_frequency: true,
          fb_post_comments: true,
          fb_post_reactions: true,
          fb_post_shares: true,
          fb_post_saves: true,
          fb_spend: true,
          fb_impressions: true,
          fb_clicks: true,
          fb_ctr: true,
          fb_cpc: true,
          fb_reach: true,
          fb_link_clicks: true,
          fb_video_views: true,
          fb_video_continuous_2_sec_watched: true,
          fb_cost_per_lead: true,
          fb_total_leads: true,
          optimizationGoal: true,
        },
      });

      if (response.error) {
        return null;
      }

      if (!response.data || response.data.length === 0) {
        return null;
      }

      return response.data[0];
    },
    enabled: Boolean(modalStartDate && modalEndDate && clientId && open),
    staleTime: 60 * 1000,
  });

  const displayAd = useMemo(() => modalAdData || ad, [modalAdData, ad]);

  const effectiveCreative = useMemo(() => {
    return (modalAdData as any)?.data?.[0]?.creative || creative;
  }, [modalAdData, creative]);

  const typeInfo = useMemo(() => getMediaTypeLabel(effectiveCreative), [effectiveCreative]);
  const CreativeIcon = typeInfo.icon;

  const mediaConfig = useMemo(() => getAdModalMedia(effectiveCreative), [effectiveCreative]);

  const formatCurrency = (value?: number | null | string) => {
    if (value === null || value === undefined) return '—';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue);
  };

  const formatNumber = (value?: number | null | string) => {
    if (value === null || value === undefined) return '—';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '—';
    return numValue.toLocaleString();
  };

  const formatPercent = (value?: number | null | string) => {
    if (value === null || value === undefined) return '—';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '—';
    return `${numValue.toFixed(2)}%`;
  };

  interface AdPreviewProps {
    creative: typeof ad.creative;
    mediaConfig: ReturnType<typeof getAdModalMedia>;
    adName?: string;
  }

  const AdPreview =({ creative, mediaConfig, adName }: AdPreviewProps) => {
    const ctaType = creative?.callToAction?.type;
    const ctaLink = creative?.objectStorySpec?.link_data?.link;
    const headline = creative?.headline;

    const compressedText = creative?.primary_text
      ? creative.primary_text
          .replace(/\n+/g, ' ')
          .replace(/[ \t]{2,}/g, ' ')
          .trim()
      : null;

    const getHostname = (url: string) => {
      try {
        return new URL(url).hostname;
      } catch {
        return url;
      }
    };

    return (
      <div className="max-w-md mx-auto bg-white shadow-lg overflow-hidden rounded-lg">
        <div className="px-4 pt-3 pb-2 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">f</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">Meta</p>
            <p className="text-xs text-slate-500">Sponsored</p>
          </div>
        </div>

        {compressedText && (
          <div className="px-4 pb-3">
            <p className="text-sm text-slate-900 leading-relaxed">{compressedText}</p>
          </div>
        )}

        {renderAdModalMedia(mediaConfig, adName)}

        {headline && ctaLink && (
          <div className="px-4 py-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 mb-1">{getHostname(ctaLink)}</p>
                <p className="text-sm font-semibold text-slate-900">{headline}</p>
              </div>
              {ctaType && (
                <button className="ml-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
                  {ctaType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </button>
              )}
            </div>
          </div>
        )}

        {ctaType && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              {ctaLink ? (
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 mb-1">{getHostname(ctaLink)}</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {headline || 'Get Your Free Estimate Today!'}
                  </p>
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">Get Your Free Estimate Today!</p>
                </div>
              )}
              <a
                href={ctaLink || '#'}
                target={ctaLink ? "_blank" : undefined}
                rel={ctaLink ? "noopener noreferrer" : undefined}
                className="ml-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                {ctaType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden p-0 gap-0">
        {/* 1. Header */}
        <div className="px-4 pt-4 pb-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">
              {displayAd.adName || 'Ad Details'}
            </DialogTitle>
            <p className="text-sm text-slate-500">Ad name</p>
          </DialogHeader>
        </div>

        {/* 2. Calendar bar with full-width borders */}
        <div className="border-t border-b border-slate-200 px-4 py-3">
            <Popover open={openPicker} onOpenChange={setOpenPicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-normal border-slate-300 hover:bg-slate-100 hover:border-slate-400 text-slate-700"
                >
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-slate-600" />
                  <span className="text-slate-700">
                    {formatCustomRangeLabel(customStart, customEnd)}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="grid grid-cols-2">
                  <div className="relative">
                    <p className="absolute top-6 left-6 text-sm font-medium text-slate-600 mb-2 text-center">Start</p>
                    <Calendar
                      mode="single"
                      selected={customStart}
                      onSelect={handleStartDateChange}
                      showOutsideDays
                      month={startMonth}
                      onMonthChange={(m) => m && setStartMonth(m)}
                      classNames={{
                        day_today:
                          "relative text-muted-foreground after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-muted-foreground",
                        caption:
                          "flex pl-10 justify-center pt-1 relative items-center",
                        caption_label: "hidden",
                        caption_dropdowns:
                          "flex items-center gap-2 justify-center",
                        dropdown_month:
                          "h-9 text-sm bg-background border border-input rounded-md flex items-center leading-none text-foreground focus:outline-none focus:ring-0",
                        dropdown_year:
                          "h-9 text-sm bg-background border border-input rounded-md flex items-center leading-none text-foreground focus:outline-none focus:ring-0",
                      }}
                      captionLayout="dropdown"
                      fromYear={1990}
                      toYear={currentYear + 10}
                      pagedNavigation
                    />
                  </div>
                  <div className="relative">
                    <p className="absolute top-6 left-10 text-sm font-medium text-slate-600 mb-2 text-center">End</p>
                    <Calendar
                      mode="single"
                      selected={customEnd}
                      onSelect={handleEndDateChange}
                      showOutsideDays
                      month={endMonth}
                      disabled={{ after: new Date() }}
                      onMonthChange={(m) => m && setEndMonth(m)}
                      classNames={{
                        day_today:
                          "relative text-muted-foreground after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-muted-foreground",
                        caption:
                          "flex pl-10 justify-center pt-1 relative items-center",
                        caption_label: "hidden",
                        caption_dropdowns:
                          "flex items-center gap-2 justify-center",
                        dropdown_month:
                          "h-9 text-sm bg-background border border-input rounded-md flex items-center leading-none text-foreground focus:outline-none focus:ring-0",
                        dropdown_year:
                          "h-9 text-sm bg-background border border-input rounded-md flex items-center leading-none text-foreground focus:outline-none focus:ring-0",
                      }}
                      captionLayout="dropdown"
                      fromYear={1990}
                      toYear={currentYear + 10}
                      pagedNavigation
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 px-3 pb-3">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setCustomStart(modalStartDate ? new Date(modalStartDate) : new Date());
                      setStartMonth(modalStartDate ? new Date(modalStartDate) : new Date());
                      setCustomEnd(modalEndDate ? new Date(modalEndDate) : new Date());
                      setEndMonth(modalEndDate ? new Date(modalEndDate) : new Date());
                      setOpenPicker(false);
                    }}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setModalStartDate(format(customStart, 'yyyy-MM-dd'));
                      setModalEndDate(format(customEnd, 'yyyy-MM-dd'));
                      setOpenPicker(false);
                    }}
                    size="sm"
                  >
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
        </div>

        {isLoadingModalData && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-slate-600">Loading ad data...</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1fr,450px] overflow-hidden -mt-px" style={{ maxHeight: 'calc(80vh - 120px)' }}>
          <div className="border-t overflow-y-auto scroll-thin bg-slate-100 px-8 py-6" style={{ maxHeight: 'calc(80vh - 120px)' }}>
            <AdPreview 
              creative={effectiveCreative} 
              mediaConfig={mediaConfig} 
              adName={displayAd.adName} 
            />
            
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide">Ad Details</h3>
              <div className="space-y-3">
                {displayAd.adName && (
                  <div className="flex items-start justify-between py-2">
                    <span className="text-xs text-slate-500">Ad Name</span>
                    <span className="text-sm font-medium text-slate-900 text-right max-w-[60%]">{displayAd.adName}</span>
          </div>
                )}
                
                {displayAd.adSetName && (
                  <div className="flex items-start justify-between py-2">
                    <span className="text-xs text-slate-500">Ad Set</span>
                    <span className="text-sm font-medium text-slate-900 text-right max-w-[60%]">{displayAd.adSetName}</span>
                  </div>
                )}

                {displayAd.campaignName && (
                  <div className="flex items-start justify-between py-2">
                    <span className="text-xs text-slate-500">Campaign</span>
                    <span className="text-sm font-medium text-slate-900 text-right max-w-[60%]">{displayAd.campaignName}</span>
                    </div>
                )}
                    
                        {creative?.id && (
                  <div className="flex items-start justify-between py-2">
                    <span className="text-xs text-slate-500">Creative ID</span>
                    <span className="text-sm font-medium text-slate-900 text-right max-w-[60%]">{creative.id}</span>
                  </div>
                )}

                <div className="flex items-start justify-between py-2">
                  <span className="text-xs text-slate-500">Ad Type</span>
                  <div className="flex items-center gap-1.5">
                    <CreativeIcon className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-900">{typeInfo.label}</span>
                      </div>
                    </div>

                {displayAd.optimizationGoal && (
                  <div className="flex items-start justify-between py-2">
                    <span className="text-xs text-slate-500">Optimization Goal</span>
                    <span className="text-sm font-medium text-slate-900 text-right max-w-[60%]">
                      {displayAd.optimizationGoal.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </span>
                      </div>
                    )}

                {creative?.callToAction?.type && (
                  <div className="flex items-start justify-between py-2">
                    <span className="text-xs text-slate-500">Call to Action</span>
                    <span className="text-sm font-medium text-slate-900 text-right max-w-[60%]">
                      {creative.callToAction.type.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </span>
                      </div>
                    )}

                    {creative?.objectStorySpec?.link_data?.link && (
                  <div className="flex items-start justify-between py-2">
                    <span className="text-xs text-slate-500">Landing Page</span>
                        <a 
                          href={creative.objectStorySpec.link_data.link}
                          target="_blank"
                          rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline text-right max-w-[60%] truncate"
                          title={creative.objectStorySpec.link_data.link}
                        >
                          {new URL(creative.objectStorySpec.link_data.link).hostname}
                        </a>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-slate-500">Platform</span>
                  <span className="text-sm font-medium text-slate-900">Meta</span>
                      </div>
                    </div>
                    </div>
                  </div>

          <div className="border overflow-y-auto pb-16 scroll-thin" style={{ maxHeight: 'calc(80vh - 120px)' }}>
            <Collapsible open={isPerformanceOpen} onOpenChange={setIsPerformanceOpen} className="[&+&]:mt-0">
              <div className="bg-white border border-slate-200 overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-medium text-slate-700">Performance</span>
                    {isPerformanceOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
                    <div className="space-y-3 py-2">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-slate-500">Revenue Generated</span>
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(displayAd.revenue)}</p>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-slate-500">Cost per Estimate Set</span>
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(displayAd.costPerEstimateSet)}</p>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-slate-500">Number of Estimates Set</span>
                        <p className="text-sm font-semibold text-slate-900">{formatNumber(displayAd.numberOfEstimateSets)}</p>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-slate-500">Cost of Marketing %</span>
                        <p className="text-sm font-semibold text-slate-900">{formatPercent(displayAd.costOfMarketingPercent)}</p>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-slate-500">Average Job Size</span>
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(displayAd.averageJobSize)}</p>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-slate-500">Cost Per Lead</span>
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(displayAd.costPerLead)}</p>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-slate-500">Number of Leads</span>
                        <p className="text-sm font-semibold text-slate-900">{formatNumber(displayAd.numberOfLeads)}</p>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            <Collapsible open={isEfficiencyOpen} onOpenChange={setIsEfficiencyOpen} className="[&+&]:mt-0 -mt-px">
              <div className="bg-white border border-slate-200 overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-medium text-slate-700">Efficiency</span>
                    {isEfficiencyOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
                    <div className="space-y-3 py-2">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-slate-500">Conversion Rate (leads/link clicks)</span>
                        <p className="text-sm font-semibold text-slate-900">{formatPercent(displayAd.conversion_rate)}</p>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-slate-500">Thumbstop Rate</span>
                        <p className="text-sm font-semibold text-slate-900">{formatPercent(displayAd.thumbstop_rate)}</p>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-slate-500">See More Rate</span>
                        <p className="text-sm font-semibold text-slate-900">{formatPercent(displayAd.see_more_rate)}</p>
                    </div>
                      <div className="flex items-start justify-between py-2">
                        <div className="flex-1 pr-2">
                          <span className="text-xs text-slate-500 block">Hold rate</span>
                          <span className="text-xs text-slate-400 italic">(ThruPlays ÷ Impressions. Did they stay? This tells you how well the story or creative kept attention beyond the initial hook.)</span>
                  </div>
                        <p className="text-sm font-semibold text-slate-900 ml-2 flex-shrink-0">{formatPercent(displayAd.holdRate)}</p>
              </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-slate-500">Cost per Link Click</span>
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(displayAd.costPerLinkClick)}</p>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-slate-500">CPM (cost per 1,000 impressions)</span>
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(displayAd.fb_cpm)}</p>
                      </div>
                      <div className="flex items-start justify-between py-2">
                        <div className="flex-1 pr-2">
                          <span className="text-xs text-slate-500 block">Result Rate</span>
                          <span className="text-xs text-slate-400 italic">(The percentage of results that occurred out of the number of impressions.)</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 ml-2 flex-shrink-0">{formatPercent(displayAd.resultRate)}</p>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-slate-500">Frequency</span>
                        <p className="text-sm font-semibold text-slate-900">{formatNumber(displayAd.fb_frequency)}</p>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            <Collapsible open={isInteractionsOpen} onOpenChange={setIsInteractionsOpen} className="[&+&]:mt-0 -mt-px">
              <div className="bg-white border border-slate-200 overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-medium text-slate-700">Interactions</span>
                    {isInteractionsOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
                    <div className="space-y-3 py-2">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-slate-500">Post comments</span>
                        <p className="text-sm font-semibold text-slate-900">{formatNumber(displayAd.fb_post_comments)}</p>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-slate-500">Post reactions</span>
                        <p className="text-sm font-semibold text-slate-900">{formatNumber(displayAd.fb_post_reactions)}</p>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-slate-500">Post shares</span>
                        <p className="text-sm font-semibold text-slate-900">{formatNumber(displayAd.fb_post_shares)}</p>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-slate-500">Post saves</span>
                        <p className="text-sm font-semibold text-slate-900">{formatNumber(displayAd.fb_post_saves)}</p>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
