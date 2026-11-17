'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Smartphone } from 'lucide-react';

interface QRCodeCardProps {
  value: string;
  size?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({
  value,
  size = 110,
  label = 'Smartphone-Navigation',
  sublabel = 'Mit Handykamera scannen für ÖPNV-Route & Direktkontakt',
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, {
      width: size * 2, // 2x for retina sharpness
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error('QR code generation failed:', err));
  }, [value, size]);

  if (!dataUrl) return null;

  return (
    <div className={`flex items-center gap-3 p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs ${className}`}>
      <img
        src={dataUrl}
        alt="QR-Code für Klienten-Smartphone"
        width={size}
        height={size}
        className="rounded-lg shrink-0 border border-slate-100 bg-white"
        style={{ width: `${size}px`, height: `${size}px` }}
      />
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
          <Smartphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate">{label}</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-tight">{sublabel}</p>
        <span className="text-[10px] text-slate-400 block pt-0.5 font-medium">
          DSGVO-konform • Ohne Registrierung
        </span>
      </div>
    </div>
  );
};
