import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, CameraOff, ScanLine, ShieldAlert, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useApp } from '../../app/providers/AppProvider.jsx';
import { eventService, membershipService } from '../../services/serviceFactory.js';
import { Button, Badge, Modal, Avatar } from '../../components/common/UI.jsx';
import { datetime } from '../../utils/format.js';
export default function Scanner() {
  const { data } = useApp(),
    { eventId } = useParams(),
    navigate = useNavigate();
  const [mode, setMode] = useState('ticket'),
    [code, setCode] = useState(''),
    [state, setState] = useState('idle'),
    [result, setResult] = useState(null),
    [camera, setCamera] = useState(false),
    [cameraMessage, setCameraMessage] = useState(
      'Camera is off. Enter a code manually or enable the camera.',
    ),
    [announcement, setAnnouncement] = useState('');
  const video = useRef(null),
    stream = useRef(null),
    timer = useRef(null),
    locked = useRef(false),
    audio = useRef(null),
    mounted = useRef(true),
    scanRef = useRef(null);
  const event = data.events.find((e) => e.id === eventId);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
      stream.current?.getTracks().forEach((t) => t.stop());
      audio.current?.close().catch(() => {});
    };
  }, []);
  function tone(ok) {
    try {
      audio.current ??= new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audio.current;
      ctx.resume();
      const oscillator = ctx.createOscillator(),
        gain = ctx.createGain();
      oscillator.type = ok ? 'sine' : 'sawtooth';
      oscillator.frequency.value = ok ? 440 : 180;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.3);
    } catch {}
    try {
      navigator.vibrate?.(ok ? 50 : [100, 50, 100, 50, 100]);
    } catch {}
  }
  function reset() {
    setState('idle');
    setResult(null);
    setCode('');
    locked.current = false;
    setAnnouncement('Scanner ready for the next pass.');
  }
  async function scan(raw) {
    if (locked.current || !raw.trim()) return;
    locked.current = true;
    setState('verifying');
    const start = performance.now();
    try {
      const response = await (mode === 'ticket'
        ? eventService.scan({ eventId, code: raw.trim() })
        : membershipService.verify(raw.trim()));
      if (!mounted.current) return;
      response.latency = Math.round(performance.now() - start);
      setResult(response);
      if (response.duplicate) {
        setState('rejected');
        tone(false);
        setAnnouncement(
          `Already checked in. ${response.user?.name}. Original scan ${datetime(response.originalAt)} at ${response.station}.`,
        );
      } else {
        setState('success');
        tone(true);
        setAnnouncement(
          `${mode === 'ticket' ? 'Entry approved' : 'Membership verified'}: ${response.user?.name}, ${response.user?.studentId}, ${response.tier}.`,
        );
        timer.current = setTimeout(reset, 1200);
      }
    } catch (error) {
      if (!mounted.current) return;
      setResult({ error: error.message, code: error.code });
      setState('rejected');
      tone(false);
      setAnnouncement(`Verification rejected. ${error.message}`);
    }
  }
  scanRef.current = scan;
  async function toggleCamera() {
    if (camera) {
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = null;
      setCamera(false);
      setCameraMessage('Camera stopped. Manual entry is available.');
      return;
    }
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error('Camera support is unavailable in this browser.');
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', frameRate: { ideal: 60 } },
        audio: false,
      });
      if (!mounted.current) {
        stream.current.getTracks().forEach((t) => t.stop());
        return;
      }
      video.current.srcObject = stream.current;
      await video.current.play();
      setCamera(true);
      setCameraMessage(
        'BarcodeDetector' in window
          ? 'Camera is active. Aim a campus QR pass inside the frame.'
          : 'Camera preview is active. Automatic QR decoding is unavailable; use manual entry.',
      );
    } catch (e) {
      setCameraMessage(`${e.message} Enter the pass code manually to continue.`);
    }
  }
  useEffect(() => {
    if (!camera || !('BarcodeDetector' in window)) return;
    let cancelled = false,
      pending = false;
    let detector;
    try {
      detector = new window.BarcodeDetector({ formats: ['qr_code'] });
    } catch {
      setCameraMessage('QR decoding is unavailable; use manual entry.');
      return;
    }
    const interval = setInterval(async () => {
      if (cancelled || pending || locked.current || !video.current?.videoWidth) return;
      pending = true;
      try {
        const found = await detector.detect(video.current);
        if (found[0] && !cancelled) await scanRef.current(found[0].rawValue);
      } catch {
      } finally {
        pending = false;
      }
    }, 100);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [camera]);
  return (
    <div className="scanner">
      <video ref={video} autoPlay playsInline muted aria-label="Scanner camera preview" />
      <div className="scanner-mask" />
      <header className="scanner-head">
        <div>
          <p className="caption">CLUBSPHERE · CAMPUS DOOR STATION</p>
          <h2>{event?.title || 'Member verification'}</h2>
          <p className="caption">DOOR-01 · Local verification</p>
        </div>
        <Button aria-label="Exit scanner" onClick={() => navigate('/portal/dashboard')}>
          <ArrowLeft size={16} />
          Exit
        </Button>
      </header>
      <div className="scanner-center">
        <div
          className={`reticle ${state === 'success' ? 'success' : state === 'rejected' ? 'rejected' : ''}`}
          data-testid="scanner-reticle"
        >
          <i className="corner tl" />
          <i className="corner tr" />
          <i className="corner bl" />
          <i className="corner br" />
          {state === 'idle' && <span className="laser" />}
        </div>
      </div>
      {['success', 'rejected'].includes(state) && (
        <div
          key={`${state}-${result?.ticket?.id || result?.code}`}
          className={`scanner-flash ${state}`}
        />
      )}
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {announcement}
      </div>
      {state !== 'success' && (
        <div className="scanner-controls stack small">
          <p className="scanner-help">{cameraMessage}</p>
          <div className="row">
            <select
              aria-label="Scanner mode"
              disabled={state !== 'idle'}
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                setCode('');
              }}
            >
              <option value="ticket">Event ticket check-in</option>
              <option value="member">Member pass verification</option>
            </select>
          </div>
          {mode === 'ticket' && (
            <select
              aria-label="Scanner event"
              disabled={state !== 'idle'}
              value={eventId}
              onChange={(e) => navigate(`/scanner/${e.target.value}`)}
            >
              {data.events.map((e) => (
                <option value={e.id} key={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          )}
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              scan(code);
            }}
          >
            <input
              className="input mono"
              aria-label="Ticket or membership code"
              placeholder={mode === 'ticket' ? 'Enter ticket code' : 'Enter member pass code'}
              value={code}
              disabled={state !== 'idle'}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button primary type="submit" disabled={state !== 'idle' || !code.trim()}>
              <ScanLine size={16} />
              {state === 'verifying' ? 'Verifying…' : 'Verify'}
            </Button>
          </form>
          <div className="row between">
            <Button onClick={toggleCamera} disabled={state === 'verifying'}>
              {camera ? <CameraOff size={16} /> : <Camera size={16} />}{' '}
              {camera ? 'Stop camera' : 'Enable camera'}
            </Button>
            <span className="caption">Camera permission is requested on enable.</span>
          </div>
          <details className="scanner-help">
            <summary>Verified pass codes</summary>
            {mode === 'ticket'
              ? data.scannerSamples?.tickets.map((t) => (
                  <p key={t.code} className="mono">
                    {t.code} · {t.status}
                  </p>
                ))
              : data.scannerSamples?.members.map((m) => (
                  <p key={m.code} className="mono">
                    {m.code} · {m.status}
                  </p>
                ))}
          </details>
        </div>
      )}
      {state === 'success' && (
        <section className="card scanner-success" aria-label="Successful verification">
          <div className="card-body stack small">
            <div className="row between">
              <Badge tone={result.membership?.status === 'GRACE_PERIOD' ? 'warning' : 'success'}>
                <CheckCircle2 size={14} />
                {mode === 'ticket'
                  ? 'ENTRY APPROVED'
                  : result.membership?.status === 'GRACE_PERIOD'
                    ? 'GRACE PERIOD · RENEWAL DUE'
                    : 'MEMBERSHIP VERIFIED'}
              </Badge>
              <span className="caption mono">{result.latency} ms · verified</span>
            </div>
            <div className="row">
              <Avatar name={result.user?.name} />
              <h2>{result.user?.name}</h2>
            </div>
            {result.membership && (
              <p className="caption muted">
                Valid until{' '}
                <time dateTime={result.membership.validUntil}>
                  {datetime(result.membership.validUntil)}
                </time>
              </p>
            )}
            <div className="row between">
              <span className="mono">{result.user?.studentId}</span>
              <Badge tone="info">{result.tier}</Badge>
            </div>
            <p className="caption muted">Automatically resumes in 1.2 seconds.</p>
          </div>
        </section>
      )}
      {state === 'rejected' && (
        <Modal
          persistent
          title={result?.duplicate ? 'ALREADY CHECKED IN' : 'VERIFICATION REJECTED'}
          className="scanner-warning"
          onClose={reset}
        >
          <div className="stack">
            <ShieldAlert className="warning-icon" />
            <p>
              {result?.duplicate
                ? 'This ticket has already been admitted. Re-entry requires officer review.'
                : result?.error}
            </p>
            {result?.duplicate && (
              <>
                <p>
                  <strong>{result.user?.name}</strong>
                </p>
                <p>
                  Original scan:{' '}
                  <time dateTime={result.originalAt}>{datetime(result.originalAt)}</time>
                </p>
                <p className="mono">Door station: {result.station}</p>
              </>
            )}
            <Button danger onClick={reset}>
              Dismiss warning & resume
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
