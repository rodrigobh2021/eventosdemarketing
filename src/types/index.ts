export interface ScrapedEventData {
  title: string;
  description: string;
  start_date: string; // YYYY-MM-DD
  end_date: string | null;
  start_time: string | null; // HH:MM
  end_time: string | null;
  city: string | null;
  state: string | null; // UF, 2 letters
  address: string | null;
  venue_name: string | null;
  category: 'CONFERENCIA' | 'WORKSHOP' | 'MEETUP' | 'WEBINAR' | 'CURSO' | 'PALESTRA' | 'HACKATHON';
  topics: string[];
  is_free: boolean;
  price_type: 'a_partir_de' | 'unico' | 'nao_informado' | null;
  price_value: number | null;
  ticket_url: string | null;
  event_url: string;
  image_url: string | null;
  organizer_name: string;
  organizer_url: string | null;
  format: 'PRESENCIAL' | 'ONLINE' | 'HIBRIDO';
  latitude: number | null;
  longitude: number | null;
  slug: string;
}

export interface ScrapeMeta {
  source_url: string;
  extracted_at: string; // ISO 8601
  has_jsonld: boolean;
  has_og_tags: boolean;
  confidence: 'high' | 'medium' | 'low';
}

export interface ScrapeApiResponse {
  success: true;
  data: ScrapedEventData;
  meta: ScrapeMeta;
}

export interface ScrapeApiError {
  success: false;
  error: string;
}

export type ScrapeApiResult = ScrapeApiResponse | ScrapeApiError;
