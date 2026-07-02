'use client';

import { useCallback, useState, useEffect } from 'react';
import { Lead } from '@/types';
import { 
  Search, 
  UserPlus, 
  Check, 
  Loader2, 
  Phone,
  Building2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface LinkLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  remoteJid: string;
  instanceName?: string;
  onLink: (lead: Pick<Lead, 'id' | 'nome' | 'status'>) => void;
}

export default function LinkLeadModal({ isOpen, onClose, remoteJid, instanceName, onLink }: LinkLeadModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState<string | null>(null);

  const phone = remoteJid.split('@')[0];

  const searchLeads = useCallback(async (term: string) => {
    setIsLoading(true);
    try {
      // Simplificado: Busca todos e filtra localmente para o MVP
      // Em produção, isso deveria ser um endpoint de busca com filtros
      const response = await fetch('/api/leads');
      if (!response.ok) throw new Error('Falha ao buscar leads');
      const data = await response.json();
      const allLeads = data.leads || [];
      
      const filtered = allLeads.filter((l: Lead) => 
        l.nome.toLowerCase().includes(term.toLowerCase()) || 
        (l.telefone && l.telefone.includes(term))
      );
      
      setLeads(filtered);
    } catch (error) {
      toast.error('Erro ao buscar leads');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void Promise.resolve().then(() => {
        setSearchTerm(phone);
        searchLeads(phone);
      });
    }
  }, [isOpen, phone, searchLeads]);

  const handleLink = async (leadId: string) => {
    setIsLinking(leadId);
    try {
      const response = await fetch('/api/whatsapp/link', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remoteJid, leadId, instanceName })
      });
      
      if (!response.ok) throw new Error('Falha ao vincular');
      const data = await response.json();
      
      toast.success('Lead vinculado com sucesso!');
      onLink(data.lead);
      onClose();
    } catch (error) {
      toast.error('Erro ao vincular lead');
    } finally {
      setIsLinking(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-white/5 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-black flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Vincular ao CRM
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Nome ou telefone do lead..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchLeads(searchTerm)}
              className="w-full bg-zinc-900 border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => searchLeads(searchTerm)}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 hover:bg-white/5"
            >
              Buscar
            </Button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/5">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary opacity-50" />
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 italic text-sm">
                Nenhum lead encontrado com esse critério.
              </div>
            ) : (
              leads.map((lead) => (
                <div 
                  key={lead.id} 
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3 text-zinc-500" />
                      <p className="text-sm font-bold truncate">{lead.nome}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-3 w-3 text-zinc-500" />
                      <p className="text-xs text-zinc-500 truncate">{lead.telefone || 'Sem telefone'}</p>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    disabled={!!isLinking}
                    onClick={() => handleLink(lead.id)}
                    className="ml-4 rounded-lg h-8 px-3 text-xs"
                  >
                    {isLinking === lead.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Vincular
                      </>
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="rounded-xl h-10">
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
