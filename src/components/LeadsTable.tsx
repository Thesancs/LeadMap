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
import { MessageSquare, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusSelect from './StatusSelect';
import WhatsAppModal from './WhatsAppModal';
import StarRating from './StarRating';

interface LeadsTableProps {
  leads: Lead[];
  onStatusChange: (id: string, newStatus: LeadStatus) => void;
  messageTemplate: string;
}

export default function LeadsTable({ leads, onStatusChange, messageTemplate }: LeadsTableProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleWhatsApp = (lead: Lead) => {
    if (!lead.telefone) return;
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleConfirmSend = () => {
    if (selectedLead && selectedLead.status === 'novo') {
      onStatusChange(selectedLead.id, 'contatado');
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
      <Table>
        <TableHeader>
          <TableRow className="border-white/5 hover:bg-transparent bg-zinc-900/40">
            <TableHead className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest h-12">Lead</TableHead>
            <TableHead className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest h-12">Cidade</TableHead>
            <TableHead className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest h-12">Avaliação</TableHead>
            <TableHead className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest h-12">Status</TableHead>
            <TableHead className="font-bold text-zinc-400 uppercase text-[10px] tracking-widest h-12 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id} className="border-white/5 hover:bg-white/5 transition-colors group">
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
                    <span className="font-bold text-zinc-100 group-hover:text-primary transition-colors">{lead.nome}</span>
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
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white h-9 rounded-xl transition-all"
                  disabled={!lead.telefone}
                  onClick={() => handleWhatsApp(lead)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <WhatsAppModal 
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        messageTemplate={messageTemplate}
        onConfirm={handleConfirmSend}
      />
    </div>
  );
}
