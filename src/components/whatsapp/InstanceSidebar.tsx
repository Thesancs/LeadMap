'use client';

import { WhatsAppInstance } from '@/types';
import { Smartphone, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstanceSidebarProps {
  instances: WhatsAppInstance[];
  activeInstanceId: string | null;
  onSelect: (id: string) => void;
}

export default function InstanceSidebar({ instances, activeInstanceId, onSelect }: InstanceSidebarProps) {
  return (
    <div className="w-20 md:w-64 border-r border-white/5 flex flex-col bg-zinc-950/50">
      <div className="p-4 border-b border-white/5 flex items-center gap-3">
        <Smartphone className="h-5 w-5 text-primary" />
        <h2 className="font-bold text-zinc-100 hidden md:block">Instâncias</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {instances.map((instance) => {
          const isActive = activeInstanceId === instance.id;
          const isConnected = instance.status === 'open';
          
          return (
            <button
              key={instance.id}
              onClick={() => onSelect(instance.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all group",
                isActive 
                  ? "bg-primary/10 border border-primary/20" 
                  : "hover:bg-white/5 border border-transparent"
              )}
            >
              <div className="relative shrink-0">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                  isActive ? "bg-primary text-white" : "bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700"
                )}>
                  {instance.display_name.charAt(0).toUpperCase()}
                </div>
                <div className={cn(
                  "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-zinc-950 flex items-center justify-center",
                  isConnected ? "bg-green-500" : "bg-red-500"
                )}>
                  {isConnected ? (
                    <CheckCircle2 className="h-2 w-2 text-white" />
                  ) : (
                    <XCircle className="h-2 w-2 text-white" />
                  )}
                </div>
              </div>
              
              <div className="hidden md:block text-left overflow-hidden">
                <p className={cn(
                  "text-sm font-bold truncate",
                  isActive ? "text-primary" : "text-zinc-300"
                )}>
                  {instance.display_name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className="h-3 w-3 text-zinc-500" />
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
                    {isConnected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
