'use client';

import { MapPin, Phone, Globe, Save, Trash2, Loader2, Clock, Image as ImageIcon, ChevronRight, MessageSquare } from 'lucide-react';
import { PlaceResult } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StarRating from './StarRating';

interface PlaceCardProps {
  place: PlaceResult;
  onSave: (place: PlaceResult) => void;
  onIgnore: (place: PlaceResult) => void;
  onWhatsApp: (place: PlaceResult) => void;
  isProcessing: boolean;
}

export default function PlaceCard({ place, onSave, onIgnore, onWhatsApp, isProcessing }: PlaceCardProps) {
  return (
    <Card className="flex flex-col h-full hover:shadow-2xl transition-all duration-500 border-white/5 bg-zinc-900/40 backdrop-blur-xl group overflow-hidden hover:border-cyan-500/30 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      {/* Imagens */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-900">
        {place.fotos && place.fotos.length > 0 ? (
          <div className="flex h-full w-full gap-1 p-1">
            <div className="relative flex-[2] overflow-hidden rounded-xl">
              <img 
                src={place.fotos[0]} 
                alt={place.nome} 
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent opacity-60" />
            </div>
            {place.fotos.length > 1 && (
              <div className="flex flex-col gap-1 flex-1">
                <div className="relative flex-1 overflow-hidden rounded-xl">
                  <img src={place.fotos[1]} alt={place.nome} className="h-full w-full object-cover" />
                </div>
                {place.fotos.length > 2 && (
                  <div className="relative flex-1 overflow-hidden rounded-xl">
                    <img src={place.fotos[2]} alt={place.nome} className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-800">
            <ImageIcon className="h-16 w-16 opacity-10" />
          </div>
        )}
        
        {place.rating && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-xl">
            <StarRating rating={place.rating} />
            <span className="text-[10px] font-black text-cyan-400 border-l border-white/20 pl-2">{place.rating}</span>
          </div>
        )}
      </div>

      <CardHeader className="flex-none pb-2 pt-5 px-6">
        <CardTitle className="text-xl font-black leading-tight text-white group-hover:text-cyan-400 transition-colors">
          {place.nome}
        </CardTitle>
        <div className="flex gap-2 items-center mt-2">
          {place.categoria && (
            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-cyan-500/20 text-cyan-500 bg-cyan-500/5 px-2 py-0.5">
              {place.categoria}
            </Badge>
          )}
          {place.total_reviews && (
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
              {place.total_reviews} reviews
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4 py-4 px-6 text-sm text-zinc-400">
        {place.endereco && (
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-zinc-800/50">
              <MapPin className="h-3.5 w-3.5 text-zinc-500" />
            </div>
            <span className="line-clamp-2 leading-relaxed">{place.endereco}</span>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-3">
          {place.telefone && (
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-zinc-800/50">
                <Phone className="h-3.5 w-3.5 text-zinc-500" />
              </div>
              <span className="font-medium text-zinc-300">{place.telefone}</span>
            </div>
          )}
          {place.horario_abertura && (
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-cyan-500/10">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
              </div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide">Abre {place.horario_abertura}</span>
            </div>
          )}
        </div>

        {place.site && (
          <a 
            href={place.site} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center justify-between w-full p-3 rounded-xl bg-zinc-800/30 hover:bg-zinc-800/50 border border-white/5 transition-all group/link mt-2"
          >
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-bold text-zinc-300 truncate">Website Oficial</span>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-600 group-hover/link:translate-x-1 transition-transform" />
          </a>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 p-6 border-t border-white/5 bg-zinc-900/40">
        <Button 
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-cyan-950 h-12 rounded-xl font-black shadow-lg shadow-cyan-500/20"
          onClick={() => onWhatsApp(place)}
          disabled={isProcessing}
        >
          {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageSquare className="h-5 w-5 mr-2" />}
          WhatsApp Direto
        </Button>
        <div className="flex gap-3 w-full">
          <Button 
            variant="ghost" 
            className="flex-1 text-zinc-500 hover:text-destructive hover:bg-destructive/10 h-10 rounded-xl font-bold"
            onClick={() => onIgnore(place)}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Ignorar
          </Button>
          <Button 
            variant="outline"
            className="flex-1 border-white/10 text-zinc-300 hover:bg-white/5 h-10 rounded-xl font-bold"
            onClick={() => onSave(place)}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Apenas Salvar
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
