import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';

export function useSales() {
  const { token } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try {
      const data = await api.getSales(token);
      setSales(data.sales);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { reload(); }, [reload]);

  const createSale = useCallback(async (payload) => {
    const { sale } = await api.createSale(token, payload);
    setSales((current) => [sale, ...current]);
    return sale;
  }, [token]);

  return { sales, loading, error, reload, createSale };
}
