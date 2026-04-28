'use client';

import { useState, useEffect } from 'react';
import { PlaceResult, LeadStats, LeadStatus } from '@/types';
import SearchModal from '@/components/SearchModal';
import PlaceList from '@/components/PlaceList';
import StatsBar from '@/components/StatsBar';
import WhatsAppModal from '@/components/WhatsAppModal';
import { toast } from 'sonner';
import { Info, Sparkles, LayoutDashboard } from 'lucide-react';

export default function DashboardPage() {
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [searchStats, setSearchStats] = useState({ total_found: 0, filtered_out: 0 });
  const [messageTemplate, setMessageTemplate] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [globalStats, setGlobalStats] = useState<LeadStats>({
    buscados: 0,
    salvos: 0,
    novos: 0,
    contatados: 0,
    fechados: 0,
    respondidos: 0,
    requisicoes: 0
  });

  const fetchStatsAndConfig = async () => {
    try {
      const [statsRes, configRes] = await Promise.all([
        fetch('/api/leads/stats'),
        fetch('/api/config')
      ]);
      
      if (statsRes.ok) {
        const data = await statsRes.json();
        setGlobalStats(data);
      }
      if (configRes.ok) {
        const data = await configRes.json();
        setMessageTemplate(data.mensagem);
      }
    } catch (err) {
      console.error('Erro ao buscar dados iniciais', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStatsAndConfig();

    // Recuperar última pesquisa do localStorage
    const savedResults = localStorage.getItem('last_search_results');
    const savedStats = localStorage.getItem('last_search_stats');
    if (savedResults) {
      try {
        setResults(JSON.parse(savedResults));
      } catch (e) {
        console.error('Erro ao carregar resultados salvos', e);
      }
    }
    if (savedStats) {
      try {
        setSearchStats(JSON.parse(savedStats));
      } catch (e) {
        console.error('Erro ao carregar stats salvos', e);
      }
    }
  }, []);

  const handleSearch = async (data: { 
    setor: string; 
    cidade: string; 
    minStars: string; 
    quantidade: string;
    horaInicio: string;
    horaFim: string;
  }) => {
    setIsLoading(true);
    setResults([]);
    try {
      const response = await fetch('/api/places/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Falha ao buscar locais');

      const resData = await response.json();
      setResults(resData.places);
      setSearchStats({ total_found: resData.total_found, filtered_out: resData.filtered_out });
      
      // Salvar no localStorage
      localStorage.setItem('last_search_results', JSON.stringify(resData.places));
      localStorage.setItem('last_search_stats', JSON.stringify({ 
        total_found: resData.total_found, 
        filtered_out: resData.filtered_out 
      }));

      if (resData.places.length === 0) {
        toast.info('Nenhum lead novo encontrado.');
      } else {
        toast.success(`${resData.places.length} novos leads encontrados!`);
      }
      fetchStatsAndConfig(); // Atualizar contador de buscas
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao realizar busca';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (place: PlaceResult, status: LeadStatus = 'novo') => {
    setProcessingIds(prev => new Set(prev).add(place.place_id));
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...place, status }),
      });

      if (!response.ok) throw new Error(`Falha ao salvar lead`);

      setResults(prev => {
        const next = prev.filter(r => r.place_id !== place.place_id);
        localStorage.setItem('last_search_results', JSON.stringify(next));
        return next;
      });
      
      const successMessages: Record<string, string> = {
        novo: 'Lead salvo com sucesso!',
        excluido: 'Lead ignorado.',
        contatado: 'Lead marcado como contatado!'
      };
      toast.success(successMessages[status] || 'Lead atualizado!');
      fetchStatsAndConfig(); // Atualizar stats após salvar
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar lead');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(place.place_id);
        return next;
      });
    }
  };

  const handleWhatsApp = (place: PlaceResult) => {
    if (!place.telefone) {
      toast.error('Este estabelecimento não possui telefone cadastrado.');
      return;
    }
    setSelectedPlace(place);
    setIsMsgModalOpen(true);
  };

  const handleConfirmWhatsApp = () => {
    if (selectedPlace) {
      handleSave(selectedPlace, 'contatado');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4">
      {/* Header Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
            <LayoutDashboard className="h-4 w-4" />
            LeadMap Analytics
          </div>
          <h1 className="text-4xl md:text-5xl font-black gradient-text">
            Dashboard
          </h1>
          <p className="text-zinc-500 max-w-lg">
            Monitore seus resultados e prospecte novos negócios em tempo real com inteligência artificial.
          </p>
        </div>
        
        <div className="flex shrink-0">
          <SearchModal onSearch={handleSearch} isLoading={isLoading} />
        </div>
      </div>

      {/* Stats Section */}
      <StatsBar stats={globalStats} />

      {/* Search Results Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-bold text-zinc-100">Resultados da Prospecção</h2>
          </div>
          {searchStats.total_found > 0 && (
            <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-white/5">
              <Info className="h-3.5 w-3.5 text-primary" />
              <span>
                {searchStats.total_found} encontrados no Google. 
                {searchStats.filtered_out > 0 && ` ${searchStats.filtered_out} já na lista.`}
              </span>
            </div>
          )}
        </div>

        {results.length > 0 ? (
          <PlaceList 
            places={results} 
            onSave={(p) => handleSave(p, 'novo')}
            onIgnore={(p) => handleSave(p, 'excluido')}
            onWhatsApp={handleWhatsApp}
            processingIds={processingIds}
          />
        ) : !isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 rounded-3xl border border-dashed border-white/5">
            <div className="p-4 rounded-full bg-zinc-800/50 mb-4">
              <SearchModal onSearch={handleSearch} isLoading={isLoading} />
            </div>
            <p className="text-zinc-500 font-medium text-center max-w-xs">
              Clique no botão acima para começar sua primeira busca de leads.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[400px] rounded-3xl bg-zinc-900/50 animate-pulse border border-white/5" />
            ))}
          </div>
        )}
      </div>

      <WhatsAppModal 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lead={selectedPlace as any} 
        isOpen={isMsgModalOpen}
        onClose={() => setIsMsgModalOpen(false)}
        messageTemplate={messageTemplate}
        onConfirm={handleConfirmWhatsApp}
      />
    </div>
  );
}
