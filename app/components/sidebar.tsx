"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, TrendingUp, Users, PlayCircle, Heart,
  Upload, LayoutDashboard, Menu, X, Tv, MessageCircle, Settings
} from "lucide-react";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { icon: <Home size={20} />, label: 'Home', href: '/' },
    { icon: <TrendingUp size={20} />, label: 'Trending', href: '/trending' },
    { icon: <Users size={20} />, label: 'Artists', href: '/artists' },
    { icon: <PlayCircle size={20} />, label: 'Playlists', href: '/playlists' },
    { icon: <Heart size={20} />, label: 'Bookmarks', href: '/bookmarks' },
    { icon: <MessageCircle size={20} />, label: 'Inbox', href: '/inbox' },
    {
      icon: (
        <div className="relative">
          <Tv size={20} />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </div>
      ),
      label: 'Live Football',
      href: '/live-football',
      isLive: true
    },
    {
      icon: <Upload size={20} />,
      label: 'Artist Upload',
      href: '/artist/upload',
      highlight: true
    },
    { icon: <Settings size={20} />, label: 'Settings', href: '/settings' },
    { icon: <LayoutDashboard size={20} />, label: 'Admin Panel', href: '/admin/dashboard' },
  ];

  return (
    <>
      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-black border-b border-zinc-900 flex items-center justify-between px-6 z-[100]">
        <h1 className="text-xl font-black text-orange-500 italic uppercase">ZABUS.AFRICA</h1>
        <button onClick={() => setIsOpen(!isOpen)} className="text-white p-2 focus:outline-none">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed lg:sticky top-0 left-0 z-[100] w-72 bg-black h-screen flex flex-col border-r border-zinc-900 p-6 transition-transform duration-300 ease-in-out flex-shrink-0 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="mb-10 hidden lg:block">
          <h1 className="text-2xl font-black text-orange-500 italic uppercase tracking-tighter">ZABUS.AFRICA</h1>
        </div>

        <nav className="flex-1 space-y-2 mt-16 lg:mt-0 overflow-y-auto pr-1 custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all group ${
                  item.highlight
                    ? 'bg-orange-500 text-black font-black hover:bg-orange-600 shadow-lg shadow-orange-500/20 mt-6'
                    : isActive
                      ? 'bg-orange-500/10 text-orange-500 border-r-4 border-orange-500 rounded-r-none'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                } ${item.isLive && !isActive ? 'hover:border-l-4 hover:border-red-500/50 bg-red-500/5' : ''}`}
              >
                <div className={`transition-colors ${
                  item.label === 'Bookmarks' && isActive
                    ? 'text-red-500'
                    : item.highlight && isActive
                      ? 'text-black'
                      : item.isLive ? 'text-zinc-400 group-hover:text-red-500' : ''
                }`}>
                  {item.icon}
                </div>
                <span className="text-sm font-bold uppercase tracking-tight">
                  {item.label}
                  {item.isLive && (
                    <span className="ml-2 text-[8px] bg-red-500 text-white px-1 rounded animate-pulse">LIVE</span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* BOTTOM */}
        <div className="pt-6 border-t border-zinc-900 mt-auto">
          <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em]">© 2026 Zabus Africa</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;