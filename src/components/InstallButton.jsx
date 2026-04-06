
import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InstallButton() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone || 
                       document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS && !standalone) {
      setCanInstall(true);
    }

    const handler = (e) => {
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const triggerInstall = () => {
    window.dispatchEvent(new Event('trigger-install-prompt'));
  };

  if (isStandalone || !canInstall) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={triggerInstall}
      className="rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-sm hover:bg-secondary transition-all text-primary"
      title="Instalar App"
    >
      <Download className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">Instalar Aplicativo</span>
    </Button>
  );
}
