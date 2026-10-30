"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { formatCurrency } from "@/lib/mock";

export interface MapPlace { name: string; lat: number; lng: number; price: number }

/** Saved/known places on an OpenStreetMap map. Pro feature. Markers show the per-person price. */
export default function PlacesMap({ places, onOpen }: { places: MapPlace[]; onOpen: (name: string) => void }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!el.current || places.length === 0) return;
    let map: import("leaflet").Map | null = null;
    let dead = false;
    import("leaflet").then((L) => {
      if (dead || !el.current) return;
      map = L.map(el.current, { zoomControl: false, attributionControl: true }).setView([places[0].lat, places[0].lng], 12);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
      const pts: [number, number][] = [];
      places.forEach((p) => {
        pts.push([p.lat, p.lng]);
        const icon = L.divIcon({
          className: "",
          html: `<div style="transform:translate(-50%,-100%);background:#1D9E75;color:#fff;font:900 12px Nunito,sans-serif;padding:5px 9px;border-radius:12px;border-bottom:4px solid #16825F;white-space:nowrap;width:max-content">${formatCurrency(p.price)}</div>`,
          iconSize: [0, 0],
        });
        L.marker([p.lat, p.lng], { icon }).addTo(map!).on("click", () => onOpen(p.name));
      });
      if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40], maxZoom: 15 });
    });
    return () => { dead = true; map?.remove(); };
  }, [places, onOpen]);

  if (places.length === 0) {
    return <div className="rounded-3xl border-2 border-dashed border-border px-6 py-12 text-center text-sm font-bold text-muted">Haritada gösterilecek konumlu mekan yok. Fiş eklerken konum izni verirsen mekanlar burada görünür.</div>;
  }
  return <div ref={el} className="w-full rounded-3xl border-2 border-b-4 border-border overflow-hidden" style={{ height: "58vh", minHeight: 320 }} />;
}
