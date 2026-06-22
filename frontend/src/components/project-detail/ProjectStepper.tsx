'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { PROJECT_TABS, type ProjectTab } from './tabs';

interface Props {
  activeTab: ProjectTab;
  onTabChange: (tab: ProjectTab) => void;
}

export function ProjectStepper({ activeTab, onTabChange }: Props) {
  const currentStep = PROJECT_TABS.find((t) => t.id === activeTab)?.step ?? 1;

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-4 px-6 border-b bg-white">
      {PROJECT_TABS.map((tab, idx) => {
        const isDone = tab.step < currentStep;
        const isActive = tab.id === activeTab;

        return (
          <div key={tab.id} className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : isDone
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-muted text-muted-foreground hover:bg-secondary',
              )}
            >
              {isDone ? (
                <Check size={11} />
              ) : (
                <span className={cn(
                  'inline-flex size-4 items-center justify-center rounded-full text-[10px] font-bold',
                  isActive ? 'bg-white/20' : 'bg-border/60',
                )}>
                  {tab.step}
                </span>
              )}
              {tab.label}
            </button>
            {idx < PROJECT_TABS.length - 1 && (
              <div className={cn('h-px w-4 flex-shrink-0', isDone ? 'bg-green-400' : 'bg-border')} />
            )}
          </div>
        );
      })}
    </div>
  );
}
