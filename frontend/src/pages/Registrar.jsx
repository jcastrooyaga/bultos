import { useState, useCallback } from 'react';
import { saveRegistro, addPending } from '../db';
import { postBulto } from '../api';
import { useAudio } from '../hooks/useAudio';
import DimCard from '../components/DimCard';
import NumPad from '../components/NumPad';
import BarcodeArea from '../components/BarcodeArea';
import ModalCorreccion from '../components/ModalCorreccion';

const PRESETS = {
  libre: { label: 'Libre', ancho: null, largo: null },
  euro: { label: 'Europalet 120×80', ancho: '120', largo: '80' },
  amer: { label: 'Americano 120×100', ancho: '120', largo: '100' },
};

const FIELDS = ['alto', 'ancho', 'largo', 'peso'];
const FIELD_LABELS = { alto: 'Alto', ancho: 'Ancho', largo: 'Largo', peso: 'Peso' };
const FIELD_UNITS = { alto: 'cm', ancho: 'cm', largo: 'cm', peso: 'kg' };

function calcVolumen(values) {
  const a = parseFloat(values.alto);
  const w = parseFloat(values.ancho);
  const l = parseFloat(values.largo);
  if (isNaN(a) || isNaN(w) || isNaN(l) || a <= 0 || w <= 0 || l <= 0) return null;
  return (a * w * l) / 1_000_000;
}

function applyNumKey(current, key) {
  if (key === '⌫') return current.slice(0, -1);
  if (key === '·') {
    if (current.includes('.')) return current;
    return current === '' ? '0.' : current + '.';
  }
  if (current === '0' && key !== '.') return key;
  if (current.length >= 6) return current;
  return current + key;
}

export default function Registrar({
  user, token,
  barcode, setBarcode,
  preset, setPreset,
  values, setValues,
  activeField, setActiveField,
  registros, isOnline,
  onSaved,
}) {
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [corrModal, setCorrModal] = useState(null);
  const { playOK, playKO } = useAudio();

  const lockedFields = preset !== 'libre'
    ? { ancho: true, largo: true }
    : {};

  const handlePreset = (key) => {
    setPreset(key);
    const p = PRESETS[key];
    setValues((v) => ({
      ...v,
      ancho: p.ancho ?? v.ancho,
      largo: p.largo ?? v.largo,
    }));
    setActiveField('alto');
  };

  const handleFieldTap = (field) => {
    if (lockedFields[field]) return;
    setActiveField(field);
  };

  const handleNumKey = useCallback((k) => {
    setValues((v) => ({ ...v, [activeField]: applyNumKey(v[activeField], k) }));
  }, [activeField, setValues]);

  const handleEnter = useCallback(() => {
    const order = FIELDS.filter((f) => !lockedFields[f]);
    const idx = order.indexOf(activeField);
    if (idx < order.length - 1) {
      setActiveField(order[idx + 1]);
    }
  }, [activeField, lockedFields, setActiveField]);

  const handleLimpiar = () => {
    setBarcode('');
    setPreset('libre');
    setValues({ alto: '', ancho: '', largo: '', peso: '' });
    setActiveField('alto');
    setFeedback(null);
  };

  const handleBarcode = useCallback((code) => {
    const existing = registros.find(
      (r) => r.codigo_barras === code && r.user_id === user.id
    );
    if (existing) {
      setCorrModal({ code, existing });
    } else {
      setBarcode(code);
    }
  }, [registros, user.id, setBarcode]);

  const doGrabar = useCallback(async (overrideBarcode) => {
    const bc = overrideBarcode || barcode;
    if (!bc) {
      setFeedback({ type: 'error', msg: 'Escanea o introduce un código de barras' });
      playKO();
      return;
    }

    const alto = parseFloat(values.alto) || null;
    const ancho = parseFloat(values.ancho) || null;
    const largo = parseFloat(values.largo) || null;
    const peso = parseFloat(values.peso) || null;

    const local_id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const fecha_hora_utc = new Date().toISOString();

    const record = {
      local_id,
      codigo_barras: bc,
      alto_cm: alto,
      ancho_cm: ancho,
      largo_cm: largo,
      peso_kg: peso,
      fecha_hora_utc,
      user_id: user.id,
      plataforma: user.plataforma,
    };

    setSaving(true);
    setFeedback(null);

    await saveRegistro(record);

    if (isOnline) {
      try {
        await postBulto(record, token);
        setFeedback({ type: 'ok', msg: 'Guardado ✓' });
        playOK();
      } catch {
        await addPending(record);
        setFeedback({ type: 'warn', msg: 'Guardado offline · se sincronizará' });
        playOK();
      }
    } else {
      await addPending(record);
      setFeedback({ type: 'warn', msg: 'Sin conexión · pendiente de sync' });
      playOK();
    }

    await onSaved();
    setSaving(false);
    setBarcode('');
    setPreset('libre');
    setValues({ alto: '', ancho: '', largo: '', peso: '' });
    setActiveField('alto');
  }, [barcode, values, user, token, isOnline, playOK, playKO, onSaved, setBarcode, setPreset, setValues, setActiveField]);

  const handleGrabar = () => doGrabar();

  const volumen = calcVolumen(values);
  const volumenComplete = volumen !== null;

  return (
    <div className="flex flex-col gap-3 px-3 pt-3">
      <BarcodeArea barcode={barcode} onBarcode={handleBarcode} />

      <div className="flex gap-2">
        {Object.entries(PRESETS).map(([key, p]) => (
          <button
            key={key}
            onPointerDown={(e) => { e.preventDefault(); handlePreset(key); }}
            className={[
              'flex-1 flex items-center justify-center rounded-xl text-xs font-medium px-2 select-none active:opacity-80 transition-colors border',
              preset === key
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-text2 border-border1',
            ].join(' ')}
            style={{ minHeight: 40 }}
          >
            {key !== 'libre' && preset === key && <span className="mr-1">🔒</span>}
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {FIELDS.map((field) => (
          <DimCard
            key={field}
            label={FIELD_LABELS[field]}
            value={values[field]}
            unit={FIELD_UNITS[field]}
            active={activeField === field}
            locked={!!lockedFields[field]}
            onClick={() => handleFieldTap(field)}
          />
        ))}
      </div>

      <div
        className={[
          'flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 transition-opacity',
          volumenComplete ? 'opacity-100' : 'opacity-45',
        ].join(' ')}
      >
        <span className="text-sm text-blue-800 font-medium">📦 Volumen total</span>
        <span className="text-base font-semibold text-blue-900">
          {volumenComplete ? `${volumen.toFixed(2)} m³` : '— m³'}
        </span>
      </div>

      <NumPad onKey={handleNumKey} mode="dim" />

      {feedback && (
        <div
          className={[
            'text-sm text-center rounded-xl px-4 py-2',
            feedback.type === 'ok' && 'bg-green-100 text-green-800',
            feedback.type === 'warn' && 'bg-yellow-100 text-yellow-800',
            feedback.type === 'error' && 'bg-red-100 text-red-800',
          ].filter(Boolean).join(' ')}
        >
          {feedback.msg}
        </div>
      )}

      <div className="flex gap-2 pb-2">
        <button
          onPointerDown={(e) => { e.preventDefault(); handleLimpiar(); }}
          className="flex-1 flex items-center justify-center rounded-xl font-semibold text-white text-sm select-none active:opacity-80 bg-red-500"
          style={{ minHeight: 52 }}
        >
          Limpiar
        </button>
        <button
          onPointerDown={(e) => { e.preventDefault(); handleEnter(); }}
          className="flex-1 flex items-center justify-center rounded-xl font-semibold text-white text-sm select-none active:opacity-80 bg-blue-500"
          style={{ minHeight: 52 }}
        >
          Enter
        </button>
        <button
          onPointerDown={(e) => { e.preventDefault(); !saving && handleGrabar(); }}
          disabled={saving}
          className="flex-1 flex items-center justify-center rounded-xl font-semibold text-white text-sm select-none active:opacity-80 bg-green-500 disabled:opacity-50"
          style={{ minHeight: 52 }}
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : 'Grabar'}
        </button>
      </div>

      {corrModal && (
        <ModalCorreccion
          onConfirm={() => {
            setBarcode(corrModal.code);
            setCorrModal(null);
          }}
          onCancel={() => setCorrModal(null)}
        />
      )}
    </div>
  );
}
