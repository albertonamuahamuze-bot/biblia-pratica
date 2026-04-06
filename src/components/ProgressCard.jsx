
import React from 'react';
import { TrendingUp } from 'lucide-react';

export function ProgressCard({ progress = 0, total = 100, label = "Progresso" }) {
  const percentage = Math.min(Math.max(Math.round((progress / total) * 100) || 0, 0), 100);

  return (
    <div className="bg-card rounded-[16px] shadow-subtle p-[24px] border border-border transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg m-0 text-foreground">{label}</h3>
        </div>
        <span className="text-sm font-medium text-muted-foreground">{percentage}%</span>
      </div>
      
      <div className="w-full bg-secondary/20 rounded-full h-2.5 overflow-hidden">
        <div 
          className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-sm text-muted-foreground mt-4 text-center m-0">
        {progress} de {total} concluídos
      </p>
    </div>
  );
}
