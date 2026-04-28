'use client';

import { useState } from 'react';
import { Search, Loader2, MapPin, Briefcase, Star, Hash, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

interface SearchFormProps {
  onSearch: (data: { 
    setor: string; 
    cidade: string; 
    minStars: string; 
    quantidade: string;
    horaInicio: string;
    horaFim: string;
  }) => void;
  isLoading: boolean;
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [setor, setSetor] = useState('');
  const [cidade, setCidade] = useState('');
  const [minStars, setMinStars] = useState('0');
  const [quantidade, setQuantidade] = useState('10');
  const [horaInicio, setHoraInicio] = useState('00:00');
  const [horaFim, setHoraFim] = useState('23:59');
  const [filtrarHorario, setFiltrarHorario] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (setor.trim() && cidade.trim()) {
      onSearch({ 
        setor: setor.trim(), 
        cidade: cidade.trim(), 
        minStars, 
        quantidade,
        // Só envia os horários se o filtro estiver ativo, caso contrário envia o range total
        horaInicio: filtrarHorario ? horaInicio : '00:00',
        horaFim: filtrarHorario ? horaFim : '23:59'
      });
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => {
    const h = i.toString().padStart(2, '0');
    return `${h}:00`;
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Setor */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">O que procurar?</label>
          <div className="relative">
            <Briefcase className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-500/50" />
            <Input
              placeholder="Ex: Restaurantes, Academias..."
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              className="pl-12 h-14 bg-zinc-900 border-white/5 rounded-2xl focus:border-cyan-500/50 focus:ring-cyan-500/20 transition-all text-white font-bold"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Cidade */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Onde procurar?</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-500/50" />
            <Input
              placeholder="Ex: Campinas, SP"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="pl-12 h-14 bg-zinc-900 border-white/5 rounded-2xl focus:border-cyan-500/50 focus:ring-cyan-500/20 transition-all text-white font-bold"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 border border-white/5 group hover:border-cyan-500/20 transition-all">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-xl transition-colors",
            filtrarHorario ? "bg-cyan-500/10 text-cyan-400" : "bg-zinc-800 text-zinc-600"
          )}>
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-300">Filtro de Horário</p>
            <p className="text-[10px] text-zinc-500 font-medium">Filtrar apenas por locais abertos em horários específicos</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setFiltrarHorario(!filtrarHorario)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2",
            filtrarHorario ? "bg-cyan-500" : "bg-zinc-800"
          )}
        >
          <span
            className={cn(
              "pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
              filtrarHorario ? "translate-x-5" : "translate-x-0"
            )}
          >
            {filtrarHorario && <Check className="absolute inset-0 m-auto h-3 w-3 text-cyan-600" />}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Nota */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Avaliação Mín.</label>
          <Select value={minStars} onValueChange={(val) => setMinStars(val || '0')} disabled={isLoading}>
            <SelectTrigger className="h-12 bg-zinc-900 border-white/5 rounded-2xl pl-10 relative">
              <Star className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-500/50" />
              <SelectValue placeholder="Nota" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-white/10">
              <SelectItem value="0">Qualquer nota</SelectItem>
              <SelectItem value="4.0">4.0+ Estrelas</SelectItem>
              <SelectItem value="4.5">4.5+ Estrelas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Horário De */}
        <div className={cn("space-y-2 transition-opacity duration-300", !filtrarHorario && "opacity-30 pointer-events-none")}>
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Abre a partir de</label>
          <Select value={horaInicio} onValueChange={(val) => setHoraInicio(val || '00:00')} disabled={isLoading || !filtrarHorario}>
            <SelectTrigger className="h-12 bg-zinc-900 border-white/5 rounded-2xl pl-10 relative">
              <Clock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-500/50" />
              <SelectValue placeholder="De" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-white/10">
              {hours.map(h => (
                <SelectItem key={`from-${h}`} value={h}>{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Horário Até */}
        <div className={cn("space-y-2 transition-opacity duration-300", !filtrarHorario && "opacity-30 pointer-events-none")}>
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Aberto até</label>
          <Select value={horaFim} onValueChange={(val) => setHoraFim(val || '23:59')} disabled={isLoading || !filtrarHorario}>
            <SelectTrigger className="h-12 bg-zinc-900 border-white/5 rounded-2xl pl-10 relative">
              <Clock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-500/50" />
              <SelectValue placeholder="Até" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-white/10">
              {hours.map(h => (
                <SelectItem key={`to-${h}`} value={h === '00:00' ? '23:59' : h}>{h === '00:00' ? '23:59' : h}</SelectItem>
              ))}
              <SelectItem value="23:59">23:59</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leads */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Qtd. Leads</label>
          <Select value={quantidade} onValueChange={(val) => setQuantidade(val || '10')} disabled={isLoading}>
            <SelectTrigger className="h-12 bg-zinc-900 border-white/5 rounded-2xl pl-10 relative">
              <Hash className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-500/50" />
              <SelectValue placeholder="Leads" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-white/10">
              <SelectItem value="10">10 Leads</SelectItem>
              <SelectItem value="30">30 Leads</SelectItem>
              <SelectItem value="50">50 Leads</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-2xl shadow-cyan-500/20 bg-cyan-500 hover:bg-cyan-400 text-cyan-950 rounded-2xl border-none mt-4 transition-all hover:scale-[1.01]" 
        disabled={isLoading || !setor.trim() || !cidade.trim()}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
            Iniciando Varredura...
          </>
        ) : (
          <>
            <Search className="mr-3 h-6 w-6" />
            Iniciar Prospecção
          </>
        )}
      </Button>
    </form>
  );
}
