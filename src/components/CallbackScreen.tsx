import { useEffect, useState } from 'react';
import { handleCallback } from '../auth/oauth';

interface Props {
  onDone: () => void;
}

export function CallbackScreen({ onDone }: Props) {
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    handleCallback()
      .then(() => {
        window.history.replaceState({}, '', import.meta.env.BASE_URL);
        onDone();
      })
      .catch((e) => setErr(String(e)));
  }, [onDone]);
  return (
    <div className="login">
      {err ? (
        <>
          <p className="error">{err}</p>
          <button onClick={() => (window.location.href = import.meta.env.BASE_URL)}>Back to login</button>
        </>
      ) : (
        <p>Signing you in…</p>
      )}
    </div>
  );
}
