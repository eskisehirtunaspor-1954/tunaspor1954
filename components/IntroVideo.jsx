'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Kullanım:
 * 1. Video dosyasını /public/videos/tunaspor-intro.mp4 olarak koy
 * 2. app/layout.jsx veya app/page.jsx içinde en üste ekle:
 *
 *    import IntroVideo from '@/components/IntroVideo';
 *    ...
 *    <IntroVideo />
 *    {children}
 */

const SESSION_KEY = 'tunaspor_intro_seen_session';

export default function IntroVideo() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    // Bu tarayıcı oturumunda daha önce görüldüyse hiç gösterme
    if (typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) {
      setVisible(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    video.play().catch(() => {
      // Autoplay engellenirse ilk tıklamada başlat
      const startOnClick = () => {
        video.play();
        window.removeEventListener('click', startOnClick);
      };
      window.addEventListener('click', startOnClick);
    });

    const handleTimeUpdate = () => {
      setProgress((video.currentTime / video.duration) * 100);
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', endIntro);

    const handleEsc = (e) => {
      if (e.key === 'Escape') endIntro();
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', endIntro);
      window.removeEventListener('keydown', handleEsc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function endIntro() {
    sessionStorage.setItem(SESSION_KEY, '1');
    setFading(true);
    setTimeout(() => setVisible(false), 800);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
        transition: 'opacity 0.8s ease',
      }}
    >
      <video
        ref={videoRef}
        muted={muted}
        playsInline
        autoPlay
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      >
        <source src="/videos/tunaspor-intro.mp4" type="video/mp4" />
      </video>

      {/* İlerleme çubuğu */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 3,
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #e10600, #ff5a3c)',
          zIndex: 10,
        }}
      />

      {/* Ses aç/kapat */}
      <button
        onClick={() => setMuted((m) => !m)}
        style={btnStyle('left')}
      >
        {muted ? '🔇 Sesi Aç' : '🔊 Sesi Kapat'}
      </button>

      {/* Geç butonu — her zaman görünür */}
      <button onClick={endIntro} style={btnStyle('right')}>
        Geç ›
      </button>
    </div>
  );
}

function btnStyle(side) {
  return {
    position: 'absolute',
    bottom: 32,
    [side]: 32,
    padding: '10px 20px',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.4)',
    color: '#fff',
    fontSize: 14,
    borderRadius: 30,
    cursor: 'pointer',
    backdropFilter: 'blur(6px)',
    zIndex: 10,
  };
}
