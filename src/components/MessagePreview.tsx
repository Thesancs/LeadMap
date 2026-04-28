'use client';

interface MessagePreviewProps {
  template: string;
}

export default function MessagePreview({ template }: MessagePreviewProps) {
  const preview = template.replace(/{nome}/g, 'Restaurante Exemplo');

  return (
    <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
        Preview da Mensagem
      </p>
      <div className="relative p-3 bg-white rounded shadow-sm border border-zinc-100">
        <div className="absolute -left-1.5 top-3 w-3 h-3 bg-white border-l border-b border-zinc-100 rotate-45" />
        <p className="text-sm whitespace-pre-wrap">
          {preview || 'A mensagem padrão aparecerá aqui...'}
        </p>
      </div>
      <p className="mt-2 text-[10px] text-zinc-400 italic">
        * A variável <span className="font-mono text-primary">{'{nome}'}</span> será substituída automaticamente.
      </p>
    </div>
  );
}
