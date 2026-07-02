'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { EvolutionInstanceResponse, WhatsAppInstance } from '@/types';

interface AddInstanceModalProps {
  onSuccess: (instance: WhatsAppInstance, qrcode?: EvolutionInstanceResponse['qrcode']) => void;
}

export default function AddInstanceModal({ onSuccess }: AddInstanceModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/whatsapp/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName, assigned_to: assignedTo }),
      });

      if (!response.ok) throw new Error('Falha ao criar instância');
      
      const data = await response.json();
      toast.success('Instância criada com sucesso!');
      setIsOpen(false);
      onSuccess(data.instance, data.qrcode);
      setDisplayName('');
      setAssignedTo('');
    } catch (error) {
      toast.error('Erro ao criar instância');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger 
        className={cn(
          buttonVariants({ variant: "default" }),
          "bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl h-12 px-6 gap-2"
        )}
      >
        <Plus className="h-5 w-5" />
        Novo Número
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 p-8 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black text-white">Adicionar Número</DialogTitle>
          <DialogDescription className="text-zinc-500 font-medium text-base">
            Configure uma nova instância da Evolution API para este número.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="display_name" className="text-zinc-400">Nome do Dispositivo</Label>
            <Input 
              id="display_name"
              placeholder="Ex: SDR João - Principal"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-zinc-950 border-white/10 text-white h-12 rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assigned_to" className="text-zinc-400">SDR Responsável (Opcional)</Label>
            <Input 
              id="assigned_to"
              placeholder="Ex: João Silva"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="bg-zinc-950 border-white/10 text-white h-12 rounded-xl"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setIsOpen(false)}
              className="text-zinc-500 hover:text-white"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 px-8 rounded-xl"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Criar e Gerar QR Code'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
