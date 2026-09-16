import { useCallback, useEffect, useState } from 'react';
import { Droplets } from 'lucide-react';
import { useCalculations } from './hooks/useCalculations';
import Home from './pages/Home';
import ToastStack from './components/Toast';

function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-emerald-800 to-teal-700">
      <div className="animate-pulse rounded-3xl bg-white/15 p-5 ring-1 ring-white/25">
        <Droplets className="h-10 w-10 text-white" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold tracking-wide text-emerald-100">
        Loading KunsatCalculator…
      </p>
      <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/20">
        <div className="h-full w-1/2 animate-[slide_0.9s_ease-in-out_infinite] rounded-full bg-white" />
      </div>
      <style>{`@keyframes slide { 0% { transform: translateX(-100%);} 100% { transform: translateX(300%);} }`}</style>
    </div>
  );
}

export default function App() {
  const calc = useCalculations();
  const [started, setStarted] = useState(false);
  const [module, setModule] = useState('infiltrometer');
  const [booted, setBooted] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('ksat-dark');
      if (saved !== null) return saved === '1';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('ksat-dark', dark ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [dark]);

  const toggleDark = useCallback(() => setDark((d) => !d), []);

  const toast = useCallback((msg, type = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const dismissToast = useCallback(
    (id) => setToasts((t) => t.filter((x) => x.id !== id)),
    [],
  );

  return (
    <>
      {!booted && <SplashScreen />}
      <Home
        calc={calc}
        started={started}
        module={module}
        onModuleChange={setModule}
        onStart={(value) => {
          setStarted(value);
          if (value) window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        dark={dark}
        toggleDark={toggleDark}
        toast={toast}
      />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
