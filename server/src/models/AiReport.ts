// AiReport model for Supabase
export type ReportType = 'Financial Forecast' | 'Service Optimization';
export type GeneratedForType = 'client' | 'user';

export interface AiReport {
  id: string;
  report_type: ReportType;
  generated_for_id: string;
  generated_for_type: GeneratedForType;
  summary: string;
  recommendations: string[];
  confidence_score: number; // 0..1
  created_at: string;
}

export interface AiReportInsert {
  report_type: ReportType;
  generated_for_id: string;
  generated_for_type: GeneratedForType;
  summary: string;
  recommendations: string[];
  confidence_score: number;
  created_at?: string;
}

export interface AiReportUpdate {
  report_type?: ReportType;
  generated_for_id?: string;
  generated_for_type?: GeneratedForType;
  summary?: string;
  recommendations?: string[];
  confidence_score?: number;
}


