import { useState } from 'react';
import { startLogin } from '../auth/oauth';

export function LoginScreen() {
  const [err, setErr] = useState<string | null>(null);
  const hasClient = Boolean(import.meta.env.VITE_YOTO_CLIENT_ID);
  return (
    <div className="login">
      <h2>Yoto Animated Icon Assigner</h2>
      <p>Sign in with your Yoto account to manage custom icons on your MYO cards.</p>
      {!hasClient && (
        <p className="error">
          <code>VITE_YOTO_CLIENT_ID</code> is not set. Register an app at{' '}
          <a href="https://dashboard.yoto.dev/applications/new" target="_blank" rel="noreferrer">
            dashboard.yoto.dev
          </a>{' '}
          and put the client id in <code>.env.local</code>, then restart the dev server.
        </p>
      )}
      <button
        disabled={!hasClient}
        onClick={() => {
          startLogin().catch((e) => setErr(String(e)));
        }}
      >
        Sign in with Yoto
      </button>
      {err && <p className="error">{err}</p>}
    </div>
  );
}
