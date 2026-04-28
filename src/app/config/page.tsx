'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MessagePreview from '@/components/MessagePreview';

export default function ConfigPage() {
  const [mensagem, setMensagem] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch('/api/config');
        if (!response.ok) throw new Error('Falha ao carregar configuração');
        const data = await response.json();
        setMensagem(data.mensagem);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha ao carregar configuração';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem }),
      });

      if (!response.ok) throw new Error('Falha ao salvar configuração');
      toast.success('Mensagem padrão salva!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar configuração';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Ajuste o comportamento do sistema.</p>
      </div>

      <Card className="border shadow-sm bg-white">
        <CardHeader>
          <CardTitle>Mensagem do WhatsApp</CardTitle>
          <CardDescription>
            Defina o texto que será enviado automaticamente ao clicar no botão do WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Textarea
              placeholder="Digite aqui a mensagem..."
              className="min-h-[150px] resize-none"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
            />
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 text-blue-800 text-xs border border-blue-100">
              <Info className="h-4 w-4 shrink-0" />
              <p>
                Use a tag <span className="font-mono font-bold">{'{nome}'}</span> para inserir automaticamente o nome do estabelecimento na mensagem.
              </p>
            </div>
          </div>

          <MessagePreview template={mensagem} />

          <Button 
            className="w-full h-12 text-base" 
            onClick={handleSave} 
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configuração
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
