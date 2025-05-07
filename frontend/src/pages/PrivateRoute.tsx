// src/components/PrivateRoute.tsx
import { useState, useEffect, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { apiFetch } from "../api";

export default function PrivateRoute({
  children,
  allowedRoles = []
}: {
  children: ReactNode;
  allowedRoles?: number[];
}) {
  const [status, setStatus] = useState<'loading'|'ok'|'denied'>('loading');

  useEffect(() => {
    (async () => {
      const res = await apiFetch('/api/user');
      if (!res.ok) {
        setStatus('denied');
        return;
      }
      const user = await res.json();            // { UserID, Role }
      if (
        allowedRoles.length === 0 ||
        allowedRoles.includes(user.Role)
      ) {
        setStatus('ok');
      } else {
        setStatus('denied');
      }
    })();
  }, [allowedRoles]);

  if (status === 'loading') return <p>Checking authentication…</p>;
  if (status === 'denied')  return <Navigate to="/login" replace />;
  return <>{children}</>;
}
