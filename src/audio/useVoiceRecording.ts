import { useEffect, useRef, useState } from 'react';

type RecordingSession = { scope: string; stream?: MediaStream; recorder?: MediaRecorder; reader?: FileReader; timer?: ReturnType<typeof setTimeout>; cancelled: boolean };

// One owner for permission, microphone, recorder, timer and asynchronous reader.
export function useVoiceRecording(scope: string | null, onSave: (audio: string) => void) {
  const current = useRef({ scope, onSave });
  current.current = { scope, onSave };
  const session = useRef<RecordingSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  function release(s: RecordingSession) {
    clearTimeout(s.timer);
    s.stream?.getTracks().forEach(track => track.stop());
  }
  function cancel() {
    const s = session.current;
    session.current = null;
    if (!s) return;
    s.cancelled = true;
    release(s);
    if (s.reader?.readyState === FileReader.LOADING) s.reader.abort();
    if (s.recorder && s.recorder.state !== 'inactive') s.recorder.stop();
  }
  useEffect(() => {
    setBusy(false); setError('');
    const hidden = () => { if (document.hidden) { cancel(); setBusy(false); } };
    const leaving = () => { cancel(); setBusy(false); };
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', leaving);
    return () => {
      cancel();
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('pagehide', leaving);
    };
  }, [scope]);
  async function start() {
    if (!scope || session.current) return;
    const s: RecordingSession = { scope, cancelled: false };
    session.current = s;
    const valid = () => !s.cancelled && session.current === s && current.current.scope === s.scope;
    setBusy(true); setError('');
    try {
      s.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!valid() || document.hidden) { release(s); return; }
      const recorder = new MediaRecorder(s.stream);
      s.recorder = recorder;
      const chunks: Blob[] = [];
      let bytes = 0;
      recorder.ondataavailable = event => {
        if (!valid() || !event.data.size) return;
        bytes += event.data.size;
        if (bytes > 2_000_000) {
          setError('La grabación superó el límite de tamaño. Probá una frase más corta.');
          cancel(); setBusy(false); return;
        }
        chunks.push(event.data);
      };
      recorder.onerror = () => {
        if (!valid()) return;
        setError('No se pudo completar la grabación.'); cancel(); setBusy(false);
      };
      recorder.onstop = () => {
        release(s);
        if (!valid()) return;
        setBusy(false);
        if (!bytes) { session.current = null; return; }
        const reader = new FileReader(); s.reader = reader;
        reader.onload = () => {
          if (!valid()) return;
          session.current = null;
          if (typeof reader.result === 'string') current.current.onSave(reader.result);
        };
        reader.onerror = () => {
          if (valid()) { session.current = null; setError('No se pudo preparar el audio. Intentá nuevamente.'); }
        };
        reader.readAsDataURL(new Blob(chunks, { type: recorder.mimeType || chunks[0]?.type || 'audio/webm' }));
      };
      recorder.start(250);
      s.timer = setTimeout(() => { if (valid() && recorder.state !== 'inactive') { recorder.stop(); release(s); } }, 30_000);
    } catch {
      release(s);
      if (valid()) { session.current = null; setBusy(false); setError('No se pudo acceder al micrófono. Revisá el permiso del navegador.'); }
    }
  }
  function stop() {
    const s = session.current;
    if (!s) return;
    if (!s.recorder) { cancel(); setBusy(false); return; }
    if (s.recorder.state !== 'inactive') s.recorder.stop();
    release(s);
  }
  return { busy, error, start, stop };
}
