'use client';

import { useState, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageInputProps {
  onSend: (text: string) => Promise<void> | void;
  disabled?: boolean;
  draftText?: string;
}

export default function MessageInput({ onSend, disabled, draftText = '' }: MessageInputProps) {
  const [text, setText] = useState(draftText);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim() || disabled || isSending) return;

    setIsSending(true);
    try {
      await onSend(text);
      setText('');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="p-4 bg-zinc-950/80 border-t border-white/5 backdrop-blur-md">
      <div className="flex items-end gap-3 max-w-5xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            rows={1}
            placeholder="Digite uma mensagem..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="w-full bg-zinc-900 border-white/5 rounded-2xl py-3 px-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none min-h-[46px] max-h-32 scrollbar-hide"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />
        </div>
        
        <Button 
          onClick={() => void handleSend()}
          disabled={!text.trim() || disabled || isSending}
          className="h-[46px] w-[46px] rounded-full p-0 shrink-0 shadow-lg shadow-primary/20"
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
