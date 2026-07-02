'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import MessagePreview from '@/components/MessagePreview';
import { toast } from 'sonner';
import { BriefcaseBusiness, Camera, Info, Loader2, MessageSquare, Save, ShieldCheck, Zap } from 'lucide-react';

export default function ConfigPage() {
  const [config, setConfig] = useState<{
    mensagem_padrao: string;
    ig_template: string;
    li_template: string;
    wa_daily_limit: string;
    wa_warn_threshold: string;
  }>({
    mensagem_padrao: '',
    ig_template: '',
    li_template: '',
    wa_daily_limit: '80',
    wa_warn_threshold: '70',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch('/api/config');
        if (!response.ok) throw new Error('Falha ao carregar configuração');
        const data = await response.json();
        setConfig(prev => ({
          ...prev,
          ...data.config
        }));
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
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error('Falha ao salvar configuração');
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar configuração';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (key: keyof typeof config, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 px-4 pt-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
          <Zap className="h-4 w-4" />
          Configurações do Sistema
        </div>
        <h1 className="text-4xl md:text-5xl font-black gradient-text">
          Ajustes
        </h1>
        <p className="text-zinc-500 max-w-lg">
          Gerencie templates de mensagens, limites de segurança e integrações.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="whatsapp" className="w-full">
            <TabsList className="bg-zinc-900/50 border border-white/5 p-1 rounded-xl mb-6">
              <TabsTrigger value="whatsapp" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <MessageSquare className="h-4 w-4" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="instagram" className="rounded-lg gap-2 data-[state=active]:bg-pink-600 data-[state=active]:text-white">
                <Camera className="h-4 w-4" />
                Instagram
              </TabsTrigger>
              <TabsTrigger value="linkedin" className="rounded-lg gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <BriefcaseBusiness className="h-4 w-4" />
                LinkedIn
              </TabsTrigger>
            </TabsList>

            <TabsContent value="whatsapp" className="mt-0 focus-visible:outline-none">
              <Card className="bg-zinc-900/30 border-white/5 backdrop-blur-sm rounded-3xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Template WhatsApp
                  </CardTitle>
                  <CardDescription className="text-zinc-500">
                    Mensagem padrão enviada via Evolution API ou link direto.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Textarea
                    placeholder="Oi! Tudo bem? Vi o {nome} no Google..."
                    className="min-h-[150px] bg-zinc-950/50 border-white/10 text-white rounded-2xl focus:ring-primary"
                    value={config.mensagem_padrao}
                    onChange={(e) => updateConfig('mensagem_padrao', e.target.value)}
                  />
                  <div className="flex items-start gap-2 p-4 rounded-2xl bg-primary/5 text-primary text-xs border border-primary/10">
                    <Info className="h-4 w-4 shrink-0" />
                    <p>Use <b>{'{nome}'}</b>, <b>{'{cidade}'}</b> e <b>{'{categoria}'}</b> para personalização dinâmica.</p>
                  </div>
                  <MessagePreview template={config.mensagem_padrao} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="instagram" className="mt-0 focus-visible:outline-none">
              <Card className="bg-zinc-900/30 border-white/5 backdrop-blur-sm rounded-3xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Camera className="h-5 w-5 text-pink-500" />
                    Template Instagram
                  </CardTitle>
                  <CardDescription className="text-zinc-500">
                    Tom casual para abordagem via Direct.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Textarea
                    placeholder="Oi pessoal do {nome}! Adorei o perfil de vocês..."
                    className="min-h-[150px] bg-zinc-950/50 border-white/10 text-white rounded-2xl focus:ring-pink-500"
                    value={config.ig_template}
                    onChange={(e) => updateConfig('ig_template', e.target.value)}
                  />
                  <MessagePreview template={config.ig_template} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="linkedin" className="mt-0 focus-visible:outline-none">
              <Card className="bg-zinc-900/30 border-white/5 backdrop-blur-sm rounded-3xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BriefcaseBusiness className="h-5 w-5 text-blue-500" />
                    Template LinkedIn
                  </CardTitle>
                  <CardDescription className="text-zinc-500">
                    Abordagem profissional e executiva.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Textarea
                    placeholder="Olá! Vi que o {nome} em {cidade} é referência..."
                    className="min-h-[150px] bg-zinc-950/50 border-white/10 text-white rounded-2xl focus:ring-blue-500"
                    value={config.li_template}
                    onChange={(e) => updateConfig('li_template', e.target.value)}
                  />
                  <MessagePreview template={config.li_template} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="bg-zinc-900/30 border-white/5 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                Segurança WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-zinc-400">Limite Diário (mensagens)</Label>
                <Input 
                  type="number" 
                  value={config.wa_daily_limit} 
                  onChange={(e) => updateConfig('wa_daily_limit', e.target.value)}
                  className="bg-zinc-950/50 border-white/10 text-white rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Limite de Alerta (%)</Label>
                <Input 
                  type="number" 
                  value={config.wa_warn_threshold} 
                  onChange={(e) => updateConfig('wa_warn_threshold', e.target.value)}
                  className="bg-zinc-950/50 border-white/10 text-white rounded-xl"
                />
                <p className="text-[10px] text-zinc-600">Alerta amarelo ao atingir esta % do limite.</p>
              </div>
            </CardContent>
          </Card>

          <Button 
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95" 
            onClick={handleSave} 
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Salvar Tudo
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
