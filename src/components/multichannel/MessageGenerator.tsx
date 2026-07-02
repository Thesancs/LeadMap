'use client';

import { useState } from 'react';
import { Lead } from '@/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BriefcaseBusiness, Camera, Copy, Sparkles, Loader2, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MessageGeneratorProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  channel: 'instagram' | 'linkedin';
  template: string;
}

export default function MessageGenerator({
  lead,
  isOpen,
  onClose,
  channel,
  template
}: MessageGeneratorProps) {
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const generateWithAI = async () => {
    if (!lead) return;
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, template, channel }),
      });

      if (!response.ok) throw new Error('Falha ao gerar mensagem');
      const data = await response.json();
      setGeneratedMessage(data.message);
      setHasCopied(false);
    } catch (error) {
      toast.error('Erro ao gerar mensagem com IA');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedMessage);
      setHasCopied(true);
      toast.success('Mensagem copiada!');
      
      // Registrar log (Placeholder para Fase 2/3)
      await fetch(`/api/leads/${lead?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'contatado',
          channel: channel
        }),
      });
      
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      toast.error('Falha ao copiar');
    }
  };

  if (!lead) return null;

  const channelConfig = {
    instagram: {
      icon: <Camera className="h-6 w-6 text-pink-500" />,
      color: 'text-pink-500',
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/20',
      btn: 'bg-pink-600 hover:bg-pink-500',
      title: 'Instagram Outreach'
    },
    linkedin: {
      icon: <BriefcaseBusiness className="h-6 w-6 text-blue-500" />,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      btn: 'bg-blue-600 hover:bg-blue-500',
      title: 'LinkedIn Outreach'
    }
  }[channel];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-zinc-950 border-white/10 p-8 rounded-3xl">
        <DialogHeader className="space-y-3">
          <div className={`flex items-center gap-2 ${channelConfig.color} font-bold text-xs uppercase tracking-[0.2em]`}>
            <Sparkles className="h-4 w-4" />
            Personalização por IA
          </div>
          <DialogTitle className="text-3xl font-black text-white flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${channelConfig.bg} ${channelConfig.color}`}>
              {channelConfig.icon}
            </div>
            {channelConfig.title}
          </DialogTitle>
          <DialogDescription className="text-zinc-500 font-medium text-base">
            Gere uma abordagem estratégica para <span className="text-white font-bold">{lead.nome}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-8 space-y-6">
          {!generatedMessage ? (
            <Button 
              className={`w-full h-16 ${channelConfig.btn} text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 text-lg gap-3`}
              onClick={generateWithAI}
              disabled={isGenerating}
            >
              {isGenerating ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
              {isGenerating ? 'Analisando Lead...' : 'Gerar Mensagem Mágica'}
            </Button>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className={`bg-zinc-900/50 p-6 rounded-2xl border ${channelConfig.border} relative overflow-hidden`}>
                <div className={`absolute top-0 left-0 w-1 h-full ${channelConfig.bg.replace('/10', '')}`} />
                <p className="text-zinc-300 text-base italic leading-relaxed whitespace-pre-wrap">
                  &quot;{generatedMessage}&quot;
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  className="flex-1 h-12 rounded-xl border-white/10 bg-zinc-900 text-zinc-400 hover:text-white"
                  onClick={() => setGeneratedMessage('')}
                >
                  Refazer
                </Button>
                <Button 
                  className={`flex-[2] h-12 ${channelConfig.btn} text-white font-bold rounded-xl gap-2`}
                  onClick={copyToClipboard}
                >
                  {hasCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  {hasCopied ? 'Copiado!' : 'Copiar e Marcar como Contatado'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
