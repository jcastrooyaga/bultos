import localforage from 'localforage';

const registrosStore = localforage.createInstance({ name: 'bultos', storeName: 'registros' });
const syncStore = localforage.createInstance({ name: 'bultos', storeName: 'pendingSync' });
const sessionStore = localforage.createInstance({ name: 'bultos', storeName: 'session' });

export async function saveRegistro(registro) {
  await registrosStore.setItem(registro.local_id || registro.id, registro);
}

export async function getRegistrosHoy() {
  const today = new Date().toISOString().slice(0, 10);
  const all = [];
  await registrosStore.iterate((value) => { all.push(value); });
  return all.filter((r) => r.fecha_hora_utc && r.fecha_hora_utc.startsWith(today));
}

export async function clearRegistrosAntiguos() {
  const today = new Date().toISOString().slice(0, 10);
  const toDelete = [];
  await registrosStore.iterate((value, key) => {
    if (!value.fecha_hora_utc || !value.fecha_hora_utc.startsWith(today)) {
      toDelete.push(key);
    }
  });
  for (const key of toDelete) {
    await registrosStore.removeItem(key);
  }
}

export async function addPending(item) {
  const key = item.local_id || String(Date.now());
  await syncStore.setItem(key, item);
  return key;
}

export async function getPending() {
  const all = [];
  await syncStore.iterate((value, key) => { all.push({ key, value }); });
  return all;
}

export async function removePending(key) {
  await syncStore.removeItem(key);
}

export async function clearPending() {
  await syncStore.clear();
}

export async function saveSession(data) {
  await sessionStore.setItem('session', data);
}

export async function getSession() {
  return sessionStore.getItem('session');
}

export async function clearSession() {
  await sessionStore.removeItem('session');
}

export async function saveFormState(data) {
  await sessionStore.setItem('formState', data);
}

export async function getFormState() {
  return sessionStore.getItem('formState');
}
