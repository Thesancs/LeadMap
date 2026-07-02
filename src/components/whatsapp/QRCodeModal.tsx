'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Loader2, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  base64?: string;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function QRCodeModal({ 
  isOpen, 
  onClose, 
  base64, 
  isLoading,
  onRefresh
}: QRCodeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 p-8 rounded-3xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-3xl font-black text-white text-center">
            Conectar WhatsApp
          </DialogTitle>
          <DialogDescription className="text-zinc-500 font-medium text-center text-base">
            Abra o WhatsApp no seu celular, vá em Dispositivos Conectados e escaneie o código abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative aspect-square w-64 bg-white p-4 rounded-2xl overflow-hidden shadow-2xl shadow-white/5">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : base64 ? (
              <img src={base64} alt="QR Code WhatsApp" className="w-full h-full" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 gap-2">
                <p className="text-xs">Falha ao carregar QR Code</p>
                <Button variant="ghost" size="sm" onClick={onRefresh}>
                  Tentar novamente
                </Button>
              </div>
            )}
          </div>
          
          {!isLoading && (
            <Button 
              variant="ghost" 
              onClick={onRefresh} 
              className="mt-6 text-zinc-500 hover:text-white gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Atualizar código
            </Button>
          )}
        </div>

        <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
          <p className="text-xs text-zinc-500 text-center leading-relaxed">
            O código expira em poucos minutos. Mantenha esta janela aberta até que a conexão seja confirmada.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
