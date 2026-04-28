'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lead, LeadStatus, LeadStats } from '@/types';
import StatsBar from '@/components/StatsBar';
import LeadsTable from '@/components/LeadsTable';
import { toast } from 'sonner';
import { Loader2, RefreshCcw, Filter, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<(LeadStats & { respondidos?: number }) | null>(null);
  const [messageTemplate, setMessageTemplate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<LeadStatus | 'todos'>('todos');

  const fetchData = useCallback(async () => {
    try {
      const [leadsRes, statsRes, configRes] = await Promise.all([
        fetch(`/api/leads?status=${filter}`),
        fetch('/api/leads/stats'),
        fetch('/api/config')
      ]);

      if (!leadsRes.ok || !statsRes.ok || !configRes.ok) {
        throw new Error('Falha ao carregar dados');
      }

      const [leadsData, statsData, configData] = await Promise.all([
        leadsRes.json(),
        statsRes.json(),
        configRes.json()
      ]);

      setLeads(leadsData.leads);
      setStats(statsData);
      setMessageTemplate(configData.mensagem);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao carregar dados';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  const handleStatusChange = async (id: string, newStatus: LeadStatus) => {
    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Falha ao atualizar status');
      
      toast.success('Status atualizado');
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao atualizar status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
            <Users className="h-4 w-4" />
            CRM Simplificado
          </div>
          <h1 className="text-4xl md:text-5xl font-black gradient-text">
            Meus Leads
          </h1>
          <p className="text-zinc-500 max-w-lg">
            Gerencie seu funil de vendas e acompanhe o engajamento de cada contato.
          </p>
        </div>
        <Button 
          variant="outline" 
          className="bg-zinc-900 border-white/10 hover:bg-zinc-800 text-white gap-2 h-12 px-6 rounded-xl"
          onClick={() => { setIsLoading(true); fetchData(); }} 
          disabled={isLoading}
        >
          <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar Lista
        </Button>
      </div>

      {stats && <StatsBar stats={stats} />}

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/30 p-2 rounded-2xl border border-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-2 px-3 text-zinc-500 text-xs font-bold uppercase tracking-wider">
            <Filter className="h-3.5 w-3.5" />
            Filtrar por Status
          </div>
          <Tabs value={filter} onValueChange={(val) => { setIsLoading(true); setFilter(val as LeadStatus | 'todos'); }} className="w-full sm:w-auto">
            <TabsList className="bg-transparent border-none gap-1">
              {['todos', 'novo', 'contatado', 'respondido', 'fechado', 'sem_interesse'].map((f) => (
                <TabsTrigger 
                  key={f} 
                  value={f}
                  className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-500 text-xs font-bold px-4 h-9 capitalize"
                >
                  {f.replace('_', ' ')}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-zinc-900/10 rounded-3xl border border-dashed border-white/5">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4 opacity-50" />
            <p className="text-zinc-500 font-medium">Carregando seus leads...</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/5 bg-zinc-900/20 backdrop-blur-sm overflow-hidden shadow-2xl">
            <LeadsTable 
              leads={leads} 
              onStatusChange={handleStatusChange}
              messageTemplate={messageTemplate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
