import { doGET, doPATCH, doPOST, doDELETE, doDELETEWithBody } from "@/utils/HttpUtils";
import { API_ENDPOINTS } from "@/utils/constant";
import { Lead } from "@/types";
import { TimeFilter } from '../types/timeFilter';

export interface GetLeadsPayload {
  clientId?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateLeadPayload {
  _id: string;
  status: 'new' | 'in_progress' | 'estimate_set' | 'unqualified';
  unqualifiedLeadReason?: string;
}

// New interfaces for paginated API
export interface GetPaginatedLeadsPayload {
  clientId: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'score';
  sortOrder?: 'asc' | 'desc';
  adSetName?: string;
  adName?: string;
  status?: string;
  unqualifiedLeadReason?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ConversionRates {
  service: Array<{ name: string; conversionRate: number }>;
  adSetName: Array<{ name: string; conversionRate: number }>;
  adName: Array<{ name: string; conversionRate: number }>;
  dates: Array<{ date: string; conversionRate: number }>;
}

export interface GetPaginatedLeadsResponse {
  success: boolean;
  data: Lead[];
  pagination: PaginationInfo;
  conversionRates?: ConversionRates;
}

// Filter options interfaces
export interface GetFilterOptionsPayload {
  clientId: string;
  startDate?: string;
  endDate?: string;
}

export interface FilterOptions {
  services: string[];
  adSetNames: string[];
  adNames: string[];
  statuses: string[];
  unqualifiedLeadReasons: string[];
}

export interface StatusCounts {
  new: number;
  inProgress: number;
  estimateSet: number;
  unqualified: number;
}

export interface GetFilterOptionsResponse {
  success: boolean;
  data: {
    filterOptions: FilterOptions;
    statusCounts: StatusCounts;
  };
}

export interface GetLeadsResponse {
  success: boolean;
  data: Lead[];
}

export interface UpdateLeadResponse {
  success: boolean;
  data: Lead;
}

export interface DeleteLeadPayload {
  _id: string;
}

export interface BulkDeleteLeadsPayload {
  leadIds: string[];
}

export interface DeleteLeadResponse {
  success: boolean;
  message?: string;
}

export interface AnalyticsOverview {
  totalLeads: number;
  estimateSetCount: number;
  unqualifiedCount: number;
  estimateSetRate: string;
}

export interface AnalyticsDataPoint {
  zip?: string;
  service?: string;
  adSetName?: string;
  adName?: string;
  date?: string;
  day?: string;
  reason?: string;
  count: number;
  percentage: string;
  total?: number;
  estimateSet?: number;
}

export interface AnalyticsSummaryResponse {
  success: boolean;
  data: {
    overview: AnalyticsOverview;
    zipData: AnalyticsDataPoint[];
    serviceData: AnalyticsDataPoint[];
    adSetData: AnalyticsDataPoint[];
    adNameData: AnalyticsDataPoint[];
    leadDateData: AnalyticsDataPoint[];
    dayOfWeekData: AnalyticsDataPoint[];
    ulrData: AnalyticsDataPoint[];
  };
}

export interface AnalyticsTableResponse {
  success: boolean;
  data: {
    adSetData: {
      data: AnalyticsDataPoint[];
      pagination: PaginationInfo;
    };
    adNameData: {
      data: AnalyticsDataPoint[];
      pagination: PaginationInfo;
    };
  };
}


export interface GetAnalyticsSummaryPayload {
  clientId: string;
  timeFilter?: TimeFilter;
}

export interface GetAnalyticsTablePayload {
  clientId: string;
  commonTimeFilter?: 'all' | '7' | '14' | '30' | '60';
  adSetPage?: number;
  adNamePage?: number;
  adSetItemsPerPage?: number;
  adNameItemsPerPage?: number;
  adSetSortField?: 'adSetName' | 'total' | 'estimateSet' | 'percentage';
  adSetSortOrder?: 'asc' | 'desc';
  adNameSortField?: 'adName' | 'total' | 'estimateSet' | 'percentage';
  adNameSortOrder?: 'asc' | 'desc';
  showTopRanked?: boolean;
}

// Lead sheet processing interfaces
export interface ProcessLeadSheetPayload {
  sheetUrl: string;
  clientId: string;
  uniquenessByPhoneEmail: boolean;
}

export interface ProcessLeadSheetResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const getPaginatedLeads = async (payload: GetPaginatedLeadsPayload) => {
  const params = new URLSearchParams();
  
  // Required parameters
  params.append('clientId', payload.clientId);
  
  // Optional parameters
  if (payload.startDate) params.append('startDate', payload.startDate);
  if (payload.endDate) params.append('endDate', payload.endDate);
  if (payload.page) params.append('page', payload.page.toString());
  if (payload.limit) params.append('limit', payload.limit.toString());
  if (payload.sortBy) params.append('sortBy', payload.sortBy);
  if (payload.sortOrder) params.append('sortOrder', payload.sortOrder);
  if (payload.adSetName) params.append('adSetName', payload.adSetName);
  if (payload.adName) params.append('adName', payload.adName);
  if (payload.status) params.append('status', payload.status);
  if (payload.unqualifiedLeadReason) params.append('unqualifiedLeadReason', payload.unqualifiedLeadReason);
  
  const url = `${API_ENDPOINTS.LEADS_PAGINATED}?${params.toString()}`;
  const response = await doGET(url);
  return response;
};

// New function for filter options
export const getFilterOptions = async (payload: GetFilterOptionsPayload) => {
  const params = new URLSearchParams();
  
  // Required parameters
  params.append('clientId', payload.clientId);
  
  // Optional parameters
  if (payload.startDate) params.append('startDate', payload.startDate);
  if (payload.endDate) params.append('endDate', payload.endDate);
  
  const url = `${API_ENDPOINTS.LEADS_FILTERS_COUNTS}?${params.toString()}`;
  const response = await doGET(url);
  return response;
};

// New function for exporting all filtered data
export const exportAllFilteredLeads = async (payload: GetPaginatedLeadsPayload) => {
  // For export, we want all data, so set a very high limit
  const exportPayload = {
    ...payload,
    page: 1,
    limit: 10000 // Set a very high limit to get all data
  };
  
  const params = new URLSearchParams();
  
  // Required parameters
  params.append('clientId', exportPayload.clientId);
  
  // Optional parameters
  if (exportPayload.startDate) params.append('startDate', exportPayload.startDate);
  if (exportPayload.endDate) params.append('endDate', exportPayload.endDate);
  if (exportPayload.page) params.append('page', exportPayload.page.toString());
  if (exportPayload.limit) params.append('limit', exportPayload.limit.toString());
  if (exportPayload.sortBy) params.append('sortBy', exportPayload.sortBy);
  if (exportPayload.sortOrder) params.append('sortOrder', exportPayload.sortOrder);
  if (exportPayload.adSetName) params.append('adSetName', exportPayload.adSetName);
  if (exportPayload.adName) params.append('adName', exportPayload.adName);
  if (exportPayload.status) params.append('status', exportPayload.status);
  if (exportPayload.unqualifiedLeadReason) params.append('unqualifiedLeadReason', exportPayload.unqualifiedLeadReason);
  
  const url = `${API_ENDPOINTS.LEADS_PAGINATED}?${params.toString()}`;
  const response = await doGET(url);
  return response;
};

export const updateLead = async (payload: UpdateLeadPayload) => {
  const response = await doPATCH(API_ENDPOINTS.LEADS_BASE, payload);
  return response;
};

export const deleteLead = async (payload: DeleteLeadPayload) => {
  const response = await doDELETE(`${API_ENDPOINTS.LEADS_BASE}/${payload._id}`);
  return response;
};

export const bulkDeleteLeads = async (payload: BulkDeleteLeadsPayload) => {
  const response = await doDELETEWithBody(API_ENDPOINTS.LEADS_BASE, payload);
  return response;
};

// Analytics API functions
export const getAnalyticsSummary = async (payload: GetAnalyticsSummaryPayload) => {
  const params = new URLSearchParams();
  
  // Required parameters
  params.append('clientId', payload.clientId);
  
  // Optional parameters
  if (payload.timeFilter) params.append('timeFilter', payload.timeFilter);
  
  const url = `${API_ENDPOINTS.LEADS_ANALYTICS_SUMMARY}?${params.toString()}`;
  const response = await doGET(url);
  return response;
};

export const getAnalyticsTable = async (payload: GetAnalyticsTablePayload) => {
  const params = new URLSearchParams();
  
  // Required parameters
  params.append('clientId', payload.clientId);
  
  // Optional parameters
  if (payload.commonTimeFilter) params.append('commonTimeFilter', payload.commonTimeFilter);
  if (payload.adSetPage) params.append('adSetPage', payload.adSetPage.toString());
  if (payload.adNamePage) params.append('adNamePage', payload.adNamePage.toString());
  if (payload.adSetItemsPerPage) params.append('adSetItemsPerPage', payload.adSetItemsPerPage.toString());
  if (payload.adNameItemsPerPage) params.append('adNameItemsPerPage', payload.adNameItemsPerPage.toString());
  if (payload.adSetSortField) params.append('adSetSortField', payload.adSetSortField);
  if (payload.adSetSortOrder) params.append('adSetSortOrder', payload.adSetSortOrder);
  if (payload.adNameSortField) params.append('adNameSortField', payload.adNameSortField);
  if (payload.adNameSortOrder) params.append('adNameSortOrder', payload.adNameSortOrder);
  if (payload.showTopRanked !== undefined) params.append('showTopRanked', payload.showTopRanked.toString());
  
  const url = `${API_ENDPOINTS.LEADS_ANALYTICS_AD_TABLE}?${params.toString()}`;
  const response = await doGET(url);
  return response;
};

// Lead sheet processing function
export const processLeadSheet = async (payload: ProcessLeadSheetPayload) => {
  const response = await doPOST(API_ENDPOINTS.LEADS_PROCESS_SHEET, payload);
  return response;
};