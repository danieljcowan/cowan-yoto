import { useEffect, useState } from 'react';
import { hasOAuthCallback, isLoggedIn, logout } from './auth/oauth';
import { resetIconCache } from './lib/iconCache';
import { LoginScreen } from './components/LoginScreen';
import { CallbackScreen } from './components/CallbackScreen';
import { CardsScreen } from './components/CardsScreen';
import { CardDetailScreen } from './components/CardDetailScreen';
import { EditorScreen } from './components/EditorScreen';
import { ApplyScreen } from './components/ApplyScreen';

type View =
  | { kind: 'login' }
  | { kind: 'callback' }
  | { kind: 'draw' }
  | { kind: 'apply'; gif: Blob }
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
    return isLoggedIn() ? { kind: 'draw' } : { kind: 'login' };
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

  const inApp = view.kind !== 'login' && view.kind !== 'callback';
  const onDrawSide = view.kind === 'draw' || view.kind === 'apply';

  return (
    <div className="app">
      {inApp && (
        <header className="bar">
          <h1>Yoto Animated Icon Creator</h1>
          <div className="right">
            <nav className="nav">
              <button
                className={onDrawSide ? 'nav-active' : 'secondary'}
                onClick={() => setView({ kind: 'draw' })}
              >
                Create
              </button>
              <button
                className={!onDrawSide ? 'nav-active' : 'secondary'}
                onClick={() => setView({ kind: 'cards' })}
              >
                My Cards
              </button>
            </nav>
            <button className="secondary" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </header>
      )}

      {view.kind === 'login' && <LoginScreen />}
      {view.kind === 'callback' && (
        <CallbackScreen onDone={() => setView({ kind: 'draw' })} />
      )}
      {inApp && (
        <div style={{ display: view.kind === 'draw' ? undefined : 'none' }}>
          <EditorScreen onApply={(gif) => setView({ kind: 'apply', gif })} />
        </div>
      )}
      {view.kind === 'apply' && (
        <ApplyScreen
          gif={view.gif}
          onBack={() => setView({ kind: 'draw' })}
          onDone={() => setView({ kind: 'draw' })}
          toast={showToast}
        />
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
