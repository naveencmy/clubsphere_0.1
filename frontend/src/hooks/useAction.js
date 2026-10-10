import { useState } from 'react';
import { useApp } from '../app/providers/AppProvider.jsx';
export function useAction() {
  const { toast } = useApp();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  async function run(fn, message) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const value = await fn();
      if (message) toast(message);
      return value;
    } catch (e) {
      setError(e.message);
      toast(e.message, true);
      return undefined;
    } finally {
      setBusy(false);
    }
  }
  return { run, busy, error };
}
