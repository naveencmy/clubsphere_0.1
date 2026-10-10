import { createContext, useContext, useEffect, useState } from 'react';
import { snapshot } from '../../services/serviceFactory.js';
import { subscribe } from '../../services/subscription.js';
const Context = createContext(null);
export function AppProvider({ children }) {
  const [data, setData] = useState(snapshot),
    [toasts, setToasts] = useState([]),
    [loading, setLoading] = useState(true),
    [cart, setCart] = useState([]);
  useEffect(() => {
    const unsubscribe = subscribe(() => setData(snapshot()));
    const timer = setTimeout(() => setLoading(false), 180);
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);
  useEffect(() => setCart([]), [data.session.userId, data.session.clubId]);
  const toast = (message, error = false) => {
    const key = crypto.randomUUID();
    setToasts((t) => [...t, { key, message, error }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.key !== key)), 6000);
  };
  return (
    <Context.Provider value={{ data, toast, loading, cart, setCart }}>
      {children}
      <div className="toast-area" aria-live="polite">
        {toasts.map((t) => (
          <div className={`toast ${t.error ? 'error' : ''}`} key={t.key}>
            <span>{t.message}</span>
            <button
              aria-label="Dismiss notification"
              onClick={() => setToasts((x) => x.filter((v) => v.key !== t.key))}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);
