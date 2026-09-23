import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';

export function useLeads() {
  const { token } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try {
      const data = await api.getLeads(token);
      setLeads(data.leads);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { reload(); }, [reload]);

  const updateLead = useCallback(async (id, changes) => {
    const { lead } = await api.updateLead(token, id, changes);
    setLeads((current) => current.map((item) => (item.id === id ? lead : item)));
    return lead;
  }, [token]);

  return { leads, loading, error, reload, updateLead };
}
