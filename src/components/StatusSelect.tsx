'use client';

import { LeadStatus } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

interface StatusSelectProps {
  value: LeadStatus;
  onChange: (value: LeadStatus) => void;
  disabled?: boolean;
}

const statusOptions: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'novo', label: 'Novo', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'contatado', label: 'Contatado', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { value: 'respondido', label: 'Respondido', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  { value: 'sem_interesse', label: 'Sem Interesse', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  { value: 'fechado', label: 'Fechado', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
];

export default function StatusSelect({ value, onChange, disabled }: StatusSelectProps) {
  const current = statusOptions.find(o => o.value === value) || statusOptions[0];

  return (
    <Select value={value} onValueChange={(val) => onChange(val as LeadStatus)} disabled={disabled}>
      <SelectTrigger className="w-[140px] h-9 text-xs bg-zinc-900 border-white/5 rounded-xl">
        <SelectValue>
          <Badge variant="outline" className={`border ${current.color} rounded-lg text-[10px] uppercase tracking-wider`}>
            {current.label}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-zinc-950 border-white/10">
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-xs focus:bg-white/5">
            <span className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${option.color.split(' ')[1].replace('text-', 'bg-')}`} />
              {option.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
