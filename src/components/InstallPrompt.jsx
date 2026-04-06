import React, { useState, useEffect } from 'react';
import { X, Download, Share, PlusSquare, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Detect Standalone Mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone || 
                       document.referrer.includes('android-app://');
    
    setIsStandalone(standalone);
    if (standalone) return;

    // Check Eligibility
    const checkEligibility = () => {
      const STORAGE_KEY_INSTALLED = 'pwa_installed_success';
      const STORAGE_KEY_LAST_SEEN = 'pwa_prompt_last_seen_date';
      const STORAGE_KEY_DISMISSED_MONTH = 'pwa_prompt_dismissed_month'; // 'YYYY-MM'

      if (localStorage.getItem(STORAGE_KEY_INSTALLED) === 'true') return false;

      const now = new Date();
      const currentMonthStr = `${now.getFullYear()}-${now.getMonth() + 1}`;
      const lastSeen = localStorage.getItem(STORAGE_KEY_LAST_SEEN);
      const dismissedMonth = localStorage.getItem(STORAGE_KEY_DISMISSED_MONTH);

      // 1. First Visit (never seen)
      if (!lastSeen) return true;

      // 2. Reappear on Day 1 of Month (if not dismissed this specific month)
      if (now.getDate() === 1 && dismissedMonth !== currentMonthStr) return true;

      // 3. User clicked "Not Now" previously, but maybe we want to show it again if they triggered it manually? 
      // (Manual trigger logic is separate, this is auto-show logic)
      
      return false;
    };

    // Chrome/Android Event Listener
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (checkEligibility()) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      localStorage.setItem('pwa_installed_success', 'true');
      setShowPrompt(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
    });

    // iOS Auto-show logic (since iOS doesn't fire beforeinstallprompt)
    if (iOS && checkEligibility()) {
      // Small delay for better UX
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    // Android / Desktop Chrome
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem('pwa_installed_success', 'true');
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } 
    // iOS Handling
    else if (isIOS) {
      setShowPrompt(false);
      setShowIOSInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${now.getMonth() + 1}`;
    
    localStorage.setItem('pwa_prompt_last_seen_date', now.toISOString());
    // Mark this month as dismissed so we don't spam on day 1 again
    if (now.getDate() === 1) {
       localStorage.setItem('pwa_prompt_dismissed_month', currentMonthStr);
    }
  };

  // Allow parent components or global event to trigger this manually
  useEffect(() => {
    const handleManualTrigger = () => {
      if (isStandalone) return;
      if (deferredPrompt || isIOS) {
        setShowPrompt(true);
      }
    };
    window.addEventListener('trigger-install-prompt', handleManualTrigger);
    return () => window.removeEventListener('trigger-install-prompt', handleManualTrigger);
  }, [deferredPrompt, isIOS, isStandalone]);


  // Don't render anything if already installed
  if (isStandalone) return null;

  return (
    <>
      {/* Main Prompt (Bottom Sheet style) */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-[60] p-4 flex justify-center pointer-events-none"
          >
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 px-5 py-4 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center gap-4 max-w-xl w-full pointer-events-auto ring-1 ring-black/5 dark:ring-white/10">
              
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-base font-bold text-amber-900 dark:text-amber-100 mb-1">
                  Instale a Bíblia Prática
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Tenha acesso diário mesmo sem internet. Leva menos de 10 segundos.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <Button 
                  onClick={handleDismiss}
                  variant="ghost" 
                  size="sm"
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex-1 md:flex-initial"
                >
                  Agora não
                </Button>
                <Button 
                  onClick={handleInstallClick}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-medium flex-1 md:flex-initial shadow-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Instalar agora
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Instructions Dialog */}
      <Dialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
        <DialogContent className="sm:max-w-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-center text-amber-900 dark:text-amber-100">Instalar no iPhone</DialogTitle>
            <DialogDescription className="text-center">
              Siga os passos abaixo para adicionar à tela de início:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="w-8 h-8 flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded-full text-blue-600 dark:text-blue-400">
                <Share className="w-4 h-4" />
              </div>
              <div className="text-sm">
                1. Toque no botão <span className="font-semibold text-slate-900 dark:text-slate-100">Compartilhar</span> na barra inferior.
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="w-8 h-8 flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300">
                <PlusSquare className="w-4 h-4" />
              </div>
              <div className="text-sm">
                 2. Selecione <span className="font-semibold text-slate-900 dark:text-slate-100">Adicionar à Tela de Início</span>.
              </div>
            </div>
            
             <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="w-8 h-8 flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="text-sm">
                 3. Confirme clicando em <span className="font-semibold text-slate-900 dark:text-slate-100">Adicionar</span> no canto superior.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowIOSInstructions(false)} variant="secondary" className="w-full">
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}