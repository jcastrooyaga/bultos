import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import ModalTeclado from './ModalTeclado';

export default function BarcodeArea({ barcode, onBarcode }) {
  const [scanning, setScanning] = useState(false);
  const [showTeclado, setShowTeclado] = useState(false);
  const [camError, setCamError] = useState('');
  const scannerRef = useRef(null);
  const scanDivId = 'qr-reader-area';

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const startScanner = async () => {
    setCamError('');
    setScanning(true);
    try {
      const scanner = new Html5Qrcode(scanDivId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 120 } },
        (decoded) => {
          onBarcode(decoded);
          stopScanner();
        },
        () => {}
      );
    } catch (err) {
      setCamError('No se pudo acceder a la cámara');
      setScanning(false);
    }
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  return (
    <>
      <div className="bg-white border border-border1 rounded-xl overflow-hidden">
        {scanning ? (
          <div className="relative">
            <div id={scanDivId} className="w-full" style={{ minHeight: 200 }} />
            <button
              onClick={stopScanner}
              className="absolute top-2 right-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="flex items-center px-4 py-3 gap-3">
            <span className={['flex-1 text-base truncate', barcode ? 'text-text1 font-mono font-semibold' : 'text-border2'].join(' ')}>
              {barcode || 'Sin escanear'}
            </span>
            <button
              onClick={startScanner}
              className="flex items-center justify-center rounded-xl bg-bg2 active:bg-bg3 shrink-0"
              style={{ width: 44, height: 44 }}
              title="Escanear con cámara"
            >
              📷
            </button>
            <button
              onClick={() => setShowTeclado(true)}
              className="flex items-center justify-center rounded-xl bg-bg2 active:bg-bg3 shrink-0"
              style={{ width: 44, height: 44 }}
              title="Introducir código manualmente"
            >
              ⌨
            </button>
          </div>
        )}
        {camError && (
          <p className="text-xs text-red-600 px-4 pb-2">{camError}</p>
        )}
      </div>

      {showTeclado && (
        <ModalTeclado
          onConfirm={(code) => { onBarcode(code); setShowTeclado(false); }}
          onClose={() => setShowTeclado(false)}
        />
      )}
    </>
  );
}
