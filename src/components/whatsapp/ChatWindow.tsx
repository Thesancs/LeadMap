'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Lead, WhatsAppChat, WhatsAppMessage } from '@/types';
import { User, Link, Loader2 } from 'lucide-react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { Button } from '@/components/ui/button';
import { getChatDisplayName } from '@/lib/whatsapp-utils';

interface ChatWindowProps {
  chat: WhatsAppChat | null;
  messages: WhatsAppMessage[];
  isLoading: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onSendMessage: (text: string) => Promise<void> | void;
  onLinkLead: () => void;
  linkedLead?: Pick<Lead, 'id' | 'nome' | 'status'> | null;
  draftMessage?: string;
  isDraftChat?: boolean;
}

export default function ChatWindow({
  chat,
  messages,
  isLoading,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onSendMessage,
  onLinkLead,
  linkedLead,
  draftMessage,
  isDraftChat,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const displayName = chat ? getChatDisplayName(chat) : '';

  useEffect(() => {
    if (!scrollRef.current) return;
    if (isLoadingMore) {
      prevScrollHeightRef.current = scrollRef.current.scrollHeight;
    } else if (prevScrollHeightRef.current > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = 0;
    }
    loadingMoreRef.current = isLoadingMore ?? false;
  }, [isLoadingMore]);

  const lastMessageId = messages[messages.length - 1]?.key.id;
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lastMessageId]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !onLoadMore || !hasMore || loadingMoreRef.current) return;
    if (scrollRef.current.scrollTop < 100) {
      loadingMoreRef.current = true;
      onLoadMore();
    }
  }, [onLoadMore, hasMore]);

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950/20 text-center p-6">
        <div className="h-20 w-20 rounded-full bg-zinc-900 flex items-center justify-center mb-4 border border-white/5">
          <User className="h-10 w-10 text-zinc-700" />
        </div>
        <h3 className="text-xl font-bold text-zinc-300">Nenhuma conversa selecionada</h3>
        <p className="text-zinc-600 max-w-xs mt-2">
          Selecione uma instância e um chat para começar a conversar em tempo real.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-950/20 relative">
      <div className="p-4 border-b border-white/5 bg-zinc-950/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5 overflow-hidden">
            {chat.profilePicUrl ? (
              <img src={chat.profilePicUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <User className="h-6 w-6 text-zinc-500" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-zinc-100">{displayName}</h3>
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
              {chat.remoteJid}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {linkedLead && (
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-zinc-100">{linkedLead.nome}</p>
              <p className="text-[10px] uppercase tracking-wider text-primary">{linkedLead.status.replace('_', ' ')}</p>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onLinkLead}
            className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 hover:text-primary rounded-xl gap-2 h-9"
          >
            <Link className="h-4 w-4" />
            {linkedLead ? 'Alterar Lead' : 'Vincular Lead'}
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 scrollbar-thin scrollbar-thumb-white/5"
      >
        {/* Load-more indicator at top */}
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary opacity-50" />
          </div>
        )}

        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
          </div>
        ) : isDraftChat ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
            <p className="text-sm text-zinc-500">Nova conversa. A mensagem esta pronta no rascunho.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
            <p className="text-sm text-zinc-500">Nenhuma mensagem encontrada nesta conversa.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.key.id} message={msg} />
          ))
        )}
      </div>

      <MessageInput
        key={`${chat.remoteJid}:${draftMessage || 'empty'}`}
        onSend={onSendMessage}
        disabled={isLoading}
        draftText={draftMessage}
      />
    </div>
  );
}
