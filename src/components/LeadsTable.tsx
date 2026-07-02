'use client';

import { useState } from 'react';
import { Lead, LeadStatus } from '@/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { BriefcaseBusiness, Camera, MessageSquare, ExternalLink, Image as ImageIcon, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import StatusSelect from './StatusSelect';
import WhatsAppModal from './WhatsAppModal';
import MessageGenerator from './multichannel/MessageGenerator';
import Link from 'next/link';
import StarRating from './StarRating';

interface LeadsTableProps {
  leads: Lead[];
  onStatusChange: (id: string, newStatus: LeadStatus) => void;
  config: Record<string, string>;
}

export default function LeadsTable({ leads, onStatusChange, config }: LeadsTableProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isWAModalOpen, setIsWAModalOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [activeChannel, setActiveChannel] = useState<'instagram' | 'linkedin'>('instagram');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCampaignOpen, setIsCampaignOpen] = useState(false);
  const [campaignMessage, setCampaignMessage] = useState(config.mensagem_padrao || '');
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  const [campaignResult, setCampaignResult] = useState<string | null>(null);
  
  const handleWhatsApp = (lead: Lead) => {
    setSelectedLead(lead);
    setIsWAModalOpen(true);
  };

  const handleMultichannel = (lead: Lead, channel: 'instagram' | 'linkedin') => {
    setSelectedLead(lead);
    setActiveChannel(channel);
    setIsGeneratorOpen(true);
  };

  const handleConfirmSend = () => {
    if (selectedLead && selectedLead.status === 'novo') {
      onStatusChange(selectedLead.id, 'contatado');
    }
  };

  const selectedLeads = leads.filter(lead => selectedIds.has(lead.id));
  const selectableLeads = leads.filter(lead => Boolean(lead.telefone));

  const toggleLead = (lead: Lead) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(lead.id)) next.delete(lead.id);
      else next.add(lead.id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(prev => {
      if (selectableLeads.every(lead => prev.has(lead.id))) return new Set();
      return new Set(selectableLeads.map(lead => lead.id));
    });
  };

  const handleCampaignSend = async () => {
    setIsSendingCampaign(true);
    setCampaignResult(null);
    try {
      const response = await fetch('/api/whatsapp/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
        body: JSON.stringify({ lead_ids: Array.from(selectedIds), message: campaignMessage }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Falha ao enviar campanha');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalSummary: { sent: number; failed: number; skipped: number; total: number } | null = null;

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === 'start') {
            setCampaignResult(`Preparando ${event.total} envios...`);
          }
          if (event.type === 'progress' || event.type === 'done') {
            finalSummary = event;
            setCampaignResult(`${event.processed ?? event.total}/${event.total} processados: ${event.sent} enviados, ${event.failed} falharam, ${event.skipped} ignorados.`);
          }
        }
      }

      selectedLeads.forEach(lead => {
        if (lead.status === 'novo') onStatusChange(lead.id, 'contatado');
      });
      setSelectedIds(new Set());
      if (finalSummary) {
        setCampaignResult(`${finalSummary.sent} enviados, ${finalSummary.failed} falharam, ${finalSummary.skipped} ignorados.`);
      }
    } catch (error) {
      setCampaignResult(error instanceof Error ? error.message : 'Falha ao enviar campanha');
    } finally {
      setIsSendingCampaign(false);
    }
  };

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500 bg-zinc-900/10">
        <p className="font-medium">Nenhum lead encontrado.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b border-white/5 bg-zinc-950/70">
          <span className="text-sm font-bold text-zinc-300">{selectedIds.size} leads selecionados</span>
          <Button
            className="rounded-xl gap-2"
            onClick={() => {
              setCampaignMessage(config.mensagem_padrao || '');
              setCampaignResult(null);
              setIsCampaignOpen(true);
            }}
          >
            <Send className="h-4 w-4" />
            Enviar campanha
          </Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow className="border-white/5 hover:bg-transparent bg-zinc-900/40">
            <TableHead className="w-12 h-12">
              <input
                type="checkbox"
                aria-label="Selecionar todos"
                checked={selectableLeads.length > 0 && selectableLeads.every(lead => selectedIds.has(lead.id))}
                onChange={toggleAll}
                className="h-4 w-4 accent-primary"
              />
            </TableHead>
            <TableHead className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest h-12">Lead</TableHead>
            <TableHead className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest h-12">Cidade</TableHead>
            <TableHead className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest h-12">Avaliação</TableHead>
            <TableHead className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest h-12">Status</TableHead>
            <TableHead className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest h-12 text-right">Abordagem Multicanal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id} className="border-white/5 hover:bg-white/5 transition-colors group">
              <TableCell>
                <input
                  type="checkbox"
                  aria-label={`Selecionar ${lead.nome}`}
                  checked={selectedIds.has(lead.id)}
                  disabled={!lead.telefone}
                  onChange={() => toggleLead(lead)}
                  className="h-4 w-4 accent-primary disabled:opacity-30"
                />
              </TableCell>
              <TableCell className="py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0 border border-white/5">
                    {lead.fotos && lead.fotos.length > 0 ? (
                      <img src={lead.fotos[0]} alt={lead.nome} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-zinc-600" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <Link href={`/leads/${lead.id}`}>
                      <span className="font-bold text-zinc-100 group-hover:text-primary transition-colors cursor-pointer">{lead.nome}</span>
                    </Link>
                    {lead.site && (
                      <a 
                        href={lead.site} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[10px] text-zinc-500 flex items-center gap-0.5 hover:text-blue-400 hover:underline"
                      >
                        Website <ExternalLink className="h-2 w-2" />
                      </a>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-zinc-400 text-sm">{lead.cidade || '-'}</TableCell>
              <TableCell>
                {lead.rating ? (
                  <div className="flex items-center gap-2 bg-zinc-900/50 w-fit px-3 py-1 rounded-full border border-white/5">
                    <StarRating rating={lead.rating} />
                    <span className="text-cyan-400 font-black text-xs">{lead.rating}</span>
                  </div>
                ) : '-'}
              </TableCell>
              <TableCell>
                <StatusSelect 
                  value={lead.status} 
                  onChange={(newStatus) => onStatusChange(lead.id, newStatus)} 
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="bg-pink-500/5 text-pink-500 border-pink-500/20 hover:bg-pink-500 hover:text-white h-9 w-9 rounded-xl transition-all"
                    title="Instagram"
                    onClick={() => handleMultichannel(lead, 'instagram')}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="bg-blue-500/5 text-blue-500 border-blue-500/20 hover:bg-blue-600 hover:text-white h-9 w-9 rounded-xl transition-all"
                    title="LinkedIn"
                    onClick={() => handleMultichannel(lead, 'linkedin')}
                  >
                    <BriefcaseBusiness className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white h-9 rounded-xl transition-all px-4"
                    disabled={!lead.telefone}
                    onClick={() => handleWhatsApp(lead)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <WhatsAppModal 
        lead={selectedLead}
        isOpen={isWAModalOpen}
        onClose={() => setIsWAModalOpen(false)}
        messageTemplate={config.mensagem_padrao || ''}
        onConfirm={handleConfirmSend}
      />

      <MessageGenerator
        lead={selectedLead}
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        channel={activeChannel}
        template={activeChannel === 'instagram' ? config.ig_template : config.li_template}
      />

      <Dialog open={isCampaignOpen} onOpenChange={setIsCampaignOpen}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Campanha WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-zinc-500">{selectedIds.size} leads com telefone serão enviados via round-robin.</p>
            <Textarea
              value={campaignMessage}
              onChange={(event) => setCampaignMessage(event.target.value)}
              rows={7}
              className="bg-zinc-900 border-white/10 text-zinc-100"
            />
            {campaignResult && (
              <p className="text-sm font-medium text-zinc-300">{campaignResult}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCampaignOpen(false)} className="rounded-xl">
              Fechar
            </Button>
            <Button onClick={handleCampaignSend} disabled={isSendingCampaign || !campaignMessage.trim()} className="rounded-xl gap-2">
              {isSendingCampaign ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
