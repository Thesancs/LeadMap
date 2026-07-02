'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Zap, Sparkles, Loader2, RefreshCcw, ShieldCheck, ShieldAlert, Ban } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_WHATSAPP_TEMPLATE = 'Oi, tudo bem? Vi o {nome} no Google e queria te mostrar uma ideia simples para automatizar o atendimento no WhatsApp e responder clientes mais rapido.';

type InstanceRisk = 'healthy' | 'warning' | 'blocked';

interface InstanceHealth {
  id: string;
  instance_name: string;
  display_name: string;
  status: 'open' | 'close' | 'connecting';
  daily_limit: number;
  warmup_started_at: string | null;
  warmup_days_current: number;
  warmup_days_total: number;
  sent_today: number;
  avg_7d: number;
  pct_limit: number;
  risk: InstanceRisk;
}

interface WhatsAppModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  messageTemplate: string;
  onConfirm: () => void;
}

function phoneToRemoteJid(phone: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  const normalizedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  return `${normalizedPhone}@s.whatsapp.net`;
}

function riskLabel(risk: InstanceRisk) {
  if (risk === 'healthy') return 'Saudável';
  if (risk === 'warning') return 'Atenção';
  return 'Alto risco';
}

function instanceLabel(instance: InstanceHealth) {
  if (instance.status !== 'open') return 'Indisponivel';
  return riskLabel(instance.risk);
}

function disabledReason(instance: InstanceHealth) {
  if (instance.status !== 'open') return 'Conecte este numero antes de enviar.';
  if (instance.sent_today >= instance.daily_limit) return 'Limite diario atingido.';
  if (instance.risk === 'blocked') return 'Risco alto de bloqueio.';
  return null;
}

function RiskIcon({ risk, status }: { risk: InstanceRisk; status: InstanceHealth['status'] }) {
  if (status !== 'open') return <Ban className="h-4 w-4 text-zinc-500" />;
  if (risk === 'healthy') return <ShieldCheck className="h-4 w-4 text-emerald-400" />;
  if (risk === 'warning') return <ShieldAlert className="h-4 w-4 text-yellow-400" />;
  return <Ban className="h-4 w-4 text-red-400" />;
}

function InstanceHealthTooltip({ instance }: { instance: InstanceHealth }) {
  return (
    <div className="pointer-events-none absolute left-0 bottom-[calc(100%+10px)] z-70 w-[min(28rem,calc(100vw-4rem))] rounded-2xl border border-white/10 bg-zinc-900 p-4 shadow-2xl opacity-0 -translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <RiskIcon risk={instance.risk} status={instance.status} />
          <span className="font-bold text-zinc-100">{instanceLabel(instance)}</span>
        </div>
        <span className="text-xs uppercase tracking-wider text-zinc-500">{instance.status}</span>
      </div>
      {disabledReason(instance) && (
        <p className="text-xs text-zinc-500 mt-3">{disabledReason(instance)}</p>
      )}
      {instance.warmup_started_at && (
        <p className="text-xs text-cyan-400 mt-3">
          Warmup ativo: dia {instance.warmup_days_current} de {instance.warmup_days_total}. Limite atual: {instance.daily_limit} mensagens por dia.
        </p>
      )}
      <div className="grid grid-cols-3 gap-3 mt-4 text-center">
        <div className="rounded-xl bg-zinc-950/60 p-3">
          <p className="text-lg font-black text-white">{instance.sent_today}</p>
          <p className="text-[10px] uppercase text-zinc-500">Hoje</p>
        </div>
        <div className="rounded-xl bg-zinc-950/60 p-3">
          <p className="text-lg font-black text-white">{instance.daily_limit}</p>
          <p className="text-[10px] uppercase text-zinc-500">Limite</p>
        </div>
        <div className="rounded-xl bg-zinc-950/60 p-3">
          <p className="text-lg font-black text-white">{instance.avg_7d}</p>
          <p className="text-[10px] uppercase text-zinc-500">Media 7d</p>
        </div>
      </div>
    </div>
  );
}

export default function WhatsAppModal({
  lead,
  isOpen,
  onClose,
  messageTemplate = '',
  onConfirm,
}: WhatsAppModalProps) {
  const [message, setMessage] = useState('');
  const [instances, setInstances] = useState<InstanceHealth[]>([]);
  const [selectedInstance, setSelectedInstance] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingInstances, setIsLoadingInstances] = useState(false);
  const [isSending, setIsSending] = useState(false);


  const template = useMemo(
    () => messageTemplate.trim() || DEFAULT_WHATSAPP_TEMPLATE,
    [messageTemplate],
  );

  useEffect(() => {
    if (!lead || !isOpen) return;
    queueMicrotask(() => {
      setMessage(template.replace(/{nome}/g, lead.nome || ''));
      setSelectedInstance('');
    });
  }, [isOpen, lead, template]);

  useEffect(() => {
    if (!isOpen) return;

    async function loadInstances() {
      setIsLoadingInstances(true);
      try {
        const response = await fetch('/api/whatsapp/health');
        if (!response.ok) throw new Error('Falha ao carregar instâncias');
        const data = await response.json();
        const available = (data.instances ?? []) as InstanceHealth[];
        setInstances(available);
        const firstHealthy = available.find(instance => instance.risk === 'healthy' && instance.status === 'open');
        if (firstHealthy) setSelectedInstance(firstHealthy.instance_name);
      } catch {
        toast.error('Erro ao carregar números conectados');
      } finally {
        setIsLoadingInstances(false);
      }
    }

    void loadInstances();
  }, [isOpen]);

  const selectedHealth = instances.find(instance => instance.instance_name === selectedInstance) ?? null;

  const extractGeneratedMessage = (data: unknown) => {
    if (!data || typeof data !== 'object') return '';
    const record = data as Record<string, unknown>;
    const generated = record.message ?? record.text ?? record.content;
    return typeof generated === 'string' ? generated : '';
  };

  const generateWithAI = async () => {
    if (!lead) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead,
          template,
          channel: 'whatsapp'
        }),
      });

      if (!response.ok) throw new Error('Falha ao gerar mensagem');
      const data = await response.json();
      const generatedMessage = extractGeneratedMessage(data);
      if (!generatedMessage) throw new Error('Resposta da IA sem mensagem');
      setMessage(generatedMessage);
      toast.success('Mensagem personalizada por IA!');
    } catch {
      toast.error('Erro ao gerar com IA');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!lead?.telefone || !selectedInstance || !message.trim()) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/whatsapp/send/${selectedInstance}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: lead.telefone,
          text: message,
          remoteJid: phoneToRemoteJid(lead.telefone),
          leadId: lead.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao enviar mensagem');

      toast.success('Mensagem enviada pelo WhatsApp');
      onConfirm();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-zinc-950 border-white/10 p-8 rounded-3xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-[0.2em]">
            <Zap className="h-4 w-4" />
            Envio direto
          </div>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-3xl font-black text-white flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <MessageSquare className="h-6 w-6" />
              </div>
              WhatsApp
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={generateWithAI}
              disabled={isGenerating || isSending}
              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 gap-2 rounded-xl"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating ? 'IA Pensando...' : 'Melhorar com IA'}
            </Button>
          </div>
          <DialogDescription className="text-zinc-500 font-medium text-base">
            Revise a mensagem e escolha qual número conectado fará o envio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Mensagem</label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-zinc-500 hover:text-zinc-300"
                onClick={() => setMessage(template.replace(/{nome}/g, lead.nome || ''))}
              >
                <RefreshCcw className="h-3 w-3 mr-1" />
                Restaurar
              </Button>
            </div>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={6}
              className="bg-zinc-900/70 border-white/10 text-zinc-100 rounded-2xl resize-none"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Número de envio</label>
              {selectedHealth && (
                <span className="text-xs text-zinc-500">
                  {selectedHealth.sent_today}/{selectedHealth.daily_limit} mensagens hoje
                </span>
              )}
            </div>

            {isLoadingInstances ? (
              <div className="flex items-center gap-2 text-zinc-500 text-sm p-4 border border-white/5 rounded-2xl bg-zinc-900/40">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando números...
              </div>
            ) : instances.length === 0 ? (
              <div className="text-sm text-zinc-500 p-4 border border-white/5 rounded-2xl bg-zinc-900/40">
                Nenhum número conectado encontrado.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {instances.map((instance) => {
                  const reason = disabledReason(instance);
                  const disabled = Boolean(reason);
                  const selected = selectedInstance === instance.instance_name;

                  return (
                    <button
                      key={instance.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedInstance(instance.instance_name)}
                      className={`group relative text-left rounded-2xl border p-4 transition-all disabled:opacity-40 disabled:cursor-not-allowed overflow-visible ${
                        selected
                          ? 'border-cyan-400/60 bg-cyan-400/10'
                          : 'border-white/5 bg-zinc-900/50 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-zinc-100">{instance.display_name}</p>
                          <p className="text-xs text-zinc-500 mt-1">{instance.instance_name}</p>
                        </div>
                        <RiskIcon risk={instance.risk} status={instance.status} />
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <Badge className="rounded-full bg-zinc-800 text-zinc-300 border-white/5">
                          {instanceLabel(instance)}
                        </Badge>
                        <span className="text-xs text-zinc-500">{instance.pct_limit}% do limite</span>
                      </div>
                      {instance.warmup_started_at && (
                        <p className="text-[11px] text-cyan-400 mt-3">
                          Warmup dia {instance.warmup_days_current}/{instance.warmup_days_total}
                        </p>
                      )}
                      {reason && (
                        <p className="text-[11px] text-zinc-500 mt-3">{reason}</p>
                      )}
                      <InstanceHealthTooltip instance={instance} />
                    </button>
                  );
                })}
              </div>
            )}

          </div>
        </div>

        <DialogFooter className="mt-8 gap-3 sm:gap-0">
          <Button
            variant="ghost"
            className="flex-1 h-12 rounded-xl font-bold text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
            onClick={onClose}
            disabled={isSending}
          >
            Cancelar
          </Button>
          <Button
            className="flex-[2] h-12 bg-cyan-500 hover:bg-cyan-400 text-cyan-950 font-black rounded-xl shadow-lg shadow-cyan-500/20 gap-2"
            onClick={handleSend}
            disabled={isSending || !selectedInstance || !message.trim() || !lead.telefone}
          >
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            Enviar mensagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
