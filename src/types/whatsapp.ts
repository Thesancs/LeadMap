export interface WhatsAppInstance {
  id: string;
  instance_name: string;
  display_name: string;
  phone_number: string | null;
  status: 'open' | 'close' | 'connecting';
  assigned_to: string | null;
  last_used_at: string | null;
  warmup_started_at: string | null;
  warmup_days_current: number;
  warmup_days_total: number;
  daily_limit: number;
  created_at: string;
  updated_at: string;
}

export interface EvolutionInstanceResponse {
  instance: {
    instanceName: string;
    instanceId: string;
    status: string;
  };
  hash: {
    apikey: string;
  };
  qrcode?: {
    code: string;
    base64: string;
  };
}

export interface EvolutionStateResponse {
  instance: {
    state: 'open' | 'close' | 'connecting';
  };
}

export interface WhatsAppChat {
  id: string;
  remoteJid: string;
  pushName?: string;
  profilePicUrl?: string;
  unreadCount: number;
  messageTimestamp: number;
  lastMessage?: {
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
      imageMessage?: {
        caption?: string;
      };
      videoMessage?: {
        caption?: string;
      };
      documentMessage?: {
        caption?: string;
      };
    };
  };
}

export interface WhatsAppMessage {
  key: {
    id: string;
    remoteJid: string;
    fromMe: boolean;
  };
  message?: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
    imageMessage?: {
      caption?: string;
    };
    videoMessage?: {
      caption?: string;
    };
    documentMessage?: {
      caption?: string;
    };
  };
  messageTimestamp: number;
  status?: string;
}
