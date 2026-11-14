'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  Building2,
  ChevronDown,
  Check,
  Plus,
  Settings,
  Sparkles,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useTeam } from '@/lib/TeamContext';
import { useAuth } from '@/lib/AuthContext';
import { Organization } from '@/types/team';

interface TeamSelectorDropdownProps {
  onOpenTeamModal: () => void;
}

export default function TeamSelectorDropdown({ onOpenTeamModal }: TeamSelectorDropdownProps) {
  const { user } = useAuth();
  const { organizations, currentOrganization, setCurrentOrganization } = useTeam();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!user) return null;

  const handleSelectTeam = (org: Organization | null) => {
    setCurrentOrganization(org);
    setIsOpen(false);
  };

  const getStatusBadge = (org: Organization) => {
    if (org.subscriptionStatus === 'active') {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          Aktiv
        </span>
      );
    }
    const isTrialValid = org.subscriptionStatus === 'trialing' && (!org.trialEndsAt || new Date(org.trialEndsAt) > new Date());
    if (isTrialValid) {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
          Testphase
        </span>
      );
    }
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
        Inaktiv
      </span>
    );
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left shrink-0">
      {/* Trigger Button in Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Aktiven Team-Workspace wechseln"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
          currentOrganization
            ? 'bg-indigo-950/70 text-indigo-200 border-indigo-700/60 hover:bg-indigo-900/80 shadow-xs'
            : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
        }`}
      >
        {currentOrganization ? (
          <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        ) : (
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        )}
        <span className="max-w-[120px] truncate text-slate-100">
          {currentOrganization ? currentOrganization.name : 'Persönlich'}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150 text-xs">
          
          {/* Dropdown Header */}
          <div className="px-3.5 py-2.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
              Workspaces & Teams
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {organizations.length} {organizations.length === 1 ? 'Team' : 'Teams'}
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-800/50">
            {/* List of Organizations */}
            {organizations.length > 0 && (
              <div className="py-1">
                {organizations.map((org) => {
                  const isSelected = currentOrganization?.id === org.id;
                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => handleSelectTeam(org)}
                      className={`w-full px-3.5 py-2 flex items-center justify-between text-left transition-colors ${
                        isSelected
                          ? 'bg-indigo-600/20 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <Building2
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected ? 'text-indigo-400' : 'text-slate-500'
                          }`}
                        />
                        <div className="truncate">
                          <span className="block truncate">{org.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">Code: {org.inviteCode}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {getStatusBadge(org)}
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 ml-1" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Personal Mode Option */}
            <div className="py-1">
              <button
                type="button"
                onClick={() => handleSelectTeam(null)}
                className={`w-full px-3.5 py-2 flex items-center justify-between text-left transition-colors ${
                  currentOrganization === null
                    ? 'bg-blue-600/20 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User
                    className={`w-3.5 h-3.5 ${
                      currentOrganization === null ? 'text-blue-400' : 'text-slate-500'
                    }`}
                  />
                  <div>
                    <span className="block">Persönlicher Modus</span>
                    <span className="text-[10px] text-slate-500">Nur private Favoriten & Notizen</span>
                  </div>
                </div>
                {currentOrganization === null && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-2 border-t border-slate-800 bg-slate-950/80 space-y-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenTeamModal();
              }}
              className="w-full px-3 py-1.5 flex items-center gap-2 text-indigo-300 hover:text-white hover:bg-indigo-600/20 rounded-lg text-[11px] font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Neues Team erstellen oder beitreten</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenTeamModal();
              }}
              className="w-full px-3 py-1.5 flex items-center gap-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg text-[11px] font-medium transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Workspaces & Abrechnung verwalten</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
