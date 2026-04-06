import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Share, PlusSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function DiscretePwaInstall() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone || 
                       document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    const handler = (e) => {
      setCanInstall(true);
    };

    if (ios && !standalone) {
      setCanInstall(true);
    }

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleClick = () => {
    if (isIOS) {
      setShowManualInstructions(true);
    } else {
      window.dispatchEvent(new Event('trigger-install-prompt'));
    }
  };

  if (isStandalone || !canInstall) return null;

  return (
    <>
      <div className="w-full max-w-md mx-auto mt-8 mb-4 px-6 text-center">
        <Button 
            onClick={handleClick}
            variant="outline"
            className="w-full sm:w-auto bg-card border-border hover:bg-secondary text-foreground rounded-xl px-8 py-6 h-auto text-base font-semibold shadow-sm transition-all"
        >
            <span className="mr-2 text-lg">📲</span> Adicionar à tela inicial
        </Button>
        <p className="mt-3 text-xs text-muted-foreground font-light max-w-xs mx-auto leading-relaxed">
            Instalar o app permite acesso mais rápido e leitura diária sem distrações.
        </p>
      </div>

      <Dialog open={showManualInstructions} onOpenChange={setShowManualInstructions}>
        <DialogContent className="sm:max-w-xs bg-card border-border rounded-2xl">
           <DialogHeader>
             <DialogTitle className="text-center text-foreground font-serif">Instalar no iPhone</DialogTitle>
             <DialogDescription className="text-center text-muted-foreground text-sm mt-2">
                Acesse como um aplicativo nativo em 3 passos:
             </DialogDescription>
           </DialogHeader>
           <div className="space-y-4 pt-4 pb-2">
              <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50 border border-border">
                 <Share className="w-6 h-6 text-primary shrink-0" />
                 <p className="text-sm text-foreground text-left">1. Toque no botão <span className="font-bold">Compartilhar</span> na barra de navegação.</p>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50 border border-border">
                 <PlusSquare className="w-6 h-6 text-muted-foreground shrink-0" />
                 <p className="text-sm text-foreground text-left">2. Role para cima e escolha <span className="font-bold">Adicionar à Tela de Início</span>.</p>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50 border border-border">
                 <span className="text-xl shrink-0">✨</span>
                 <p className="text-sm text-foreground text-left">3. Confirme em <span className="font-bold">Adicionar</span>.</p>
              </div>
           </div>
        </DialogContent>
      </Dialog>
    </>
  );
}