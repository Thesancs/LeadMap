'use client';

import { useState, useEffect, use } from 'react';
import { Lead } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Image as ImageIcon,
  MapPin, 
  Globe, 
  Phone, 
  Clock, 
  StickyNote,
  Zap,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import StarRating from '@/components/StarRating';
import StatusSelect from '@/components/StatusSelect';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadLead() {
      try {
        const response = await fetch(`/api/leads/${id}`);
        if (!response.ok) throw new Error('Lead não encontrado');
        const data = await response.json();
        setLead(data.lead);
        setNotes(data.lead.notes || '');
      } catch (error) {
        toast.error('Erro ao carregar lead');
      } finally {
        setIsLoading(false);
      }
    }
    loadLead();
  }, [id]);

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (!response.ok) throw new Error('Erro ao salvar');
      toast.success('Notas atualizadas!');
    } catch (error) {
      toast.error('Erro ao salvar notas');
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (status: Lead['status']) => {
    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Erro ao atualizar status');
      setLead(prev => prev ? { ...prev, status } : null);
      toast.success('Status atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  if (isLoading) return <div className="flex justify-center py-20 animate-pulse text-zinc-500">Carregando detalhes...</div>;
  if (!lead) return <div className="text-center py-20 text-zinc-500">Lead não encontrado.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 px-4 pt-6">
      <Link href="/leads" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group w-fit">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Voltar para a lista
      </Link>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Lado Esquerdo: Informações Principais */}
        <div className="flex-1 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-4">
                {lead.categoria || 'Sem categoria'}
              </Badge>
              <div className="h-1 w-1 rounded-full bg-zinc-800" />
              <span className="text-zinc-500 text-sm font-medium">Captado em {new Date(lead.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
              {lead.nome}
            </h1>
            <div className="flex flex-wrap gap-4">
               {lead.rating && (
                <div className="flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-2xl border border-white/5 shadow-xl">
                  <StarRating rating={lead.rating} />
                  <span className="text-cyan-400 font-black text-lg">{lead.rating}</span>
                  <span className="text-zinc-600 text-xs">({lead.total_reviews} reviews)</span>
                </div>
               )}
               <div className="bg-zinc-900 px-4 py-2 rounded-2xl border border-white/5 shadow-xl flex items-center gap-2">
                 <StatusSelect value={lead.status} onChange={updateStatus} />
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-zinc-900/30 border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-zinc-800 text-zinc-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs font-bold uppercase mb-1">Endereço</p>
                    <p className="text-zinc-200 text-sm">{lead.endereco || 'Não informado'}</p>
                    <p className="text-zinc-500 text-xs mt-1">{lead.cidade}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-zinc-800 text-zinc-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs font-bold uppercase mb-1">WhatsApp / Telefone</p>
                    <p className="text-zinc-200 text-lg font-bold">{lead.telefone || 'Sem número'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/30 border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-zinc-800 text-zinc-400">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs font-bold uppercase mb-1">Website</p>
                    {lead.site ? (
                      <a href={lead.site} target="_blank" className="text-cyan-400 hover:underline flex items-center gap-1 font-medium break-all">
                        {lead.site.replace('https://', '').replace('www.', '')}
                        <ChevronRight className="h-4 w-4" />
                      </a>
                    ) : (
                      <p className="text-zinc-600">Não possui site</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-zinc-800 text-zinc-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs font-bold uppercase mb-1">Horário</p>
                    <p className="text-zinc-200 text-sm italic">{lead.horario_abertura || 'Horário não disponível'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-zinc-500" />
              Fotos do Google
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {lead.fotos && lead.fotos.length > 0 ? (
                lead.fotos.map((foto: string, i: number) => (
                  <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-white/5 bg-zinc-900 group">
                    <img src={foto} alt={`${lead.nome} - ${i}`} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                ))
              ) : (
                <div className="col-span-full py-10 bg-zinc-900/20 rounded-2xl border border-dashed border-white/5 text-center text-zinc-600 text-sm italic">
                  Nenhuma foto disponível
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lado Direito: Notas e Gestão */}
        <div className="lg:w-80 space-y-6">
          <Card className="bg-zinc-900/50 border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="border-b border-white/5 bg-white/5">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-yellow-500" />
                Notas do SDR
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre a conversa, dores do cliente ou pontos de atenção..."
                className="min-h-[200px] bg-zinc-950 border-white/10 text-white rounded-xl focus:ring-yellow-500/50 text-sm"
              />
              <Button 
                onClick={handleSaveNotes} 
                disabled={isSaving}
                className="w-full bg-zinc-100 hover:bg-white text-black font-bold rounded-xl"
              >
                {isSaving ? 'Salvando...' : 'Salvar Notas'}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/10 rounded-3xl overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                <Zap className="h-4 w-4" />
                Próximos Passos
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Este lead ainda não possui uma análise de fit gerada por IA (Fase 3). 
                Use os botões de abordagem na lista para iniciar o contato.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
