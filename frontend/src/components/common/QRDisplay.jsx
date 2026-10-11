import { useEffect, useState, useCallback, useRef } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../../app/providers/AppProvider.jsx';

/**
 * Generates HMAC-SHA256 using Web Crypto API (browser-native, no polyfill).
 * Returns a truncated hex signature for QR compactness.
 */
async function hmacSign(message, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16); // 16-char truncated HMAC — compact for QR
}

/** Rotation interval in milliseconds (15 seconds) */
const ROTATION_MS = 15_000;

/**
 * QRDisplay — renders a cryptographically signed, auto-rotating QR code.
 *
 * QR payload format:  CS1:<hmac>:<ticketCode>:<timestamp>
 *
 * The scanner validates:
 *  1. Timestamp is within 60 seconds of server clock (anti-replay)
 *  2. HMAC matches the shared signing secret (anti-forgery)
 *
 * @param {{ code: string }} props
 */
export default function QRDisplay({ code }) {
  const { data } = useApp();
  const [url, setUrl] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(ROTATION_MS / 1000);
  const epochRef = useRef(Date.now());

  const generateQR = useCallback(async () => {
    const now = Date.now();
    epochRef.current = now;
    const timestamp = data.clock + (now - now); // use server clock for consistency
    const signingSecret = 'clubsphere_qr_hmac_secret_key_rotation_token'; // matches backend QR_SIGNING_SECRET
    const message = `${code}:${timestamp}`;
    const hmac = await hmacSign(message, signingSecret);
    const payload = `CS1:${hmac}:${code}:${timestamp}`;

    const qrUrl = await QRCode.toDataURL(payload, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0F172A', light: '#FFFFFF' },
    });
    setUrl(qrUrl);
    setSecondsLeft(ROTATION_MS / 1000);
  }, [code, data.clock]);

  // Generate on mount and rotate every ROTATION_MS
  useEffect(() => {
    generateQR();
    const interval = setInterval(generateQR, ROTATION_MS);
    return () => clearInterval(interval);
  }, [generateQR]);

  // Countdown seconds for UX feedback
  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? ROTATION_MS / 1000 : s - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="qr" style={{ textAlign: 'center' }}>
      {url ? (
        <>
          <img
            src={url}
            alt={`Secure QR pass for ${code}`}
            loading="eager"
            decoding="async"
            style={{ borderRadius: 8 }}
          />
          <p
            className="caption muted"
            style={{ marginTop: 6, fontSize: '0.75rem', letterSpacing: '0.04em' }}
          >
            🔒 Signed pass · rotates in {secondsLeft}s
          </p>
        </>
      ) : (
        <span>Generating secure pass…</span>
      )}
    </div>
  );
}
