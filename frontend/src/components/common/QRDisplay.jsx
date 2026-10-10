import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../../app/providers/AppProvider.jsx';
export default function QRDisplay({ code }) {
  const { data } = useApp();
  const [url, setUrl] = useState(''),
    [epoch, setEpoch] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setEpoch(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let active = true;
    const elapsed = Date.now() - epoch;
    QRCode.toDataURL(JSON.stringify({ code, timestamp: data.clock + elapsed }), {
      width: 180,
      margin: 1,
      color: { dark: '#0F172A', light: '#FFFFFF' },
    }).then((url) => {
      if (active) setUrl(url);
    });
    return () => {
      active = false;
    };
  }, [code, data.clock, epoch]);
  return (
    <div className="qr">
      {url ? <img src={url} alt={`Demo QR pass for ${code}`} /> : <span>Preparing pass…</span>}
    </div>
  );
}
