import { useState, useCallback } from 'react';
import { loginOperario } from '../api';

export default function Login({ onLogin }) {
  const [plataforma, setPlataforma] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const doLogin = useCallback(async (currentPin) => {
    if (!plataforma.trim()) {
      setError('Introduce tu plataforma');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await loginOperario(plataforma.trim().toUpperCase(), currentPin);
      const payloadB64 = data.token.split('.')[1];
      const payload = JSON.parse(atob(payloadB64));
      onLogin(data.user, data.token, payload.exp);
    } catch (e) {
      setError('Plataforma o PIN incorrectos');
      setPin('');
    } finally {
      setLoading(false);
    }
  }, [plataforma, onLogin]);

  const handleNumKey = useCallback((k) => {
    if (loading) return;
    if (k === '⌫') {
      setPin((p) => p.slice(0, -1));
      setError('');
      return;
    }
    const next = pin + k;
    if (next.length > 4) return;
    setPin(next);
    setError('');
    if (next.length === 4) {
      setTimeout(() => doLogin(next), 180);
    }
  }, [pin, loading, doLogin]);

  const handlePlataformaChange = (e) => {
    setPlataforma(e.target.value.toUpperCase().slice(0, 6));
    setError('');
  };

  const keys = ['1','2','3','4','5','6','7','8','9', null,'0','⌫'];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg2 px-6 py-8">
      <div
        className="flex items-center justify-center rounded-xl text-white font-bold text-2xl mb-6"
        style={{ width: 80, height: 80, background: '#25578f' }}
      >
        cat
      </div>

      <h1 className="text-2xl font-bold text-text1 mb-1">Bienvenido</h1>
      <p className="text-sm text-text2 mb-8">Introduce tu plataforma y PIN</p>

      <div className="w-full max-w-xs space-y-6">
        <div>
          <label className="block text-xs font-medium text-text2 mb-1.5 uppercase tracking-wide">
            Plataforma
          </label>
          <input
            type="text"
            value={plataforma}
            onChange={handlePlataformaChange}
            placeholder="ej. MAD01"
            className="w-full border border-border1 rounded-xl px-4 bg-white text-text1 text-base uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:text-border2 focus:border-gray-400"
            style={{ height: 52 }}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text2 mb-1.5 uppercase tracking-wide">
            PIN
          </label>
          <div className="flex justify-center gap-3 mb-4">
            {[0,1,2,3].map((i) => (
              <div
                key={i}
                className={[
                  'w-4 h-4 rounded-full border-2 transition-colors',
                  i < pin.length
                    ? 'bg-gray-900 border-gray-900'
                    : 'bg-white border-border2',
                ].join(' ')}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="text-sm text-center text-red-600 bg-red-50 rounded-xl px-4 py-2">
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {keys.map((k, i) => {
            if (k === null) {
              return <div key={i} />;
            }
            return (
              <button
                key={i}
                onPointerDown={(e) => { e.preventDefault(); handleNumKey(k); }}
                className={[
                  'flex items-center justify-center rounded-xl font-semibold text-xl select-none active:scale-95 transition-transform',
                  k === '⌫' ? 'bg-bg3 text-text1' : 'bg-white text-text1 border border-border1',
                ].join(' ')}
                style={{ minHeight: 56 }}
                disabled={loading}
              >
                {k}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => pin.length === 4 && doLogin(pin)}
          disabled={loading || pin.length < 4 || !plataforma.trim()}
          className="w-full flex items-center justify-center rounded-xl font-semibold text-white text-base transition-opacity disabled:opacity-40"
          style={{ height: 52, background: '#25578f' }}
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : 'Entrar'}
        </button>
      </div>
    </div>
  );
}
