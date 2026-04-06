import React from 'react';
import { Check, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PassiveCalendar({ 
  year = new Date().getFullYear(), 
  month = new Date().getMonth() + 1, 
  readDays = [], 
  currentDay = new Date().getDate() 
}) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay(); 
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstWeekday }, (_, i) => i);
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const monthNameRaw = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
  const monthName = monthNameRaw.charAt(0).toUpperCase() + monthNameRaw.slice(1);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-2 text-foreground">
          <CalendarDays className="w-5 h-5 text-primary" />
          <span className="text-sm font-serif font-bold tracking-wide">Mensal</span>
        </div>
        <div className="text-xs text-muted-foreground font-bold tracking-widest uppercase">
          {monthName}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-4 gap-x-2 sm:gap-x-3 bg-secondary/50 p-4 rounded-2xl border border-border">
        {weekDays.map((d, i) => (
          <div key={`head-${i}`} className="text-center text-[10px] font-bold text-muted-foreground uppercase opacity-80">
            {d}
          </div>
        ))}

        {blanks.map((b) => <div key={`blank-${b}`} />)}

        {days.map((day) => {
          const isRead = readDays.includes(day);
          const isToday = day === currentDay;
          const isFuture = day > currentDay;
          
          return (
            <div key={day} className="flex justify-center">
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                  isRead && "bg-primary text-primary-foreground shadow-sm",
                  !isRead && isToday && "bg-background text-accent ring-2 ring-accent ring-inset",
                  !isRead && !isToday && "text-foreground bg-border/40",
                  isFuture && "opacity-30 cursor-default bg-transparent"
                )}
              >
                {isRead ? <Check className="w-4 h-4" strokeWidth={3} /> : <span>{day}</span>}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex items-center justify-center gap-6 mt-6 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
          <span>Lido</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2.5 h-2.5 rounded-full ring-2 ring-accent ring-inset bg-transparent"></div>
           <span>Hoje</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2.5 h-2.5 rounded-full bg-border/40"></div>
           <span>Pendente</span>
        </div>
      </div>
    </div>
  );
}