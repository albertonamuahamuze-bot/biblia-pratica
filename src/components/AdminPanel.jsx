
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Loader2, LayoutList, Calendar, BookOpen, Users, Activity, RotateCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

function AdminPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();

  const [metrics, setMetrics] = useState({ activeToday: 0, returnedToday: 0 });
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  const [months, setMonths] = useState([]);
  const [loadingMonths, setLoadingMonths] = useState(true);
  const [isMonthDialogOpen, setIsMonthDialogOpen] = useState(false);
  const [isMonthEditing, setIsMonthEditing] = useState(false);
  const [monthForm, setMonthForm] = useState({
    id: null,
    nome: '',
    ano: new Date().getFullYear(),
    tema: '',
    descricao: '',
    status: 'rascunho',
    themeId: null
  });

  const [devotionals, setDevotionals] = useState([]);
  const [loadingDevotionals, setLoadingDevotionals] = useState(false);
  const [selectedMonthId, setSelectedMonthId] = useState(null); 
  const [isDevotionalEditing, setIsDevotionalEditing] = useState(false);
  const [isDevotionalDialogOpen, setIsDevotionalDialogOpen] = useState(false);
  const [devotionalForm, setDevotionalForm] = useState({
    day: '',
    biblical_reference: '',
    biblical_text: '',
    reflection: '',
    practical_application: '',
    daily_challenge: '',
    special_block: ''
  });

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const triggerCacheInvalidation = () => {
    window.dispatchEvent(new Event('biblia_pratica_invalidate_cache'));
    localStorage.setItem('biblia_pratica_invalidate_cache', Date.now().toString());
  };

  useEffect(() => {
    fetchMetrics();
    fetchMonths();
  }, []);

  useEffect(() => {
    if (selectedMonthId) {
      fetchDevotionals(selectedMonthId);
    } else {
      setDevotionals([]);
    }
  }, [selectedMonthId]);

  useEffect(() => {
    if (parseInt(devotionalForm.day) === 15) {
      if (devotionalForm.biblical_reference !== "João 3:3") {
        setDevotionalForm(prev => ({
          ...prev,
          biblical_reference: "João 3:3",
          biblical_text: "Jesus respondeu, e disse-lhe: Na verdade, na verdade te digo que aquele que não nascer de novo, não pode ver o reino de Deus.",
          special_block: prev.special_block || "Oração de Renovação: Senhor, renova minhas forças e minha fé. Que eu possa ver teu Reino em cada detalhe do meu dia."
        }));
        toast({
          title: "Regra do Dia 15 Aplicada",
          description: "Texto bíblico definido automaticamente.",
        });
      }
    }
  }, [devotionalForm.day]);

  const fetchMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.from('user_metrics').select('last_open_date, is_returned_user').gte('last_open_date', `${today}T00:00:00`);
      if (error) throw error;
      if (data) {
        setMetrics({ activeToday: data.length, returnedToday: data.filter(u => u.is_returned_user).length });
      }
    } catch (error) { console.error(error); } finally { setLoadingMetrics(false); }
  };

  const fetchMonths = async () => {
    try {
      setLoadingMonths(true);
      const { data, error } = await supabase.from('meses').select('*, monthly_themes(*)').order('ano', { ascending: false }).order('created_at', { ascending: false });
      if (error) throw error;
      const formattedData = (data || []).map(m => ({ ...m, themeData: m.monthly_themes && m.monthly_themes.length > 0 ? m.monthly_themes[0] : null }));
      setMonths(formattedData);
      
      if (!selectedMonthId && formattedData.length > 0) {
        const currentMonthName = monthNames[new Date().getMonth()];
        const currentYear = new Date().getFullYear();
        let defaultMonth = formattedData.find(m => m.nome === currentMonthName && m.ano === currentYear) || formattedData.find(m => m.status === 'publicado') || formattedData[0];
        if (defaultMonth) setSelectedMonthId(defaultMonth.id);
      }
    } catch (error) { toast({ variant: "destructive", title: "Erro", description: error.message }); } finally { setLoadingMonths(false); }
  };

  const handleMonthSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!monthForm.nome || !monthForm.ano || !monthForm.tema) throw new Error("Preencha campos obrigatórios.");
      const mesPayload = { nome: monthForm.nome, ano: parseInt(monthForm.ano), status: monthForm.status };
      let activeMonthId = monthForm.id;

      if (isMonthEditing && activeMonthId) {
        const { error: mesError } = await supabase.from('meses').update(mesPayload).eq('id', activeMonthId);
        if (mesError) throw mesError;
      } else {
        const { data: newMes, error: mesError } = await supabase.from('meses').insert([mesPayload]).select().single();
        if (mesError) throw mesError;
        activeMonthId = newMes.id;
      }

      const monthIndex = monthNames.indexOf(monthForm.nome) + 1;
      const themePayload = { mes_id: activeMonthId, month: monthIndex, theme: monthForm.tema, description: monthForm.descricao || null };
      const { data: existingTheme } = await supabase.from('monthly_themes').select('id').eq('mes_id', activeMonthId).maybeSingle();

      if (existingTheme) {
         const { error } = await supabase.from('monthly_themes').update(themePayload).eq('id', existingTheme.id);
         if (error) throw error;
      } else {
         const { error } = await supabase.from('monthly_themes').insert([themePayload]);
         if (error) throw error;
      }

      toast({ title: "Sucesso", description: `Mês salvo!` });
      setIsMonthDialogOpen(false); resetMonthForm(); fetchMonths(); triggerCacheInvalidation(); 
    } catch (error) { toast({ variant: "destructive", title: "Erro", description: error.message }); }
  };

  const handleMonthDelete = async (id) => {
    if (!window.confirm("Apagar mês e devocionais vinculados?")) return;
    try {
      await supabase.from('monthly_themes').delete().eq('mes_id', id);
      const { error } = await supabase.from('meses').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Mês excluído." });
      if (selectedMonthId === id) setSelectedMonthId(null);
      fetchMonths(); triggerCacheInvalidation(); 
    } catch (error) { toast({ variant: "destructive", title: "Erro", description: error.message }); }
  };

  const openMonthEdit = (item) => {
    setMonthForm({ id: item.id, nome: item.nome, ano: item.ano, status: item.status, tema: item.themeData?.theme || '', descricao: item.themeData?.description || '', themeId: item.themeData?.id || null });
    setIsMonthEditing(true); setIsMonthDialogOpen(true);
  };
  const openMonthCreate = () => { resetMonthForm(); setIsMonthEditing(false); setIsMonthDialogOpen(true); };
  const resetMonthForm = () => { setMonthForm({ id: null, nome: monthNames[new Date().getMonth()], ano: new Date().getFullYear(), tema: '', descricao: '', status: 'rascunho', themeId: null }); };

  const fetchDevotionals = async (monthId) => {
    if (!monthId) { setDevotionals([]); return; }
    try {
      setLoadingDevotionals(true);
      const { data, error } = await supabase.from('devotionals').select('*').eq('mes_id', monthId).order('day', { ascending: true });
      if (error) throw error;
      setDevotionals(data || []);
    } catch (error) { toast({ variant: "destructive", title: "Erro", description: error.message }); } finally { setLoadingDevotionals(false); }
  };

  const handleDevotionalSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!selectedMonthId) throw new Error("Selecione um mês primeiro.");
      const payload = { mes_id: selectedMonthId, day: parseInt(devotionalForm.day), biblical_reference: devotionalForm.biblical_reference, biblical_text: devotionalForm.biblical_text, reflection: devotionalForm.reflection, practical_application: devotionalForm.practical_application, daily_challenge: devotionalForm.daily_challenge, special_block: devotionalForm.special_block || null };
      const { error } = isDevotionalEditing ? await supabase.from('devotionals').update(payload).eq('id', devotionalForm.id) : await supabase.from('devotionals').insert([payload]);
      if (error) throw error;
      toast({ title: "Sucesso", description: `Devocional salvo!` });
      setIsDevotionalDialogOpen(false); resetDevotionalForm(); fetchDevotionals(selectedMonthId); triggerCacheInvalidation(); 
    } catch (error) { toast({ variant: "destructive", title: "Erro", description: error.message }); }
  };

  const handleDevotionalDelete = async (id) => {
    if (!window.confirm("Confirmar exclusão?")) return;
    try {
      const { error } = await supabase.from('devotionals').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Excluído." });
      fetchDevotionals(selectedMonthId); triggerCacheInvalidation(); 
    } catch (error) { toast({ variant: "destructive", title: "Erro", description: error.message }); }
  };

  const openDevotionalEdit = (item) => { setDevotionalForm(item); setIsDevotionalEditing(true); setIsDevotionalDialogOpen(true); };
  const openDevotionalCreate = () => { if (!selectedMonthId) { toast({ variant: "destructive", title: "Atenção", description: "Selecione um mês." }); return; } resetDevotionalForm(); setIsDevotionalEditing(false); setIsDevotionalDialogOpen(true); };
  const resetDevotionalForm = () => { setDevotionalForm({ day: '', biblical_reference: '', biblical_text: '', reflection: '', practical_application: '', daily_challenge: '', special_block: '' }); };

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl min-h-screen bg-background text-foreground font-sans">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-serif font-bold flex items-center gap-3 mb-2 text-foreground">
            <LayoutList className="w-8 h-8 text-primary" />
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground">Gerenciar conteúdo editorial</p>
        </div>
        <ThemeToggle />
      </div>

      <Tabs defaultValue="dashboard" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-8 w-full md:w-auto bg-card border border-border p-1 justify-start rounded-xl h-auto">
          <TabsTrigger value="dashboard" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium text-sm transition-all">
            <Activity className="w-4 h-4 mr-2" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="months" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium text-sm transition-all">
            <Calendar className="w-4 h-4 mr-2" /> Temas Mensais
          </TabsTrigger>
          <TabsTrigger value="devotionals" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium text-sm transition-all">
            <BookOpen className="w-4 h-4 mr-2" /> Conteúdo Diário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-8 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
             <h2 className="text-xl font-semibold text-foreground">Métricas Hoje</h2>
             <Button variant="outline" size="sm" onClick={fetchMetrics} disabled={loadingMetrics} className="border-border hover:bg-secondary/10">
               <RotateCw className={`w-4 h-4 mr-2 ${loadingMetrics ? 'animate-spin' : ''}`} /> Atualizar
             </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card border-border shadow-subtle rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Usuários Ativos</CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-serif text-foreground">{loadingMetrics ? '...' : metrics.activeToday}</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-subtle rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Retenção (D1)</CardTitle>
                <RotateCw className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-serif text-foreground">{loadingMetrics ? '...' : metrics.returnedToday}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="months" className="animate-in fade-in duration-500">
           <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-semibold text-foreground">Meses Cadastrados</h2>
            <Dialog open={isMonthDialogOpen} onOpenChange={setIsMonthDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openMonthCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wide rounded-full px-6 shadow-sm">
                  <Plus className="w-4 h-4 mr-2" /> Criar Mês
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl bg-card border-border shadow-subtle rounded-3xl p-8">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-2xl font-serif text-foreground">{isMonthEditing ? 'Editar Mês' : 'Novo Mês'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleMonthSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="nome">Mês</Label>
                        <select id="nome" className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary" value={monthForm.nome} onChange={(e) => setMonthForm({...monthForm, nome: e.target.value})} required>
                        {monthNames.map((name, idx) => <option key={idx} value={name}>{name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ano">Ano</Label>
                        <Input id="ano" type="number" className="h-12 rounded-xl border-border bg-background" value={monthForm.ano} onChange={(e) => setMonthForm({...monthForm, ano: e.target.value})} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tema">Tema Mensal</Label>
                    <Input id="tema" className="h-12 rounded-xl border-border bg-background" value={monthForm.tema} onChange={(e) => setMonthForm({...monthForm, tema: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição Editorial</Label>
                    <Textarea id="descricao" className="rounded-xl min-h-[100px] resize-none border-border bg-background" value={monthForm.descricao || ''} onChange={(e) => setMonthForm({...monthForm, descricao: e.target.value})} />
                  </div>
                  <div className="flex items-center space-x-3 pt-4 p-4 bg-secondary/10 rounded-xl border border-border">
                    <Switch id="status" checked={monthForm.status === 'publicado'} onCheckedChange={(checked) => setMonthForm({...monthForm, status: checked ? 'publicado' : 'rascunho'})} />
                    <Label htmlFor="status" className={`font-semibold ${monthForm.status === 'publicado' ? "text-primary" : "text-muted-foreground"}`}>
                        {monthForm.status === 'publicado' ? 'Publicado (Visível)' : 'Rascunho (Oculto)'}
                    </Label>
                  </div>
                  <div className="flex justify-end gap-3 pt-6">
                    <Button type="button" variant="ghost" onClick={() => setIsMonthDialogOpen(false)} className="rounded-full hover:bg-secondary/10">Cancelar</Button>
                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 shadow-sm">Salvar</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loadingMonths ? (
            <div className="flex justify-center h-48 items-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {months.length === 0 ? (
                  <p className="col-span-full text-center text-muted-foreground py-12 bg-card rounded-2xl border border-dashed border-border shadow-subtle">Nenhum mês cadastrado.</p>
                ) : (
                  months.map((item) => (
                    <motion.div key={item.id} layout className="bg-card rounded-2xl border border-border shadow-subtle p-6 relative overflow-hidden flex flex-col">
                       {item.status === 'publicado' && <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>}
                       <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-serif font-bold text-foreground mb-1">{item.nome} {item.ano}</h3>
                            <Badge variant={item.status === 'publicado' ? "default" : "secondary"} className="text-[10px] uppercase tracking-wider">
                                {item.status === 'publicado' ? 'Publicado' : 'Rascunho'}
                            </Badge>
                          </div>
                           <div className="flex gap-1 -mr-2">
                            <Button size="icon" variant="ghost" onClick={() => openMonthEdit(item)} className="hover:text-primary hover:bg-secondary/10"><Edit className="w-4 h-4 text-muted-foreground" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleMonthDelete(item.id)} className="hover:text-destructive hover:bg-secondary/10"><Trash2 className="w-4 h-4 text-muted-foreground" /></Button>
                           </div>
                       </div>
                       <div className="mt-auto pt-4 border-t border-border">
                         <p className="text-sm font-semibold text-primary mb-2 line-clamp-1">{item.themeData?.theme || 'Sem tema'}</p>
                         <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.themeData?.description || 'Nenhuma descrição editorial.'}</p>
                       </div>
                    </motion.div>
                  ))
                )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="devotionals" className="animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end mb-8 bg-card rounded-2xl shadow-subtle border border-border p-6">
            <div className="w-full md:w-1/2">
                <Label htmlFor="month-select" className="mb-3 block text-xs uppercase tracking-widest text-muted-foreground font-bold">
                    Selecione o Mês Editorial
                </Label>
                <div className="relative">
                    <select 
                        id="month-select"
                        className="flex h-14 w-full rounded-xl border border-input bg-background px-4 text-base focus-visible:ring-2 focus-visible:ring-primary appearance-none font-medium"
                        value={selectedMonthId || ''}
                        onChange={(e) => setSelectedMonthId(e.target.value)}
                    >
                        <option value="" disabled>Escolha um mês da lista...</option>
                        {months.map(m => (
                            <option key={m.id} value={m.id}>
                                {m.nome} {m.ano} — {m.status === 'publicado' ? 'Publicado' : 'Rascunho'}
                            </option>
                        ))}
                    </select>
                    <Calendar className="absolute right-4 top-4 h-5 w-5 text-muted-foreground pointer-events-none" />
                </div>
            </div>

            <Dialog open={isDevotionalDialogOpen} onOpenChange={setIsDevotionalDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openDevotionalCreate} disabled={!selectedMonthId} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-14 px-8 w-full md:w-auto font-semibold tracking-wide shadow-sm">
                  <Plus className="w-5 h-5 mr-2" /> Escrever Devocional
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border-border p-8 shadow-subtle">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-2xl font-serif text-foreground">{isDevotionalEditing ? 'Editar Conteúdo' : 'Novo Conteúdo Diário'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleDevotionalSubmit} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="day" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Dia (1-31)</Label>
                      <Input id="day" type="number" min="1" max="31" className="h-12 rounded-xl bg-background border-border" value={devotionalForm.day} onChange={(e) => setDevotionalForm({...devotionalForm, day: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reference" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Referência Bíblica</Label>
                      <Input id="reference" className="h-12 rounded-xl bg-background border-border" placeholder="Ex: João 3:16" value={devotionalForm.biblical_reference} onChange={(e) => setDevotionalForm({...devotionalForm, biblical_reference: e.target.value})} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Texto Bíblico</Label>
                    <Textarea value={devotionalForm.biblical_text} className="min-h-[100px] rounded-xl resize-none bg-background border-border" onChange={(e) => setDevotionalForm({...devotionalForm, biblical_text: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Reflexão</Label>
                    <Textarea value={devotionalForm.reflection} className="min-h-[150px] rounded-xl resize-none bg-background border-border" onChange={(e) => setDevotionalForm({...devotionalForm, reflection: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Aplicação Prática</Label>
                    <Textarea value={devotionalForm.practical_application} className="min-h-[100px] rounded-xl resize-none bg-background border-border" onChange={(e) => setDevotionalForm({...devotionalForm, practical_application: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Desafio do Dia</Label>
                    <Textarea value={devotionalForm.daily_challenge} className="min-h-[80px] rounded-xl resize-none bg-background border-border" onChange={(e) => setDevotionalForm({...devotionalForm, daily_challenge: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Oração (Opcional)</Label>
                    <Textarea value={devotionalForm.prayer || ''} className="min-h-[80px] rounded-xl resize-none bg-background border-border" placeholder="Oração guiada para fechar o devocional..." onChange={(e) => setDevotionalForm({...devotionalForm, prayer: e.target.value})} />
                  </div>
                  <div className="space-y-2 p-4 bg-secondary/10 rounded-xl border border-border">
                    <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Bloco Especial (Apenas Dia 15)</Label>
                    <Textarea value={devotionalForm.special_block || ''} className="bg-background rounded-lg resize-none border-border" onChange={(e) => setDevotionalForm({...devotionalForm, special_block: e.target.value})} />
                  </div>
                  <div className="flex justify-end gap-4 pt-6 border-t border-border">
                    <Button type="button" variant="ghost" onClick={() => setIsDevotionalDialogOpen(false)} className="rounded-full hover:bg-secondary/10">Cancelar</Button>
                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 shadow-sm">Salvar Conteúdo</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {!selectedMonthId ? (
             <div className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border border-dashed border-border shadow-subtle">
                <AlertCircle className="w-10 h-10 text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground font-medium">Selecione um mês no filtro acima para gerenciar os textos.</p>
             </div>
          ) : loadingDevotionals ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
          ) : (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-serif font-bold text-foreground">
                        {devotionals.length} devocionais escritos
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                    {devotionals.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-card rounded-3xl border border-dashed border-border shadow-subtle">
                        <BookOpen className="w-12 h-12 text-muted-foreground opacity-30 mb-4" />
                        <p className="text-muted-foreground font-medium mb-4">Nenhum devocional neste mês ainda.</p>
                        <Button onClick={openDevotionalCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-sm">
                            Escrever o primeiro
                        </Button>
                    </div>
                    ) : (
                    devotionals.map((item) => (
                        <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card rounded-2xl border border-border shadow-subtle p-6 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Dia {item.day}</span>
                            <div className="flex gap-2">
                                <Button size="icon" variant="secondary" onClick={() => openDevotionalEdit(item)} className="h-8 w-8 rounded-full"><Edit className="w-3.5 h-3.5" /></Button>
                                <Button size="icon" variant="secondary" onClick={() => handleDevotionalDelete(item.id)} className="h-8 w-8 rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors"><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                        </div>
                        <h3 className="text-lg font-serif font-bold text-foreground mb-2">{item.biblical_reference}</h3>
                        <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed italic">"{item.biblical_text}"</p>
                        </motion.div>
                    ))
                    )}
                </AnimatePresence>
                </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminPanel;
