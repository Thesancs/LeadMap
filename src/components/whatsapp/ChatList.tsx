'use client';

import { WhatsAppChat } from '@/types';
import { Search, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getChatDisplayName } from '@/lib/whatsapp-utils';

interface ChatListProps {
  chats: WhatsAppChat[];
  activeChatJid: string | null;
  onSelect: (jid: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  isLoading?: boolean;
}

function formatChatDate(timestamp: number, today: Date, yesterday: Date): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '';

  const date = new Date(timestamp * 1000);
  if (Number.isNaN(date.getTime())) return '';

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return 'Ontem';
  }

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function ChatList({
  chats,
  activeChatJid,
  onSelect,
  searchTerm,
  onSearchChange,
  isLoading = false,
}: ChatListProps) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  return (
    <div className="w-full md:w-80 border-r border-white/5 flex flex-col bg-zinc-950/30">
      <div className="p-4 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar conversa..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-zinc-900 border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary opacity-50" />
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <p className="text-zinc-500 text-sm">Nenhuma conversa encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {chats.map((chat) => {
              if (!chat.remoteJid) return null;
              
              const isActive = activeChatJid === chat.remoteJid;
              const formattedDate = formatChatDate(chat.messageTimestamp, today, yesterday);
              const displayName = getChatDisplayName(chat);
              
              const lastMessage = chat.lastMessage?.message?.conversation || 
                                 chat.lastMessage?.message?.extendedTextMessage?.text || 
                                 'Mídia/Outro';
              
              return (
                <button
                  key={chat.remoteJid}
                  onClick={() => onSelect(chat.remoteJid)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 transition-colors text-left",
                    isActive ? "bg-white/5" : "hover:bg-white/[0.02]"
                  )}
                >
                  <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 border border-white/5 overflow-hidden">
                    {chat.profilePicUrl ? (
                      <img src={chat.profilePicUrl} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-zinc-500" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className={cn(
                        "text-sm font-bold truncate",
                        isActive ? "text-primary" : "text-zinc-100"
                      )}>
                        {displayName}
                      </p>
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {formattedDate}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate line-clamp-1">
                      {lastMessage}
                    </p>
                  </div>
                  
                  {chat.unreadCount > 0 && (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <span className="text-[10px] text-white font-bold">{chat.unreadCount}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
