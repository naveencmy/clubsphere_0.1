import { createContext, useContext, useEffect, useState } from 'react';
import { snapshot } from '../../services/serviceFactory.js';
import { subscribe } from '../../services/subscription.js';
import { syncFromBackend } from '../../services/apiBridge.js';
import { authClient } from '../../services/authClient.js';
import { clearAuthentication, loadAuthenticatedWorkspace } from '../../services/authentication.js';
const Context = createContext(null);
export function AppProvider({ children }) {
  const authSession = authClient.useSession();
  const [identityReady, setIdentityReady] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [verifiedIdentity, setVerifiedIdentity] = useState(null);
  const [data, setData] = useState(snapshot),
    [toasts, setToasts] = useState([]),
    [loading, setLoading] = useState(true),
    [cart, setCart] = useState([]);
  useEffect(() => {
    const unsubscribe = subscribe(() => setData(snapshot()));
    syncFromBackend(data.session.clubId);
    const timer = setTimeout(() => setLoading(false), 180);
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    if (authSession.isPending) return;
    setIdentityReady(false);
    setAuthError(null);
    const resolveIdentity = async () => {
      try {
        if (authSession.data?.user) {
          const identity = await loadAuthenticatedWorkspace(authSession.data.user);
          if (!cancelled) setVerifiedIdentity(identity);
        } else {
          clearAuthentication();
          if (!cancelled) setVerifiedIdentity(null);
        }
      } catch (error) {
        clearAuthentication();
        if (!cancelled) setVerifiedIdentity(null);
        if (!cancelled) setAuthError(error.message);
      } finally {
        if (!cancelled) setIdentityReady(true);
      }
    };
    resolveIdentity();
    return () => {
      cancelled = true;
    };
  }, [authSession.data?.user?.id, authSession.isPending]);
  useEffect(() => setCart([]), [data.session.userId, data.session.clubId]);
  const toast = (message, error = false) => {
    const key = crypto.randomUUID();
    setToasts((t) => [...t, { key, message, error }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.key !== key)), 6000);
  };
  const authenticationPending =
    authSession.isPending ||
    !identityReady ||
    (!authError &&
      !!authSession.data?.user &&
      verifiedIdentity?.userId !== authSession.data.user.id);
  const hasVerifiedSession =
    !!authSession.data?.user &&
    verifiedIdentity?.userId === authSession.data.user.id &&
    data.session.userId === authSession.data.user.id;
  return (
    <Context.Provider
      value={{
        data: authenticationPending
          ? { ...data, role: 'VISITOR', user: null }
          : {
              ...data,
              user: hasVerifiedSession ? data.user : null,
              role: hasVerifiedSession
                ? verifiedIdentity.roles[data.session.clubId] || verifiedIdentity.defaultRole
                : 'VISITOR',
              demoControls: false,
            },
        toast,
        loading,
        cart,
        setCart,
        authenticationPending,
        authError,
      }}
    >
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
