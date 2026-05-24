"use client";
import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface Props {
  src: string;
  circular?: boolean;
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}

const CROP = 280;

export function CropModal({ src, circular = false, onConfirm, onCancel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [t, setT] = useState({ x: 0, y: 0, scale: 1 });
  const drag = useRef<{ sx: number; sy: number; tx: number; ty: number } | null>(null);
  const pinch = useRef<{ dist: number; scale: number } | null>(null);

  useEffect(() => {
    if (!loaded || !imgRef.current || !containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const iw = imgRef.current.naturalWidth;
    const ih = imgRef.current.naturalHeight;
    const scale = Math.max(CROP / iw, CROP / ih) * 1.05;
    setT({ x: (cw - iw * scale) / 2, y: (ch - ih * scale) / 2, scale });
  }, [loaded]);

  function dist(touches: React.TouchList) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      drag.current = { sx: e.touches[0].clientX, sy: e.touches[0].clientY, tx: t.x, ty: t.y };
      pinch.current = null;
    } else if (e.touches.length === 2) {
      pinch.current = { dist: dist(e.touches), scale: t.scale };
      drag.current = null;
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 1 && drag.current) {
      const dx = e.touches[0].clientX - drag.current.sx;
      const dy = e.touches[0].clientY - drag.current.sy;
      setT((p) => ({ ...p, x: drag.current!.tx + dx, y: drag.current!.ty + dy }));
    } else if (e.touches.length === 2 && pinch.current) {
      const ratio = dist(e.touches) / pinch.current.dist;
      const newScale = Math.max(0.3, Math.min(6, pinch.current.scale * ratio));
      setT((p) => ({ ...p, scale: newScale }));
    }
  }

  function onMouseDown(e: React.MouseEvent) {
    drag.current = { sx: e.clientX, sy: e.clientY, tx: t.x, ty: t.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!drag.current) return;
    setT((p) => ({ ...p, x: drag.current!.tx + e.clientX - drag.current!.sx, y: drag.current!.ty + e.clientY - drag.current!.sy }));
  }
  function onMouseUp() { drag.current = null; }

  function confirm() {
    if (!imgRef.current || !containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const cropLeft = (cw - CROP) / 2;
    const cropTop = (ch - CROP) / 2;
    const imgX = (cropLeft - t.x) / t.scale;
    const imgY = (cropTop - t.y) / t.scale;
    const imgCropSize = CROP / t.scale;
    const out = 400;
    const canvas = document.createElement("canvas");
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext("2d")!;
    if (circular) {
      ctx.beginPath();
      ctx.arc(out / 2, out / 2, out / 2, 0, Math.PI * 2);
      ctx.clip();
    }
    ctx.drawImage(imgRef.current, imgX, imgY, imgCropSize, imgCropSize, 0, 0, out, out);
    onConfirm(canvas.toDataURL("image/jpeg", 0.85));
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-black">
        <button onClick={onCancel} className="text-white p-1"><X className="w-6 h-6" /></button>
        <p className="text-white font-semibold text-sm">Fotoğrafı Kırp</p>
        <button onClick={confirm} className="text-orange-400 font-bold text-sm px-2 py-1">Uygula</button>
      </div>

      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ touchAction: "none" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <img
          ref={imgRef}
          src={src}
          alt=""
          className="absolute"
          style={{ transform: `translate(${t.x}px,${t.y}px) scale(${t.scale})`, transformOrigin: "0 0", userSelect: "none", pointerEvents: "none" }}
          onLoad={() => setLoaded(true)}
          draggable={false}
        />

        {/* Overlay with transparent crop window */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-black/55" />
          <div
            className={`absolute bg-transparent border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] ${circular ? "rounded-full" : "rounded-xl"}`}
            style={{ width: CROP, height: CROP, left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}
          />
        </div>
      </div>

      <p className="text-center text-white/40 text-xs py-3 bg-black">
        Sürükle · İki parmakla yakınlaştır
      </p>
    </div>
  );
}
