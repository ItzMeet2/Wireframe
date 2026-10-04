'use client';

import React from 'react';
import {
  Mail,
  MessageSquare,
  FileSpreadsheet,
  Calendar,
  Phone,
  Globe,
  Bot,
  Sparkles,
  Zap,
  Share2,
  Video,
  PlaySquare,
  Camera
} from 'lucide-react';
import { ServiceType } from '@/types/diagrams';

interface ServiceIconProps {
  service: string;
  className?: string;
  size?: number;
}

export default function ServiceIcon({ service, className = 'w-4 h-4', size = 16 }: ServiceIconProps) {
  const norm = (service || '').toLowerCase().trim();

  switch (norm) {
    case 'gmail':
    case 'email':
      return <Mail className={`${className} text-red-400`} size={size} />;
    case 'slack':
      return <MessageSquare className={`${className} text-emerald-400`} size={size} />;
    case 'sheets':
    case 'google sheets':
    case 'excel':
      return <FileSpreadsheet className={`${className} text-green-400`} size={size} />;
    case 'instagram':
      return (
        <svg className={`${className} text-pink-400`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
        </svg>
      );
    case 'linkedin':
      return (
        <svg className={`${className} text-blue-400`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
          <rect width="4" height="12" x="2" y="9"/>
          <circle cx="4" cy="4" r="2"/>
        </svg>
      );
    case 'x':
    case 'twitter':
      return <Share2 className={`${className} text-zinc-200`} size={size} />;
    case 'tiktok':
      return <Video className={`${className} text-cyan-400`} size={size} />;
    case 'youtube':
      return <PlaySquare className={`${className} text-red-500`} size={size} />;
    case 'calendar':
    case 'google calendar':
      return <Calendar className={`${className} text-blue-400`} size={size} />;
    case 'whatsapp':
    case 'call':
    case 'phone':
      return <Phone className={`${className} text-emerald-500`} size={size} />;
    case 'openai':
    case 'chatgpt':
      return <Bot className={`${className} text-teal-400`} size={size} />;
    case 'anthropic':
    case 'claude':
      return <Sparkles className={`${className} text-amber-400`} size={size} />;
    case 'http':
    case 'webhook':
    case 'api':
      return <Globe className={`${className} text-purple-400`} size={size} />;
    case 'github':
    case 'git':
      return (
        <svg className={`${className} text-white`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
          <path d="M9 18c-4.51 2-5-2-7-2"/>
        </svg>
      );
    case 'database':
    case 'db':
    case 'postgres':
    case 'sql':
    case 'prisma':
    case 'mongodb':
      return (
        <svg className={`${className} text-indigo-400`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3"/>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
        </svg>
      );
    case 'server':
    case 'backend':
    case 'fastapi':
    case 'express':
    case 'node':
      return (
        <svg className={`${className} text-emerald-400`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="8" x="2" y="2" rx="2" ry="2"/>
          <rect width="20" height="8" x="2" y="14" rx="2" ry="2"/>
          <line x1="6" x2="6.01" y1="6" y2="6"/>
          <line x1="6" x2="6.01" y1="18" y2="18"/>
        </svg>
      );
    case 'react':
    case 'nextjs':
    case 'frontend':
    case 'client':
    case 'ui':
      return (
        <svg className={`${className} text-cyan-400`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="2"/>
          <path d="M12 21.09c4.97 0 9-4.07 9-9.09s-4.03-9.09-9-9.09-9 4.07-9 9.09 4.03 9.09 9 9.09Z" strokeDasharray="3 3"/>
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)"/>
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)"/>
        </svg>
      );
    case 'docker':
    case 'container':
      return (
        <svg className={`${className} text-blue-400`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 11h2v2H4zM7 11h2v2H7zM10 11h2v2h-2zM4 8h2v2H4zM7 8h2v2H7zM10 8h2v2h-2zM13 11h2v2h-2zM7 5h2v2H7z"/>
          <path d="M22 13c-.5-1.5-2-2-3-2-.5 0-1 .2-1.5.5C17 9 14.5 7 11 7H2v7c0 4 3.5 7 8 7 6 0 10.5-3.5 12-8Z"/>
        </svg>
      );
    case 'storage':
    case 'redis':
    case 'cache':
      return (
        <svg className={`${className} text-amber-400`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" x2="2" y1="12" y2="12"/>
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
          <line x1="6" x2="6.01" y1="16" y2="16"/>
          <line x1="10" x2="10.01" y1="16" y2="16"/>
        </svg>
      );
    case 'auth':
    case 'security':
      return (
        <svg className={`${className} text-emerald-400`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      );
    default:
      return <Zap className={`${className} text-zinc-400`} size={size} />;
  }
}
