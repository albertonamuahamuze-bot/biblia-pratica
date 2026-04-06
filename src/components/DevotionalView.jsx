
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, CheckCircle2, CalendarDays, RefreshCw as Refreshcw, 
  WifiOff, Pencil, X, Download
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationSettings } from '@/components/NotificationSettings';
import { PassiveCalendar } from '@/components/PassiveCalendar';
import { InstallButton } from '@/components/InstallButton';
import { DiscretePwaInstall } from '@/components/DiscretePwaInstall';
import { PrayerCard } from '@/components/PrayerCard';
import { VerseCard } from '@/components/VerseCard';
import { BibleReadingCard } from '@/components/BibleReadingCard';
import { ReflectionCard } from '@/components/ReflectionCard';
import { ApplicationCard } from '@/components/ApplicationCard';
import { ChallengeCard } from '@/components/ChallengeCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function DevotionalView() {
  const [devotional, setDevotional] = useState(null);
  const [monthlyTheme, setMonthlyTheme] = useState(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [debugInfo, setDebugInfo] = useState(null);
  
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState({ daysReadCount: 0, weekDates: [] });
  
  const [monthlyProgress, setMonthlyProgress] = useState(0);
  const [readDays, setReadDays] = useState([]);
  const [totalDaysInMonth, setTotalDaysInMonth] = useState(30);

  const [showCalendar, setShowCalendar] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  const [userName, setUserName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [nameInputValue, setNameInputValue] = useState('');
  const [hasFinishedReading, setHasFinishedReading] = useState(false);
  const [showDailyGreeting, setShowDailyGreeting] = useState(false);
  const [greetingMessage, setGreetingMessage] = useState('');

  const [showShareInvite, setShowShareInvite] = useState(false);
  const [daysSinceStart, setDaysSinceStart] = useState(0);

  const { toast } = useToast();

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const getMaputoDate = () => {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Maputo', year: 'numeric', month: 'numeric', day: 'numeric' });
      const parts = formatter.formatToParts(now);
      return { 
        day: parseInt(parts.find(p => p.type === 'day').value),
        month: parseInt(parts.find(p => p.type === 'month').value),
        year: parseInt(parts.find(p => p.type === 'year').value) 
      };
    } catch (e) {
      const now = new Date();
      return { day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() };
    }
  };

  const loadDevotionalAndTheme = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setIsSyncing(true);
      setDevotional(null); setMonthlyTheme(null); setDebugInfo(null);

      const { day: currentDay, month: currentMonthNum, year: currentYear } = getMaputoDate();
      const currentMonthName = monthNames[currentMonthNum - 1];

      let debugLog = { date: `${currentDay}/${currentMonthNum}/${currentYear}`, timezone: 'Africa/Maputo', error: null };

      const { data: monthData, error: monthError } = await supabase.from('meses').select('*').eq('ano', currentYear).eq('nome', currentMonthName).eq('status', 'publicado').maybeSingle();
      if (monthError) debugLog.error = "Erro ao buscar mês: " + monthError.message;

      if (monthData) {
        const { data: themeData } = await supabase.from('monthly_themes').select('theme, description').eq('mes_id', monthData.id).maybeSingle();
        if (themeData) setMonthlyTheme(themeData);
        
        const { data: devData, error: devError } = await supabase.from('devotionals').select('*').eq('mes_id', monthData.id).eq('day', currentDay).maybeSingle(); 
        if (devError) debugLog.error = "Erro ao buscar devocional: " + devError.message;
        
        if (devData) setDevotional(devData); 
        else debugLog.error = `Mês encontrado, mas devocional do dia ${currentDay} não existe.`;
      } else {
        debugLog.error = `Mês de ${currentMonthName}/${currentYear} não encontrado ou não publicado.`;
      }
      setDebugInfo(debugLog);
      if (isRefresh) toast({ title: 'Sincronizado', description: 'Verificação concluída.' });
    } catch (error) {
      setDebugInfo(prev => ({ ...prev, error: "Erro crítico: " + error.message }));
      if (isRefresh) toast({ variant: 'destructive', title: 'Erro de conexão', description: 'Não foi possível carregar o conteúdo.' });
    } finally {
      if (isRefresh) setIsSyncing(false);
      setLoading(false);
    }
  }, [toast]);

  const calculateStreak = useCallback(() => {
    try {
      const STORAGE_KEY = 'biblia_pratica_streak';
      const today = new Date().toISOString().split('T')[0];
      const yesterdayDate = new Date(); yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toISOString().split('T')[0];

      const storedData = localStorage.getItem(STORAGE_KEY);
      let currentStreak = 0;

      if (storedData) {
        const { count, lastDate } = JSON.parse(storedData);
        if (lastDate === today) currentStreak = count;
        else if (lastDate === yesterday) { currentStreak = count + 1; localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: currentStreak, lastDate: today })); } 
        else { currentStreak = 1; localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: currentStreak, lastDate: today })); }
      } else {
        currentStreak = 1; localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: currentStreak, lastDate: today }));
      }
      setStreak(currentStreak);
    } catch (error) { setStreak(1); }
  }, []);

  const calculateMonthlyProgress = useCallback(() => {
    try {
      const STORAGE_KEY = 'biblia_pratica_monthly_progress';
      const now = new Date();
      const currentMonth = now.getMonth() + 1; const currentYear = now.getFullYear(); const currentDay = now.getDate();
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      setTotalDaysInMonth(daysInMonth);

      let data = { month: currentMonth, year: currentYear, daysRead: [] };
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.month === currentMonth && parsed.year === currentYear) data = parsed;
      }

      if (!data.daysRead.includes(currentDay)) {
        data.daysRead.push(currentDay);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
      setMonthlyProgress(data.daysRead.length); setReadDays(data.daysRead);
    } catch (error) { setMonthlyProgress(1); setReadDays([new Date().getDate()]); setTotalDaysInMonth(30); }
  }, []);

  const updateGlobalHistory = useCallback(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const history = JSON.parse(localStorage.getItem('biblia_pratica_full_history') || '[]');
      if (!history.includes(today)) { history.push(today); localStorage.setItem('biblia_pratica_full_history', JSON.stringify(history)); }
    } catch (error) {}
  }, []);

  const checkWeeklySummary = useCallback(() => {
    const today = new Date();
    if (today.getDay() === 0) {
      const todayStr = today.toISOString().split('T')[0];
      const lastShown = localStorage.getItem('biblia_pratica_weekly_summary_last_shown');
      if (lastShown !== todayStr) {
        const history = JSON.parse(localStorage.getItem('biblia_pratica_full_history') || '[]');
        const weekDates = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today); d.setDate(today.getDate() - i);
          const dStr = d.toISOString().split('T')[0];
          weekDates.push({ date: dStr, isRead: history.includes(dStr), dayLabel: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][d.getDay()] });
        }
        setWeeklyStats({ daysReadCount: weekDates.filter(day => day.isRead).length, weekDates });
        setShowWeeklySummary(true); localStorage.setItem('biblia_pratica_weekly_summary_last_shown', todayStr);
      }
    }
  }, []);

  const checkAndShowCompletionMessage = useCallback(() => {
    const STORAGE_KEY = 'biblia_pratica_daily_read_confirmation';
    const today = new Date().toISOString().split('T')[0];
    if (localStorage.getItem(STORAGE_KEY) !== today) {
      const messages = ["Mais um passo. Parabéns pela constância.", "A disciplina de hoje constrói o amanhã.", "Leitura registrada com sucesso.", "Sua constância é admirável."];
      toast({
        description: <div className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-primary" /><span className="font-medium text-foreground">{messages[Math.floor(Math.random() * messages.length)]}</span></div>,
        duration: 4000, className: "bg-card border border-border shadow-sm rounded-xl"
      });
      localStorage.setItem(STORAGE_KEY, today); setHasFinishedReading(true);
    }
  }, [toast]);

  const checkDailyGreeting = useCallback((name) => {
    const today = new Date().toISOString().split('T')[0];
    if (localStorage.getItem('biblia_pratica_daily_greeting_shown') !== today) {
      const hour = new Date().getHours();
      let timeGreeting = "Bom dia"; if (hour >= 12 && hour < 18) timeGreeting = "Boa tarde"; if (hour >= 18) timeGreeting = "Boa noite";
      setGreetingMessage(name ? `${timeGreeting}, ${name}` : `${timeGreeting}. Próximo passo?`);
      setShowDailyGreeting(true);
      setTimeout(() => { setShowDailyGreeting(false); localStorage.setItem('biblia_pratica_daily_greeting_shown', today); }, 3500);
    }
  }, []);

  const checkSilentGrowthEligibility = useCallback(() => {
    const STORAGE_KEY = 'biblia_pratica_first_access'; const now = new Date(); const storedDate = localStorage.getItem(STORAGE_KEY);
    if (!storedDate) { localStorage.setItem(STORAGE_KEY, now.toISOString()); setDaysSinceStart(0); } 
    else {
      const diffDays = Math.ceil(Math.abs(now - new Date(storedDate)) / (1000 * 60 * 60 * 24));
      setDaysSinceStart(diffDays); if (diffDays >= 30) setShowShareInvite(true);
    }
  }, []);

  useEffect(() => {
    const handleInvalidation = () => loadDevotionalAndTheme(true);
    window.addEventListener('storage', (e) => { if (e.key === 'biblia_pratica_invalidate_cache') handleInvalidation(); });
    window.addEventListener('biblia_pratica_invalidate_cache', handleInvalidation);
    return () => { window.removeEventListener('storage', handleInvalidation); window.removeEventListener('biblia_pratica_invalidate_cache', handleInvalidation); };
  }, [loadDevotionalAndTheme]);

  useEffect(() => {
    const fetchData = async () => {
      calculateStreak(); calculateMonthlyProgress(); updateGlobalHistory(); checkSilentGrowthEligibility();
      const storedName = localStorage.getItem('biblia_pratica_user_name');
      if (storedName) { setUserName(storedName); setNameInputValue(storedName); }
      await loadDevotionalAndTheme(true);
      checkDailyGreeting(storedName);
      setTimeout(() => checkWeeklySummary(), 1000);
    };
    fetchData();
  }, [calculateStreak, calculateMonthlyProgress, updateGlobalHistory, checkWeeklySummary, loadDevotionalAndTheme, checkDailyGreeting, checkSilentGrowthEligibility]);

  useEffect(() => {
    if (!loading && devotional) { const timer = setTimeout(() => checkAndShowCompletionMessage(), 2000); return () => clearTimeout(timer); }
  }, [loading, devotional, checkAndShowCompletionMessage]);

  useEffect(() => {
    const handleOnline = async () => { setIsOnline(true); toast({ title: "Conexão restaurada", description: "Sincronizando dados..." }); await loadDevotionalAndTheme(true); };
    const handleOffline = () => { setIsOnline(false); toast({ title: "Modo Offline", description: "Conteúdo pode estar desatualizado.", variant: "outline" }); };
    window.addEventListener('online', handleOnline); window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [loadDevotionalAndTheme, toast]);

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (nameInputValue.trim()) {
      localStorage.setItem('biblia_pratica_user_name', nameInputValue.trim()); setUserName(nameInputValue.trim()); setShowNameInput(false);
      toast({ title: "Nome salvo.", description: `Bem-vindo(a), ${nameInputValue.trim()}.` });
    } else {
        localStorage.removeItem('biblia_pratica_user_name'); setUserName(''); setShowNameInput(false);
        toast({ description: "Nome removido." });
    }
  };

  const handleCopyLink = () => { navigator.clipboard.writeText(`${window.location.origin}`); toast({ title: "Link copiado", description: "Pronto para compartilhar." }); };
  const handleShare = async () => { if (navigator.share) { try { await navigator.share({ title: 'Bíblia Prática', text: 'Constância, clareza e direção. Fé aplicada à vida real.', url: window.location.origin }); } catch (err) {} } else handleCopyLink(); };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center font-sans">
      <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  const { month: displayMonth, day: displayDay } = getMaputoDate();
  const currentMonthName = monthNames[displayMonth - 1];

  const StreakBadge = () => (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="absolute top-6 left-4 md:left-8 z-40 flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-full shadow-sm">
      <Activity className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
      <span className="text-[10px] font-bold tracking-wider uppercase text-foreground">{streak} {streak === 1 ? 'dia' : 'dias'}</span>
      {(!isOnline || isSyncing) && <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">{!isOnline && <WifiOff className="w-3 h-3 text-muted-foreground" />}{isSyncing && <Refreshcw className="w-3 h-3 text-muted-foreground animate-spin" />}</div>}
    </motion.div>
  );

  const MonthlyProgressBar = () => (
    <div className="bg-card rounded-[12px] shadow-sm p-5 w-full border border-border">
      <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Progresso • {currentMonthName}</span>
          <span className="text-xs font-bold text-foreground">{monthlyProgress}/{totalDaysInMonth}</span>
      </div>
      <div className="w-full bg-secondary/20 rounded-full h-1.5 overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(Math.round((monthlyProgress / totalDaysInMonth) * 100), 100)}%` }} transition={{ duration: 1 }} className="bg-primary h-full rounded-full" />
      </div>
    </div>
  );

  const DailyGreetingOverlay = () => (
    <AnimatePresence>
      {showDailyGreeting && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="fixed top-24 left-0 right-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="bg-card border border-border px-6 py-3 rounded-full shadow-sm"><span className="text-sm font-semibold text-foreground tracking-wide">{greetingMessage}</span></div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!devotional) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 font-sans text-foreground">
       <DailyGreetingOverlay /><StreakBadge />
       <div className="absolute top-6 right-4 md:right-8 z-50 flex items-center gap-2"><InstallButton /><NotificationSettings /><ThemeToggle /></div>
       <div className="w-full max-w-sm mb-12"><MonthlyProgressBar /></div>
       <div className="text-center max-w-sm">
        <div className="w-12 h-1 bg-primary/20 mx-auto mb-8 rounded-full"></div>
        <h2 className="text-2xl font-serif font-bold mb-4">Nenhum conteúdo hoje</h2>
        <p className="text-muted-foreground mb-8 text-sm">O devocional para a data de hoje ainda não foi publicado.</p>
        <Button onClick={() => loadDevotionalAndTheme(true)} disabled={isSyncing} variant="outline" className="rounded-full px-8 h-12 border-border hover:bg-secondary/10 font-semibold uppercase tracking-widest text-xs shadow-sm">
          {isSyncing ? <><Refreshcw className="w-3.5 h-3.5 mr-2 animate-spin" /> Atualizando</> : "Verificar Novamente"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20 font-sans text-foreground overflow-x-hidden relative">
      <DailyGreetingOverlay />
      <StreakBadge />
      
      <div className="absolute top-6 right-4 md:right-8 z-50 flex items-center gap-2">
        <InstallButton />
        <Button variant="outline" size="icon" onClick={() => setShowCalendar(true)} className="rounded-full bg-card border-border shadow-sm hover:bg-secondary/10 hover:text-secondary-foreground transition-all" aria-label="Ver Calendário">
          <CalendarDays className="h-4 w-4 text-primary" strokeWidth={2} />
        </Button>
        <NotificationSettings />
        <ThemeToggle />
      </div>

      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="sm:max-w-sm bg-card border-border shadow-sm rounded-3xl p-8">
          <DialogHeader className="mb-6 text-center">
            <DialogTitle className="text-2xl font-serif text-foreground">Seu Progresso</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2">Registro de constância diária.</DialogDescription>
          </DialogHeader>
          <div className="py-2"><PassiveCalendar readDays={readDays} currentDay={devotional.day} month={new Date().getMonth() + 1} year={new Date().getFullYear()} /></div>
          <DialogFooter className="mt-8 sm:justify-center">
            <Button onClick={() => setShowCalendar(false)} variant="ghost" className="w-full text-muted-foreground font-semibold tracking-widest uppercase text-xs rounded-full h-12 hover:bg-secondary/10">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showThemeModal} onOpenChange={setShowThemeModal}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-sm rounded-3xl p-8 md:p-10">
          <DialogHeader className="text-left mb-6">
            <DialogTitle className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-2">Tema Editorial • {currentMonthName}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {monthlyTheme ? (
               <div className="space-y-6">
                  <h3 className="text-3xl font-serif font-bold text-primary leading-tight">{monthlyTheme.theme}</h3>
                  <div className="w-12 h-1 bg-primary/20 rounded-full"></div>
                  <p className="text-foreground leading-relaxed text-base">{monthlyTheme.description}</p>
               </div>
            ) : (
               <div className="text-center p-8 bg-secondary/10 rounded-[12px] border border-dashed border-border"><p className="text-sm font-medium text-muted-foreground">Tema não definido.</p></div>
            )}
          </div>
          <DialogFooter className="mt-8">
            <Button onClick={() => setShowThemeModal(false)} className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-widest uppercase text-xs h-12 shadow-sm">Retornar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-2xl mx-auto px-4 md:px-6 pt-24 md:pt-32 space-y-8 relative z-10">

        {/* Header */}
        <div className="text-center relative group mb-8">
          <div className="inline-flex flex-col items-center gap-3 mb-8">
            <span className="text-[10px] font-bold tracking-[0.25em] text-primary uppercase">Dia {devotional.day} • {currentMonthName}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6 tracking-tight">
            {userName ? `Olá, ${userName}.` : "Bíblia Prática."}
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-md mx-auto">Sabedoria prática para decisões melhores.</p>
          <button onClick={() => setShowThemeModal(true)} className="mt-8 text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors">Ver tema do mês</button>
          {userName && (
             <button onClick={() => { setShowNameInput(true); setNameInputValue(userName); }} className="absolute top-1/2 -translate-y-1/2 right-0 md:-right-8 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-muted-foreground hover:text-primary" title="Editar Nome"><Pencil className="w-4 h-4" strokeWidth={2} /></button>
          )}
        </div>

        <MonthlyProgressBar />

        <AnimatePresence>
            {hasFinishedReading && !userName && !showNameInput && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-card rounded-[12px] shadow-sm p-10 text-center border border-border">
                    <div className="flex flex-col items-center gap-6">
                        <h3 className="text-xl font-serif font-bold text-foreground">Como prefere ser chamado?</h3>
                        <Button variant="outline" onClick={() => setShowNameInput(true)} className="rounded-full border-border hover:bg-secondary/10 font-semibold tracking-widest uppercase text-xs h-12 px-8">Adicionar Nome</Button>
                    </div>
                </motion.div>
            )}
            {showNameInput && (
                 <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-[12px] shadow-sm p-8 relative border border-border">
                    <button onClick={() => setShowNameInput(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                    <form onSubmit={handleNameSubmit} className="flex flex-col gap-6">
                        <label className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Seu nome ou apelido</label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Input type="text" placeholder="Digite aqui..." value={nameInputValue} onChange={(e) => setNameInputValue(e.target.value)} className="flex-1 bg-background border-border rounded-xl h-14 text-base px-6 shadow-sm" autoFocus />
                            <Button type="submit" className="rounded-xl h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-widest uppercase text-xs px-8 shadow-sm">Salvar</Button>
                        </div>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>

        {/* 1. Versículo */}
        <VerseCard reference={devotional.biblical_reference} text={devotional.biblical_text} />

        {/* 2. Reflexão */}
        <ReflectionCard reflection={devotional.reflection} />

        {/* 3. Aplicação */}
        <ApplicationCard application={devotional.practical_application} />

        {/* 4. Desafio */}
        <ChallengeCard challenge={devotional.daily_challenge} />

        {/* 5. Oração */}
        <PrayerCard prayer={devotional.prayer} />

        {/* Special Block handled as BibleReadingCard if it exists, or standalone */}
        {devotional.day === 15 && devotional.special_block && (
          <BibleReadingCard text={devotional.special_block} />
        )}

        <div className="text-center pt-16 pb-8">
          <div className="w-10 h-1 bg-border mx-auto mb-8 rounded-full"></div>
          <p className="text-[10px] tracking-[0.25em] text-muted-foreground uppercase font-bold">Bíblia Prática</p>
          <p className="text-xs text-muted-foreground mt-2 font-medium">Fé aplicada à vida real.</p>
        </div>

        {showShareInvite && (
          <div className="mb-8 bg-card rounded-[12px] shadow-sm p-10 text-center border border-border">
              <div className="flex flex-col items-center gap-6">
                  <p className="text-[10px] tracking-[0.2em] font-bold text-primary uppercase">{daysSinceStart}+ dias de jornada</p>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                      "O que é verdadeiro cresce em silêncio. Se este hábito tem trazido clareza, considere compartilhar com quem busca o mesmo."
                  </p>
                  <div className="flex flex-wrap justify-center gap-4 pt-4 w-full">
                      <Button variant="ghost" onClick={handleCopyLink} className="text-xs font-bold tracking-widest uppercase rounded-full h-12 px-8 hover:bg-secondary/10">Copiar Link</Button>
                      <Button variant="outline" onClick={handleShare} className="text-xs border-border font-bold tracking-widest uppercase rounded-full h-12 px-8 shadow-sm bg-background hover:bg-secondary/10">Enviar Convite</Button>
                  </div>
              </div>
          </div>
        )}

        <DiscretePwaInstall />
      </div>
      
      <Dialog open={showWeeklySummary} onOpenChange={setShowWeeklySummary}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-sm rounded-3xl p-8 md:p-10">
          <DialogHeader className="text-center mb-8">
            <DialogTitle className="text-2xl font-serif text-foreground">Ritmo Semanal</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2">A constância é feita de pequenos passos.</DialogDescription>
          </DialogHeader>
          
          <div className="py-2">
            <div className="flex items-center justify-between px-2 mb-10">
              {weeklyStats.weekDates.map((day, index) => (
                <div key={index} className="flex flex-col items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${day.isRead ? 'bg-primary text-primary-foreground border-transparent shadow-sm' : 'bg-background border-border text-muted-foreground/50'}`}>
                    {day.isRead ? <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} /> : <div className="w-1.5 h-1.5 rounded-full bg-current opacity-30" />}
                  </div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">{day.dayLabel}</span>
                </div>
              ))}
            </div>

            <div className="text-center p-6 bg-background rounded-2xl border border-border">
              <p className="text-lg font-serif font-bold text-foreground mb-2">
                {weeklyStats.daysReadCount === 7 && "Constância perfeita."}
                {weeklyStats.daysReadCount >= 5 && weeklyStats.daysReadCount < 7 && "Um ritmo admirável."}
                {weeklyStats.daysReadCount >= 3 && weeklyStats.daysReadCount < 5 && "Bons passos dados."}
                {weeklyStats.daysReadCount > 0 && weeklyStats.daysReadCount < 3 && "O importante é não parar."}
                {weeklyStats.daysReadCount === 0 && "Nova semana, novo recomeço."}
              </p>
              <p className="text-[10px] text-primary tracking-[0.2em] uppercase font-bold mt-4">
                {weeklyStats.daysReadCount} de 7 dias
              </p>
            </div>
          </div>

          <DialogFooter className="mt-8">
            <Button onClick={() => setShowWeeklySummary(false)} className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-widest uppercase text-xs h-14 shadow-sm">Continuar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DevotionalView;
