'use client';

import { WhatsAppInstance } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  QrCode, 
  Trash2, 
  LogOut, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  User,
  Zap
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface InstanceCardProps {
  instance: WhatsAppInstance;
  onConnect: () => void;
  onLogout: () => void;
  onDelete: () => void;
}

export default function InstanceCard({ 
  instance, 
  onConnect, 
  onLogout, 
  onDelete 
}: InstanceCardProps) {
  const statusConfig = {
    open: {
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: 'Conectado'
    },
    close: {
      color: 'text-zinc-500',
      bg: 'bg-zinc-500/10',
      border: 'border-zinc-500/20',
      icon: <Clock className="h-4 w-4" />,
      label: 'Desconectado'
    },
    connecting: {
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      icon: <Clock className="h-4 w-4 animate-pulse" />,
      label: 'Conectando...'
    }
  }[instance.status];

  return (
    <Card className="bg-zinc-900/30 border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm group hover:border-white/10 transition-all duration-500">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">{instance.display_name}</h3>
              <Badge className={`${statusConfig.bg} ${statusConfig.color} border-${statusConfig.color.split('-')[1]}-500/20 rounded-full h-6 px-3 gap-1.5`}>
                {statusConfig.icon}
                <span className="text-[10px] font-black uppercase tracking-wider">{statusConfig.label}</span>
              </Badge>
            </div>
            <p className="text-xs text-zinc-600 font-mono">{instance.instance_name}</p>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onDelete}
            className="text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-800 text-zinc-400">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">SDR</p>
              <p className="text-sm text-zinc-300 font-medium">{instance.assigned_to || 'Não atribuído'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-800 text-zinc-400">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Limite</p>
              <p className="text-sm text-zinc-300 font-medium">{instance.daily_limit} msg/dia</p>
            </div>
          </div>
        </div>

        {/* Aquecimento (Fase 2+) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-zinc-600">Protocolo de Aquecimento</span>
            <span className="text-primary">{instance.warmup_days_current}/{instance.warmup_days_total} dias</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000" 
              style={{ width: `${(instance.warmup_days_current / instance.warmup_days_total) * 100}%` }} 
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          {instance.status === 'open' ? (
            <Button 
              variant="outline" 
              className="flex-1 h-11 bg-zinc-800/50 border-white/5 text-zinc-400 hover:text-white rounded-xl gap-2"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
              Desconectar
            </Button>
          ) : (
            <Button 
              className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl gap-2 shadow-lg shadow-primary/20"
              onClick={onConnect}
            >
              <QrCode className="h-4 w-4" />
              Conectar QR Code
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
