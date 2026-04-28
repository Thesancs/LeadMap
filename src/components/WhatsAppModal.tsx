'use client';

import { Lead } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Zap } from 'lucide-react';

interface WhatsAppModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  messageTemplate: string;
  onConfirm: () => void;
}

export default function WhatsAppModal({ 
  lead, 
  isOpen, 
  onClose, 
  messageTemplate,
  onConfirm 
}: WhatsAppModalProps) {
  if (!lead) return null;

  const personalizedMessage = messageTemplate.replace(/{nome}/g, lead.nome);

  const handleSend = () => {
    if (!lead.telefone) return;
    const cleanPhone = lead.telefone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const encodedMessage = encodeURIComponent(personalizedMessage);
    const url = `https://wa.me/${formattedPhone}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
    window.open(url, '_blank');
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-zinc-950 border-white/10 p-8 rounded-3xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-[0.2em]">
            <Zap className="h-4 w-4" />
            Ação Instantânea
          </div>
          <DialogTitle className="text-3xl font-black text-white flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
              <MessageSquare className="h-6 w-6" />
            </div>
            WhatsApp Preview
          </DialogTitle>
          <DialogDescription className="text-zinc-500 font-medium text-base">
            Revise a mensagem personalizada antes de iniciar o contato com <span className="text-white font-bold">{lead.nome}</span>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 mt-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
          <p className="text-zinc-300 text-base italic leading-relaxed">
            &quot;{personalizedMessage}&quot;
          </p>
        </div>

        <div className="flex items-center gap-3 mt-6 p-4 bg-cyan-500/5 text-cyan-400 rounded-2xl text-xs font-bold border border-cyan-500/10">
          <Send className="h-4 w-4" />
          <span>O sistema abrirá o WhatsApp Web configurado para este número automaticamente.</span>
        </div>

        <DialogFooter className="mt-8 gap-3 sm:gap-0">
          <Button 
            variant="ghost" 
            className="flex-1 h-12 rounded-xl font-bold text-zinc-500 hover:text-zinc-200 hover:bg-white/5" 
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button 
            className="flex-[2] h-12 bg-cyan-500 hover:bg-cyan-400 text-cyan-950 font-black rounded-xl shadow-lg shadow-cyan-500/20"
            onClick={handleSend}
          >
            Confirmar e Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
