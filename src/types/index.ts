export type LeadStatus = 'novo' | 'contatado' | 'respondido' | 'sem_interesse' | 'fechado' | 'excluido';

export interface PlaceResult {
  place_id: string;
  nome: string;
  endereco?: string | null;
  cidade?: string | null;
  telefone?: string | null;
  site?: string | null;
  rating?: number | null;
  total_reviews?: number | null;
  categoria?: string | null;
  horario_abertura?: string | null;
  fotos?: string[] | null;
}

export interface Lead extends PlaceResult {
  id: string;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

export interface LeadStats {
  buscados: number;
  salvos: number;
  novos: number;
  contatados: number;
  respondidos: number;
  fechados: number;
  requisicoes: number;
}
