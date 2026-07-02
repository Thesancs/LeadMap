'use client';

import { WhatsAppMessage } from '@/types';
import { cn } from '@/lib/utils';
import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  message: WhatsAppMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isFromMe = message.key.fromMe;
  const date = new Date(message.messageTimestamp * 1000);
  const formattedDate = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  const text = message.message?.conversation || 
               message.message?.extendedTextMessage?.text ||
               message.message?.imageMessage?.caption ||
               message.message?.videoMessage?.caption ||
               message.message?.documentMessage?.caption ||
               'Mídia não suportada no momento.';

  return (
    <div className={cn(
      "flex w-full mb-2",
      isFromMe ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] md:max-w-[70%] px-4 py-2 rounded-2xl relative group",
        isFromMe 
          ? "bg-primary text-white rounded-tr-none" 
          : "bg-zinc-800 text-zinc-100 rounded-tl-none border border-white/5"
      )}>
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {text}
        </p>
        
        <div className={cn(
          "flex items-center gap-1.5 mt-1 justify-end",
          isFromMe ? "text-white/70" : "text-zinc-500"
        )}>
          <span className="text-[10px] font-medium">
            {formattedDate}
          </span>
          {isFromMe && (
            <div className="flex items-center">
              {message.status === 'READ' ? (
                <CheckCheck className="h-3 w-3 text-white" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
