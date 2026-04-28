'use client';

import { PlaceResult } from '@/types';
import PlaceCard from './PlaceCard';
import { Sparkles } from 'lucide-react';

interface PlaceListProps {
  places: PlaceResult[];
  onSave: (place: PlaceResult) => void;
  onIgnore: (place: PlaceResult) => void;
  onWhatsApp: (place: PlaceResult) => void;
  processingIds: Set<string>;
}

export default function PlaceList({ places, onSave, onIgnore, onWhatsApp, processingIds }: PlaceListProps) {
  if (places.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500 border-2 border-dashed border-white/5 rounded-3xl bg-zinc-900/10 backdrop-blur-sm">
        <div className="bg-zinc-800/50 p-6 rounded-full mb-6">
          <Sparkles className="h-10 w-10 text-cyan-500/20" />
        </div>
        <h3 className="text-xl font-bold text-zinc-300">Pronto para prospectar?</h3>
        <p className="text-sm font-medium mt-2 max-w-xs text-center opacity-60">Inicie uma nova busca para encontrar estabelecimentos filtrados e prontos para contato.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {places.map((place) => (
        <PlaceCard 
          key={place.place_id} 
          place={place} 
          onSave={onSave}
          onIgnore={onIgnore}
          onWhatsApp={onWhatsApp}
          isProcessing={processingIds.has(place.place_id)}
        />
      ))}
    </div>
  );
}
