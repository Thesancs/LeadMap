'use client';

import { LeadStats } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserPlus, MessageCircle, CheckCircle, Search, MessageSquareQuote } from 'lucide-react';

interface StatsBarProps {
  stats: LeadStats & { respondidos?: number };
}

export default function StatsBar({ stats }: StatsBarProps) {
  const items = [
    { label: 'Buscas', value: stats.requisicoes, icon: Search, color: 'text-zinc-400', bg: 'bg-zinc-800' },
    { label: 'Encontrados', value: stats.buscados, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Salvos', value: stats.salvos, icon: UserPlus, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Contatados', value: stats.contatados, icon: MessageCircle, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Responderam', value: stats.respondidos || 0, icon: MessageSquareQuote, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Fechados', value: stats.fechados, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {items.map((item) => (
        <Card key={item.label} className="border-white/5 shadow-2xl bg-zinc-900/40 backdrop-blur-xl overflow-hidden hover:border-cyan-500/30 transition-all duration-300 group">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-2.5 rounded-2xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
              <item.icon className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black tracking-[0.15em] text-zinc-500 group-hover:text-zinc-400 transition-colors">
                {item.label}
              </span>
              <span className="text-2xl font-black text-white group-hover:text-cyan-400 transition-colors leading-none mt-1">
                {item.value}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
