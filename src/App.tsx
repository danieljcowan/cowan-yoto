import { useEffect, useState } from 'react';
import { hasOAuthCallback, isLoggedIn, logout } from './auth/oauth';
import { resetIconCache } from './lib/iconCache';
import { LoginScreen } from './components/LoginScreen';
import { CallbackScreen } from './components/CallbackScreen';
import { CardsScreen } from './components/CardsScreen';
import { CardDetailScreen } from './components/CardDetailScreen';

type View =
  | { kind: 'login' }
  | { kind: 'callback' }
  | { kind: 'cards' }
  | { kind: 'card'; id: string };

interface Toast {
  msg: string;
  kind: 'good' | 'bad';
  id: number;
}

export function App() {
  const [view, setView] = useState<View>(() => {
    if (hasOAuthCallback()) return { kind: 'callback' };
    return isLoggedIn() ? { kind: 'cards' } : { kind: 'login' };
  });
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  function showToast(msg: string, kind: 'good' | 'bad' = 'good') {
    setToast({ msg, kind, id: Date.now() });
  }

  function handleLogout() {
    logout();
    resetIconCache();
    setView({ kind: 'login' });
  }

  return (
    <div className="app">
      {view.kind !== 'login' && view.kind !== 'callback' && (
        <header className="bar">
          <h1>Yoto Animated Icon Assigner</h1>
          <div className="right">
            <button className="secondary" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </header>
      )}

      {view.kind === 'login' && <LoginScreen />}
      {view.kind === 'callback' && (
        <CallbackScreen onDone={() => setView({ kind: 'cards' })} />
      )}
      {view.kind === 'cards' && (
        <CardsScreen onOpen={(id) => setView({ kind: 'card', id })} />
      )}
      {view.kind === 'card' && (
        <CardDetailScreen
          cardId={view.id}
          onBack={() => setView({ kind: 'cards' })}
          toast={showToast}
        />
      )}

      {toast && <div className={`toast ${toast.kind}`}>{toast.msg}</div>}
    </div>
  );
}
