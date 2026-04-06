
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import DevotionalView from '@/components/DevotionalView';
import AdminPanel from '@/components/AdminPanel';
import AboutPage from '@/pages/AboutPage';
import { Toaster } from '@/components/ui/toaster';
import { InstallPrompt } from '@/components/InstallPrompt';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/customSupabaseClient';
import { BookOpen } from 'lucide-react';

function NavigationHeader() {
  const location = useLocation();
  
  return (
    <header className="shadow-md sticky top-0 z-[100]" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-card)' }}>
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <BookOpen className="h-5 w-5 transition-colors" style={{ color: 'var(--color-secondary)' }} />
          <span className="font-serif font-bold text-lg tracking-wide">Bíblia Prática</span>
        </Link>
        
        <nav className="flex items-center gap-2 md:gap-4">
          <Link 
            to="/" 
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors`}
            style={{ 
              color: location.pathname === '/' ? 'var(--color-secondary)' : 'var(--color-card)',
              backgroundColor: location.pathname === '/' ? 'var(--color-hover)' : 'transparent'
            }}
          >
            Devocional
          </Link>
          <Link 
            to="/about" 
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors`}
            style={{ 
              color: location.pathname === '/about' ? 'var(--color-secondary)' : 'var(--color-card)',
              backgroundColor: location.pathname === '/about' ? 'var(--color-hover)' : 'transparent'
            }}
          >
            Sobre
          </Link>
        </nav>
      </div>
    </header>
  );
}

function App() {
  
  // Daily Retention Tracking System
  useEffect(() => {
    const trackDailyRetention = async () => {
      try {
        const STORAGE_KEY_ID = 'biblia_pratica_device_id';
        const STORAGE_KEY_DATE = 'biblia_pratica_last_track_date';
        
        // 1. Identify User
        let deviceId = localStorage.getItem(STORAGE_KEY_ID);
        if (!deviceId) {
          deviceId = crypto.randomUUID();
          localStorage.setItem(STORAGE_KEY_ID, deviceId);
        }

        // 2. Check Dates
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const lastTrackDate = localStorage.getItem(STORAGE_KEY_DATE);

        // Avoid double counting same day
        if (lastTrackDate === todayStr) return;

        // 3. Determine if "Returned User" (Opened yesterday)
        let isReturnedUser = false;
        if (lastTrackDate) {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (lastTrackDate === yesterdayStr) {
            isReturnedUser = true;
          }
        }

        // 4. Send to Supabase
        const { error } = await supabase
          .from('user_metrics')
          .upsert({ 
            device_id: deviceId,
            last_open_date: new Date().toISOString(),
            is_returned_user: isReturnedUser,
          }, { onConflict: 'device_id' });

        if (error) {
          console.error('Error tracking retention:', error);
        } else {
          // 5. Update Local Storage
          localStorage.setItem(STORAGE_KEY_DATE, todayStr);
        }

      } catch (err) {
        console.error('Retention tracking failed:', err);
      }
    };

    trackDailyRetention();
  }, []);

  return (
    <ThemeProvider defaultTheme="system" storageKey="biblia-pratica-theme">
      <BrowserRouter>
        <Helmet>
          <title>Bíblia Prática - Devocional Diário</title>
          <meta name="description" content="Devocional focado em vida real e constância. 5 minutos diários de sabedoria prática para alinhar seu dia." />
        </Helmet>
        
        <div className="min-h-screen transition-colors duration-300 flex flex-col font-sans" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
          
          <NavigationHeader />

          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<DevotionalView />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </main>
          
          <Toaster />
          <InstallPrompt />

          {/* App Footer */}
          <footer className="py-10 text-center mt-auto border-t" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
             <div className="flex flex-col gap-4">
                <p className="text-xs font-medium tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                  Bíblia Prática — fé aplicada à vida real.
                </p>
                
                <nav className="flex justify-center gap-6 text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--color-text-secondary)' }}>
                  <Link 
                    to="/about" 
                    className="transition-colors hover:opacity-80"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    Sobre o Projeto
                  </Link>
                </nav>
             </div>
          </footer>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
