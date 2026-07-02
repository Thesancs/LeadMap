'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Lead, WhatsAppInstance, WhatsAppChat, WhatsAppMessage } from '@/types';
import { toast } from 'sonner';
import {
  Loader2,
  Settings2,
  LayoutDashboard,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import InstanceSidebar from '@/components/whatsapp/InstanceSidebar';
import ChatList from '@/components/whatsapp/ChatList';
import ChatWindow from '@/components/whatsapp/ChatWindow';
import AddInstanceModal from '@/components/whatsapp/AddInstanceModal';
import QRCodeModal from '@/components/whatsapp/QRCodeModal';
import LinkLeadModal from '@/components/whatsapp/LinkLeadModal';
import { normalizeEvolutionChats } from '@/lib/whatsapp-normalizers';

const MESSAGES_TTL_MS = 60_000;

interface CachedConversation {
  messages: WhatsAppMessage[];
  hasMore: boolean;
  nextCursor: string | null;
  cachedAt: number;
}

interface WhatsAppDraft {
  remoteJid: string;
  message: string;
  leadId?: string;
  leadName?: string;
}

function phoneToRemoteJid(phone: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  const normalizedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  return `${normalizedPhone}@s.whatsapp.net`;
}

function createDraftChat(draft: WhatsAppDraft): WhatsAppChat {
  return {
    id: draft.remoteJid,
    remoteJid: draft.remoteJid,
    pushName: draft.leadName,
    unreadCount: 0,
    messageTimestamp: Math.floor(Date.now() / 1000),
    lastMessage: {
      message: {
        conversation: draft.message || 'Rascunho pronto para envio',
      },
    },
  };
}

export default function WhatsAppPage() {
  const draftWasRequestedRef = useRef(false);
  const isPollingRef = useRef(false);
  const chatsCacheRef = useRef<Map<string, WhatsAppChat[]>>(new Map());
  const messagesCacheRef = useRef<Map<string, CachedConversation>>(new Map());

  // Data state
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [activeChatJid, setActiveChatJid] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);

  // Loading / UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'chat' | 'management'>('chat');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkedLead, setLinkedLead] = useState<Pick<Lead, 'id' | 'nome' | 'status'> | null>(null);
  const [pendingDraft, setPendingDraft] = useState<WhatsAppDraft | null>(null);
  const [draftInstanceId, setDraftInstanceId] = useState<string | null>(null);

  const [qrModal, setQrModal] = useState<{
    isOpen: boolean;
    base64?: string;
    instanceId?: string;
    isLoading: boolean;
  }>({ isOpen: false, isLoading: false });

  // ─── helpers ───────────────────────────────────────────────────────────────

  function setCachedEntry(cacheKey: string, entry: CachedConversation) {
    messagesCacheRef.current.set(cacheKey, entry);
    setMessages(entry.messages);
    setHasMore(entry.hasMore);
    setNextCursor(entry.nextCursor);
  }

  // ─── instance / chat handlers ───────────────────────────────────────────────

  const applyDraftToInstance = useCallback((instanceId: string, draft: WhatsAppDraft) => {
    const draftChat = createDraftChat(draft);
    setChats(prev => [draftChat, ...prev.filter(c => c.remoteJid !== draft.remoteJid)]);
    setMessages([]);
    setHasMore(false);
    setNextCursor(null);
    setActiveChatJid(draft.remoteJid);
    setSearchTerm('');
    setViewMode('chat');
    setDraftInstanceId(instanceId);
  }, []);

  const handleSelectInstance = useCallback((instanceId: string) => {
    setActiveInstanceId(instanceId);
    if (pendingDraft) {
      applyDraftToInstance(instanceId, pendingDraft);
      toast.info('Rascunho carregado. Revise a mensagem antes de enviar.');
    }
  }, [applyDraftToInstance, pendingDraft]);

  const fetchInstances = useCallback(async () => {
    try {
      const response = await fetch('/api/whatsapp/instances');
      if (!response.ok) throw new Error('Falha ao carregar instâncias');
      const data = await response.json();
      setInstances(data);
      if (data.length > 0 && !activeInstanceId && !draftWasRequestedRef.current) {
        const first = data.find((i: WhatsAppInstance) => i.status === 'open');
        if (first) setActiveInstanceId(first.id);
      }
    } catch {
      toast.error('Erro ao buscar números conectados');
    } finally {
      setIsLoading(false);
    }
  }, [activeInstanceId]);

  const fetchChats = useCallback(async (instanceName: string) => {
    const cached = chatsCacheRef.current.get(instanceName);
    if (cached) {
      setChats(() => {
        if (!pendingDraft) return cached;
        return [createDraftChat(pendingDraft), ...cached.filter(c => c.remoteJid !== pendingDraft.remoteJid)];
      });
    }

    setIsLoadingChats(true);
    try {
      const response = await fetch(`/api/whatsapp/chats/${instanceName}`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao carregar chats');

      const chatsArray = normalizeEvolutionChats(data);
      chatsCacheRef.current.set(instanceName, chatsArray);
      setChats(() => {
        if (!pendingDraft) return chatsArray;
        return [
          createDraftChat(pendingDraft),
          ...chatsArray.filter((c: WhatsAppChat) => c.remoteJid !== pendingDraft.remoteJid),
        ];
      });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Erro ao buscar conversas');
    } finally {
      setIsLoadingChats(false);
    }
  }, [pendingDraft]);

  // ─── message fetching ───────────────────────────────────────────────────────

  async function fetchWithRetry(
    url: string,
    options: RequestInit,
    retries = 3,
    delayMs = 1000,
  ): Promise<Response> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, options);
        if (res.ok) return res;
        throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        lastError = err;
        console.error(`[fetchWithRetry] tentativa ${attempt}/${retries} falhou:`, err);
        if (attempt < retries) await new Promise(r => setTimeout(r, delayMs * attempt));
      }
    }
    throw lastError;
  }

  // Initial load: uses TTL cache; falls back to API
  const fetchMessages = useCallback(async (instanceName: string, remoteJid: string) => {
    const cacheKey = `${instanceName}:${remoteJid}`;
    const cached = messagesCacheRef.current.get(cacheKey);

    if (cached && Date.now() - cached.cachedAt < MESSAGES_TTL_MS) {
      setMessages(cached.messages);
      setHasMore(cached.hasMore);
      setNextCursor(cached.nextCursor);
      return;
    }

    if (!cached) setIsLoadingMessages(true);

    try {
      const res = await fetchWithRetry(
        `/api/whatsapp/messages/${instanceName}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ remoteJid, limit: 50 }),
        },
      );
      const data = await res.json();

      setCachedEntry(cacheKey, {
        messages: data.messages ?? [],
        hasMore: data.hasMore ?? false,
        nextCursor: data.nextCursor ?? null,
        cachedAt: Date.now(),
      });
    } catch (error) {
      console.error('[fetchMessages] falhou após 3 tentativas:', error);
      toast.error('Não foi possível carregar as mensagens. Tente novamente.');
    } finally {
      setIsLoadingMessages(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pollMessages = useCallback(async (instanceName: string, remoteJid: string) => {
    if (isPollingRef.current) return;

    const cacheKey = `${instanceName}:${remoteJid}`;
    const cached = messagesCacheRef.current.get(cacheKey);
    if (!cached || cached.messages.length === 0) return;

    const lastMsg = cached.messages[cached.messages.length - 1];
    const after = new Date(lastMsg.messageTimestamp * 1000).toISOString();

    isPollingRef.current = true;
    try {
      const res = await fetchWithRetry(
        `/api/whatsapp/messages/${instanceName}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ remoteJid, after }),
        },
      );
      const data = await res.json();
      const newMessages: WhatsAppMessage[] = data.messages ?? [];
      if (newMessages.length === 0) return;

      setCachedEntry(cacheKey, {
        ...cached,
        messages: [...cached.messages, ...newMessages],
        cachedAt: Date.now(),
      });
    } catch (error) {
      console.error('[pollMessages] falhou após 3 tentativas:', error);
    } finally {
      isPollingRef.current = false;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pagination: load older messages triggered by scroll-to-top
  const fetchMoreMessages = useCallback(async (
    instanceName: string,
    remoteJid: string,
    cursor: string,
  ) => {
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/whatsapp/messages/${instanceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remoteJid, limit: 50, before: cursor }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const older: WhatsAppMessage[] = data.messages ?? [];

      const cacheKey = `${instanceName}:${remoteJid}`;
      const cached = messagesCacheRef.current.get(cacheKey);
      setCachedEntry(cacheKey, {
        messages: [...older, ...(cached?.messages ?? [])],
        hasMore: data.hasMore ?? false,
        nextCursor: data.nextCursor ?? null,
        cachedAt: cached?.cachedAt ?? Date.now(),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMore(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = useCallback(() => {
    if (!activeInstanceId || !activeChatJid || !nextCursor || isLoadingMore) return;
    const instance = instances.find(i => i.id === activeInstanceId);
    if (!instance) return;
    void fetchMoreMessages(instance.instance_name, activeChatJid, nextCursor);
  }, [activeInstanceId, activeChatJid, fetchMoreMessages, instances, isLoadingMore, nextCursor]);

  const fetchLinkedLead = useCallback(async (instanceName: string, remoteJid: string) => {
    try {
      const params = new URLSearchParams({ instanceName, remoteJid });
      const res = await fetch(`/api/whatsapp/link?${params.toString()}`);
      if (!res.ok) throw new Error('Falha ao buscar vínculo');
      const data = await res.json();
      setLinkedLead(data.lead ?? null);
    } catch (error) {
      console.error('[fetchLinkedLead] falhou:', error);
      setLinkedLead(null);
      toast.error('Não foi possível verificar o vínculo do lead.');
    }
  }, []);

  // ─── send message ───────────────────────────────────────────────────────────

  const handleSendMessage = async (text: string) => {
    if (!activeInstanceId || !activeChatJid) return;
    const instance = instances.find(i => i.id === activeInstanceId);
    if (!instance) return;

    const cacheKey = `${instance.instance_name}:${activeChatJid}`;
    const tempId = Date.now().toString();
    const optimistic: WhatsAppMessage = {
      key: { id: tempId, remoteJid: activeChatJid, fromMe: true },
      message: { conversation: text },
      messageTimestamp: Math.floor(Date.now() / 1000),
      status: 'PENDING',
    };

    setMessages(prev => {
      const next = [...prev, optimistic];
      const cached = messagesCacheRef.current.get(cacheKey);
      messagesCacheRef.current.set(cacheKey, {
        messages: next,
        hasMore: cached?.hasMore ?? false,
        nextCursor: cached?.nextCursor ?? null,
        cachedAt: cached?.cachedAt ?? Date.now(),
      });
      return next;
    });

    try {
      const res = await fetch(`/api/whatsapp/send/${instance.instance_name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: activeChatJid.split('@')[0], text, remoteJid: activeChatJid }),
      });
      if (!res.ok) throw new Error('Falha ao enviar');

      setMessages(prev => {
        const next = prev.map(m => m.key.id === tempId ? { ...m, status: 'SENT' } : m);
        const cached = messagesCacheRef.current.get(cacheKey);
        messagesCacheRef.current.set(cacheKey, {
          messages: next,
          hasMore: cached?.hasMore ?? false,
          nextCursor: cached?.nextCursor ?? null,
          cachedAt: cached?.cachedAt ?? Date.now(),
        });
        return next;
      });
      setPendingDraft(null);
    } catch {
      toast.error('Erro ao enviar mensagem');
      setMessages(prev => {
        const next = prev.filter(m => m.key.id !== tempId);
        const cached = messagesCacheRef.current.get(cacheKey);
        messagesCacheRef.current.set(cacheKey, {
          messages: next,
          hasMore: cached?.hasMore ?? false,
          nextCursor: cached?.nextCursor ?? null,
          cachedAt: cached?.cachedAt ?? Date.now(),
        });
        return next;
      });
    }
  };

  // ─── effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    void Promise.resolve().then(fetchInstances);
  }, [fetchInstances]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const phone = params.get('phone');
    const message = params.get('message') || '';
    if (!phone) return;
    draftWasRequestedRef.current = true;
    queueMicrotask(() => {
      setPendingDraft({
        remoteJid: phoneToRemoteJid(phone),
        message,
        leadId: params.get('leadId') || undefined,
        leadName: params.get('leadName') || undefined,
      });
      setViewMode('chat');
    });
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  useEffect(() => {
    if (!pendingDraft || activeInstanceId) return;
    const open = instances.filter(i => i.status === 'open');
    if (open.length === 1) queueMicrotask(() => handleSelectInstance(open[0].id));
  }, [activeInstanceId, handleSelectInstance, instances, pendingDraft]);

  useEffect(() => {
    if (!activeInstanceId) return;
    const instance = instances.find(i => i.id === activeInstanceId);
    if (instance?.status === 'open') {
      void Promise.resolve().then(() => {
        fetchChats(instance.instance_name);
        setActiveChatJid(pendingDraft ? pendingDraft.remoteJid : null);
        setMessages([]);
        setHasMore(false);
        setNextCursor(null);
      });
    } else {
      void Promise.resolve().then(() => setChats([]));
    }
  }, [activeInstanceId, instances, fetchChats, pendingDraft]);

  useEffect(() => {
    if (!pendingDraft || !activeInstanceId || draftInstanceId === activeInstanceId) return;
    queueMicrotask(() => {
      applyDraftToInstance(activeInstanceId, pendingDraft);
      toast.info('Rascunho carregado. Revise a mensagem antes de enviar.');
    });
  }, [activeInstanceId, applyDraftToInstance, draftInstanceId, pendingDraft]);

  useEffect(() => {
    if (!activeChatJid || !activeInstanceId) return;

    if (pendingDraft && activeChatJid === pendingDraft.remoteJid) {
      queueMicrotask(() => {
        setMessages([]);
        setHasMore(false);
        setNextCursor(null);
        setIsLoadingMessages(false);
        setLinkedLead(null);
      });
      return;
    }

    const instance = instances.find(i => i.id === activeInstanceId);
    if (instance) {
      void Promise.resolve().then(() => {
        setHasMore(false);
        setNextCursor(null);
        fetchMessages(instance.instance_name, activeChatJid);
        fetchLinkedLead(instance.instance_name, activeChatJid);
      });
    }
  }, [activeChatJid, activeInstanceId, instances, fetchMessages, fetchLinkedLead, pendingDraft]);

  // Poll instance status every 10 s when on management view
  useEffect(() => {
    if (viewMode !== 'management') return;
    const interval = setInterval(() => void fetchInstances(), 10_000);
    return () => clearInterval(interval);
  }, [viewMode, fetchInstances]);

  // Polling with incremental sync (5 s)
  useEffect(() => {
    if (!activeChatJid || !activeInstanceId) return;
    if (pendingDraft && activeChatJid === pendingDraft.remoteJid) return;

    const instance = instances.find(i => i.id === activeInstanceId);
    if (!instance || instance.status !== 'open') return;

    const interval = setInterval(() => {
      pollMessages(instance.instance_name, activeChatJid);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeChatJid, activeInstanceId, instances, pollMessages, pendingDraft]);

  // ─── derived ────────────────────────────────────────────────────────────────

  const filteredChats = chats.filter(chat => {
    const name = (chat.pushName || '').toLowerCase();
    const jid = (chat.remoteJid || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || jid.includes(term);
  });

  const activeChat =
    chats.find(c => c.remoteJid === activeChatJid) ||
    (pendingDraft && activeChatJid === pendingDraft.remoteJid ? createDraftChat(pendingDraft) : null);

  // ─── render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20 mb-4" />
        <p className="text-zinc-500 font-medium">Carregando WhatsApp Pro...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      <div className="bg-zinc-950 border-b border-white/5 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-black text-white tracking-tight">WhatsApp Pro</h1>
          </div>

          <div className="flex bg-zinc-900 p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setViewMode('chat')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'chat' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Chat
            </button>
            <button
              onClick={() => setViewMode('management')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'management' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Settings2 className="h-3.5 w-3.5" />
              Gerenciar
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <AddInstanceModal onSuccess={() => fetchInstances()} />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <InstanceSidebar
          instances={instances}
          activeInstanceId={activeInstanceId}
          onSelect={handleSelectInstance}
        />

        {viewMode === 'chat' ? (
          <>
            <ChatList
              chats={filteredChats}
              activeChatJid={activeChatJid}
              onSelect={setActiveChatJid}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              isLoading={isLoadingChats}
            />

            <ChatWindow
              chat={activeChat}
              messages={messages}
              isLoading={isLoadingMessages}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              onLoadMore={handleLoadMore}
              onSendMessage={handleSendMessage}
              onLinkLead={() => setIsLinkModalOpen(true)}
              linkedLead={linkedLead}
              draftMessage={pendingDraft && activeChatJid === pendingDraft.remoteJid ? pendingDraft.message : ''}
              isDraftChat={Boolean(pendingDraft && activeChatJid === pendingDraft.remoteJid)}
            />
          </>
        ) : (
          <div className="flex-1 p-8 overflow-y-auto bg-zinc-950/20">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white">Gerenciar Instâncias</h2>
                  <p className="text-zinc-500">Controle a saúde e conexão de seus números.</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchInstances} className="rounded-xl">
                  Atualizar Lista
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {instances.map(instance => (
                  <div key={instance.id} className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {instance.display_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-white">{instance.display_name}</h4>
                          <p className="text-xs text-zinc-500">{instance.instance_name}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                        instance.status === 'open' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {instance.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-xl bg-zinc-950/50 p-3 border border-white/5">
                        <p className="text-lg font-black text-white">{instance.daily_limit}</p>
                        <p className="text-[10px] uppercase text-zinc-500">Limite/dia</p>
                      </div>
                      <div className="rounded-xl bg-zinc-950/50 p-3 border border-white/5">
                        <p className="text-lg font-black text-white">{instance.warmup_days_current}</p>
                        <p className="text-[10px] uppercase text-zinc-500">Dia warmup</p>
                      </div>
                      <div className="rounded-xl bg-zinc-950/50 p-3 border border-white/5">
                        <p className="text-lg font-black text-white">{instance.warmup_days_total}</p>
                        <p className="text-[10px] uppercase text-zinc-500">Total dias</p>
                      </div>
                    </div>

                    {instance.warmup_started_at && (
                      <div className="rounded-xl bg-cyan-500/5 border border-cyan-500/10 p-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-cyan-400">Warmup ativo</span>
                          <span className="text-zinc-500">{instance.warmup_days_current}/{instance.warmup_days_total} dias</span>
                        </div>
                        <div className="h-2 bg-zinc-900 rounded-full overflow-hidden mt-2">
                          <div
                            className="h-full bg-cyan-500"
                            style={{ width: `${Math.min(100, (instance.warmup_days_current / Math.max(1, instance.warmup_days_total)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      {instance.status !== 'open' && (
                        <Button
                          size="sm"
                          className="flex-1 rounded-xl"
                          onClick={async () => {
                            setQrModal({ isOpen: true, isLoading: true, instanceId: instance.id });
                            try {
                              const res = await fetch(`/api/whatsapp/instances/${instance.id}/qrcode`);
                              const data = await res.json();
                              setQrModal(prev => ({ ...prev, base64: data.base64, isLoading: false }));
                            } catch {
                              toast.error('Erro ao gerar QR');
                              setQrModal(prev => ({ ...prev, isOpen: false }));
                            }
                          }}
                        >
                          Conectar
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-xl"
                        onClick={async () => {
                          if (!confirm('Excluir instância?')) return;
                          await fetch(`/api/whatsapp/instances/${instance.id}`, { method: 'DELETE' });
                          fetchInstances();
                        }}
                      >
                        Excluir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/whatsapp/instances/${instance.id}/warmup`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ warmup_days_total: 14, daily_limit: 20 }),
                            });
                            if (!res.ok) throw new Error();
                            toast.success('Warmup iniciado');
                            fetchInstances();
                          } catch {
                            toast.error('Erro ao iniciar warmup');
                          }
                        }}
                      >
                        {instance.warmup_started_at ? 'Reiniciar Warmup' : 'Iniciar Warmup'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <QRCodeModal
        isOpen={qrModal.isOpen}
        onClose={() => setQrModal(prev => ({ ...prev, isOpen: false }))}
        base64={qrModal.base64}
        isLoading={qrModal.isLoading}
        onRefresh={() => qrModal.instanceId && fetchInstances()}
      />

      {activeChatJid && (
        <LinkLeadModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          remoteJid={activeChatJid}
          instanceName={instances.find(i => i.id === activeInstanceId)?.instance_name}
          onLink={(lead) => {
            setLinkedLead(lead);
            toast.success('Lead vinculado!');
          }}
        />
      )}
    </div>
  );
}
