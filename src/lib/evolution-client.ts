const API_URL = process.env.EVOLUTION_API_URL;
const API_KEY = process.env.EVOLUTION_API_KEY;

if (!API_URL || !API_KEY) {
  console.warn('EVOLUTION_API_URL ou EVOLUTION_API_KEY não configurados.');
}

// Helper para garantir que a URL tem o protocolo correto
const getBaseUrl = () => {
  if (!API_URL) return '';
  let url = API_URL.trim();
  if (!url.startsWith('http')) url = `https://${url}`;
  return url.replace(/\/$/, ''); // Remove barra final
};

export class EvolutionClient {
  private static async request(endpoint: string, options: RequestInit = {}) {
    const url = `${getBaseUrl()}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'apikey': API_KEY || '',
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
      console.error('Evolution API Error Response:', JSON.stringify(errorData, null, 2));

      let msg: string;
      const responseMessages = (errorData.response as Record<string, unknown> | undefined)?.message;

      if (typeof errorData.message === 'string') {
        msg = errorData.message;
      } else if (Array.isArray(responseMessages)) {
        const notFound = (responseMessages as Record<string, unknown>[]).find(m => m.exists === false);
        if (notFound) {
          msg = `Número não encontrado no WhatsApp: ${String(notFound.number ?? '')}`;
        } else {
          const texts = (responseMessages as unknown[]).filter(m => typeof m === 'string') as string[];
          msg = texts.join(', ') || `Erro na Evolution API: ${response.status}`;
        }
      } else {
        msg = `Erro na Evolution API: ${response.status}`;
      }

      throw new Error(msg);
    }

    return response.json();
  }

  static async createInstance(instanceName: string) {
    return this.request('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS', // Padrão para Evolution v2
      }),
    });
  }

  static async fetchInstances() {
    return this.request('/instance/fetchInstances');
  }

  static async findChats(instanceName: string) {
    return this.request(`/chat/findChats/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({}), // Busca todos
    });
  }

  static async findMessages(instanceName: string, remoteJid: string, limit = 50) {
    return this.request(`/chat/findMessages/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        where: { remoteJid },
        limit,
      }),
    });
  }

  static async getInstanceStatus(instanceName: string) {
    return this.request(`/instance/connectionState/${instanceName}`);
  }

  static async getQRCode(instanceName: string) {
    return this.request(`/instance/connect/${instanceName}`);
  }

  static async logout(instanceName: string) {
    return this.request(`/instance/logout/${instanceName}`, {
      method: 'DELETE',
    });
  }

  static async deleteInstance(instanceName: string) {
    return this.request(`/instance/delete/${instanceName}`, {
      method: 'DELETE',
    });
  }

  static async sendMessage(instanceName: string, number: string, text: string) {
    const digits = number.replace(/\D/g, '');
    const cleanNumber = digits.startsWith('55') ? digits : `55${digits}`;

    return this.request(`/message/sendText/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: cleanNumber,
        text,
        options: {
          delay: 1200,
          presence: 'composing',
        },
      }),
    });
  }
}
