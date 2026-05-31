import { useState, useEffect, useCallback } from 'react';
import { setUnauthorizedHandler } from './api';
import { getSession, saveSession, clearSession, getFormState, saveFormState, getRegistrosHoy, clearRegistrosAntiguos } from './db';
import { useSync } from './hooks/useSync';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import Login from './pages/Login';
import Registrar from './pages/Registrar';
import Lista from './pages/Lista';

const INITIAL_VALUES = { alto: '', ancho: '', largo: '', peso: '' };

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState('registrar');
  const [barcode, setBarcode] = useState('');
  const [preset, setPreset] = useState('libre');
  const [values, setValues] = useState(INITIAL_VALUES);
  const [activeField, setActiveField] = useState('alto');
  const [registros, setRegistros] = useState([]);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  const { isOnline, pendingCount, refreshPendingCount, flushPending } = useSync(token);

  const loadRegistros = useCallback(async () => {
    const hoy = await getRegistrosHoy();
    hoy.sort((a, b) => new Date(b.fecha_hora_utc) - new Date(a.fecha_hora_utc));
    setRegistros(hoy);
  }, []);

  useEffect(() => {
    (async () => {
      await clearRegistrosAntiguos();
      const session = await getSession();
      if (session?.token && session?.user) {
        const exp = session.tokenExp;
        if (exp && exp * 1000 > Date.now()) {
          setUser(session.user);
          setToken(session.token);
          await loadRegistros();
        } else {
          await clearSession();
        }
      }
      const fs = await getFormState();
      if (fs) {
        if (fs.barcode) setBarcode(fs.barcode);
        if (fs.preset) setPreset(fs.preset);
        if (fs.values) setValues(fs.values);
        if (fs.activeField) setActiveField(fs.activeField);
      }
      setSessionLoaded(true);
    })();
  }, [loadRegistros]);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await clearSession();
      setUser(null);
      setToken(null);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    saveFormState({ barcode, preset, values, activeField });
  }, [barcode, preset, values, activeField, user]);

  const handleLogin = useCallback(async (userData, tokenStr, tokenExp) => {
    setUser(userData);
    setToken(tokenStr);
    await saveSession({ user: userData, token: tokenStr, tokenExp });
    await loadRegistros();
    refreshPendingCount();
    if (isOnline) flushPending();
  }, [loadRegistros, refreshPendingCount, isOnline, flushPending]);

  const handleSalir = useCallback(async () => {
    await clearSession();
    setUser(null);
    setToken(null);
    setBarcode('');
    setPreset('libre');
    setValues(INITIAL_VALUES);
    setActiveField('alto');
    setRegistros([]);
  }, []);

  const handleRegistroSaved = useCallback(async () => {
    await loadRegistros();
    refreshPendingCount();
  }, [loadRegistros, refreshPendingCount]);

  const handleEditRegistro = useCallback((registro) => {
    setBarcode(registro.codigo_barras);
    setPreset('libre');
    setValues({
      alto: registro.alto_cm != null ? String(registro.alto_cm) : '',
      ancho: registro.ancho_cm != null ? String(registro.ancho_cm) : '',
      largo: registro.largo_cm != null ? String(registro.largo_cm) : '',
      peso: registro.peso_kg != null ? String(registro.peso_kg) : '',
    });
    setActiveField('alto');
    setActiveTab('registrar');
  }, []);

  if (!sessionLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg2">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg2">
      <TopBar user={user} isOnline={isOnline} pendingCount={pendingCount} />

      <div className="flex-1 overflow-y-auto pb-16">
        {activeTab === 'registrar' ? (
          <Registrar
            user={user}
            token={token}
            barcode={barcode}
            setBarcode={setBarcode}
            preset={preset}
            setPreset={setPreset}
            values={values}
            setValues={setValues}
            activeField={activeField}
            setActiveField={setActiveField}
            registros={registros}
            isOnline={isOnline}
            onSaved={handleRegistroSaved}
          />
        ) : (
          <Lista
            registros={registros}
            onEdit={handleEditRegistro}
          />
        )}
      </div>

      <BottomNav
        activeTab={activeTab}
        onNavigate={setActiveTab}
        onSalir={handleSalir}
      />
    </div>
  );
}
