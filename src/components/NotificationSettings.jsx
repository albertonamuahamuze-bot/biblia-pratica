import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

export function NotificationSettings() {
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState("06:30"); 
  const [permission, setPermission] = useState(Notification.permission);
  const { toast } = useToast();

  useEffect(() => {
    const savedSettings = localStorage.getItem('biblia_pratica_notifications');
    if (savedSettings) {
      const { enabled: savedEnabled, time: savedTime } = JSON.parse(savedSettings);
      if (savedEnabled && Notification.permission !== 'granted') {
        setEnabled(false);
        updateSettings(false, savedTime);
      } else {
        setEnabled(savedEnabled);
        setTime(savedTime || "06:30");
      }
    }
  }, []);

  const updateServiceWorker = (isEnabled, currentTime) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_SETTINGS',
        payload: { enabled: isEnabled, time: currentTime, lastSentDate: null }
      });
    }
  };

  const updateSettings = (isEnabled, currentTime) => {
    const settings = { enabled: isEnabled, time: currentTime };
    localStorage.setItem('biblia_pratica_notifications', JSON.stringify(settings));
    updateServiceWorker(isEnabled, currentTime);
  };

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast({ variant: "destructive", title: "Incompatível", description: "Seu navegador não suporta lembretes." });
      return false;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== 'granted') {
      toast({ variant: "destructive", title: "Acesso necessário", description: "Permissão negada." });
      return false;
    }
    return true;
  };

  const handleToggle = async (checked) => {
    if (checked) {
      const granted = await requestPermission();
      if (granted) {
        setEnabled(true); updateSettings(true, time);
        toast({ title: "Ativado", description: `Aviso às ${time}.` });
      } else { setEnabled(false); }
    } else {
      setEnabled(false); updateSettings(false, time);
      toast({ description: "Lembretes pausados." });
    }
  };

  const handleTimeChange = (e) => handleSetTime(e.target.value);
  const handleSetTime = (newTime) => {
    setTime(newTime);
    if (enabled) { updateSettings(true, newTime); toast({ description: `Atualizado para ${newTime}.` }); } 
    else { updateSettings(false, newTime); }
  };

  const PresetButton = ({ presetTime, icon: Icon, label }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => handleSetTime(presetTime)}
      className={cn(
        "flex-1 flex flex-col items-center gap-2 h-auto py-3 bg-card border-border hover:bg-secondary transition-colors rounded-xl",
        time === presetTime ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" : "text-muted-foreground"
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      <span className="text-xs opacity-80">{presetTime}</span>
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full bg-card border border-border shadow-sm hover:bg-secondary">
          {enabled ? <Bell className="h-[1.2rem] w-[1.2rem] text-primary" /> : <BellOff className="h-[1.2rem] w-[1.2rem] text-muted-foreground" />}
          <span className="sr-only">Ajustar Lembretes</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] bg-card border-border shadow-sm rounded-3xl p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="flex items-center gap-3 text-xl font-serif text-foreground">
            <Clock className="w-5 h-5 text-primary" />
            Lembrete Diário
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            A regularidade ajuda a fixar o hábito da leitura.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl border border-border">
            <Label htmlFor="notifications" className="flex flex-col cursor-pointer">
              <span className="font-semibold text-foreground">Ativar notificações</span>
            </Label>
            <Switch id="notifications" checked={enabled} onCheckedChange={handleToggle} />
          </div>

          <AnimatePresence>
            {enabled && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="space-y-6 pt-2">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Horários Comuns</Label>
                    <div className="flex gap-4">
                      <PresetButton presetTime="06:30" icon={Sun} label="Manhã" />
                      <PresetButton presetTime="20:30" icon={Moon} label="Noite" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="time" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Horário Exato</Label>
                    <input
                      type="time"
                      id="time"
                      value={time}
                      onChange={handleTimeChange}
                      className="flex h-14 w-full rounded-xl border border-input bg-background px-4 text-base focus-visible:ring-2 focus-visible:ring-primary appearance-none font-medium text-foreground"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}