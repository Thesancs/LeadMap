'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { Search, Sparkles } from "lucide-react";
import SearchForm from "./SearchForm";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SearchModalProps {
  onSearch: (data: { 
    setor: string; 
    cidade: string; 
    minStars: string; 
    quantidade: string;
    horaInicio: string;
    horaFim: string;
  }) => void;
  isLoading: boolean;
}

export default function SearchModal({ onSearch, isLoading }: SearchModalProps) {
  const [open, setOpen] = useState(false);

  const handleSearch = (data: { 
    setor: string; 
    cidade: string; 
    minStars: string; 
    quantidade: string;
    horaInicio: string;
    horaFim: string;
  }) => {
    onSearch(data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        className={cn(
          buttonVariants({ variant: "default", size: "lg" }),
          "h-14 px-8 text-lg font-bold gap-3 shadow-2xl shadow-cyan-500/20 bg-cyan-500 hover:bg-cyan-400 text-cyan-950 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer rounded-2xl border-none"
        )}
      >
        <Search className="h-5 w-5" />
        Procurar Novos Leads
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[700px] bg-zinc-950 border-white/10 shadow-[0_0_50px_rgba(34,211,238,0.1)] rounded-3xl p-8">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-[0.2em]">
            <Sparkles className="h-4 w-4" />
            Lead Generation
          </div>
          <DialogTitle className="text-4xl font-black gradient-cyan">
            Configurar Prospecção
          </DialogTitle>
          <p className="text-zinc-500 text-sm font-medium">
            Defina os parâmetros ideais para encontrar clientes de alto valor no Google Maps.
          </p>
        </DialogHeader>
        
        <div className="mt-8">
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
