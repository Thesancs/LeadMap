'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Settings, Map } from 'lucide-react';
import { cn } from '@/lib/utils';

import { User } from '@supabase/supabase-js';
import { LogOut } from 'lucide-react';
import { logout } from '@/app/login/actions';

export default function Navbar({ user }: { user: User | null }) {
  const pathname = usePathname();

  // Se não estiver logado, não renderiza a navbar inteira para ficar mais limpo
  // ou pode renderizar apenas o logo.
  if (!user) {
    return null;
  }

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Meus Leads', href: '/leads', icon: Users },
    { label: 'Configurações', href: '/config', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/60 backdrop-blur-2xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 group transition-transform active:scale-95">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500 text-cyan-950 shadow-[0_0_20px_rgba(34,211,238,0.3)] group-hover:rotate-12 transition-transform duration-500">
            <Map className="h-6 w-6" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white">
            LEAD<span className="text-cyan-400">MAP</span>
            <span className="text-cyan-600 text-[10px] align-top ml-1 font-black">V3</span>
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                pathname === item.href 
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.1)]" 
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 text-red-500 hover:bg-red-500/10 hover:text-red-400 ml-4"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </nav>

        {/* Mobile Nav */}
        <div className="flex md:hidden items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "p-3 rounded-2xl transition-all duration-300 border border-transparent",
                pathname === item.href 
                  ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.1)]" 
                  : "text-zinc-500"
              )}
            >
              <item.icon className="h-5 w-5" />
            </Link>
          ))}
          <button
            onClick={() => logout()}
            className="p-3 rounded-2xl transition-all duration-300 border border-transparent text-red-500 hover:bg-red-500/10"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
