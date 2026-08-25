"use client";

import { useEffect, useRef, useState } from "react";
import { Search, MapPin } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function MapPicker({ lat, lng, onChange }: any) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!boxRef.current || mapRef.current) return;
    const map = L.map(boxRef.current).setView([lat || 30.0444, lng || 31.2357], 14);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
    const icon = L.divIcon({
      html: '<div style="width:20px;height:20px;background:#4f46e5;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.45)"></div>',
      className: "", iconSize: [20, 20], iconAnchor: [10, 10],
    });
    const marker = L.marker([lat || 30.0444, lng || 31.2357], { icon, draggable: true }).addTo(map);
    map.on("click", (e: any) => { marker.setLatLng(e.latlng); onChange(e.latlng.lat, e.latlng.lng); });
    marker.on("dragend", () => { const p = marker.getLatLng(); onChange(p.lat, p.lng); });
    mapRef.current = map;
    markerRef.current = marker;
    setTimeout(() => map.invalidateSize(), 250);
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      const p = markerRef.current.getLatLng();
      if (Math.abs(p.lat - Number(lat)) > 1e-7 || Math.abs(p.lng - Number(lng)) > 1e-7) {
        markerRef.current.setLatLng([Number(lat), Number(lng)]);
        mapRef.current.panTo([Number(lat), Number(lng)]);
      }
    }
  }, [lat, lng]);

  function locate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        const la = pos.coords.latitude, ln = pos.coords.longitude;
        mapRef.current?.setView([la, ln], 16);
        markerRef.current?.setLatLng([la, ln]);
        onChange(la, ln);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!q) return;
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`);
      const d = await r.json();
      if (d[0]) {
        const la = parseFloat(d[0].lat), ln = parseFloat(d[0].lon);
        mapRef.current?.setView([la, ln], 16);
        markerRef.current?.setLatLng([la, ln]);
        onChange(la, ln);
      }
    } catch {}
  }

  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1">موقع الفرع من الخريطة *</label>
      <form onSubmit={search} className="flex gap-2 mb-2">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="اكتب العنوان واضغط بحث..." className={inputCls} />
        <button type="submit" className="flex items-center gap-1 bg-slate-700 text-white text-xs font-bold rounded-lg px-3 py-2 shrink-0 hover:bg-slate-800">
          <Search className="w-3.5 h-3.5" /> بحث
        </button>
        <button type="button" onClick={locate} className="flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold rounded-lg px-3 py-2 shrink-0 hover:bg-emerald-700">
          <MapPin className="w-3.5 h-3.5" /> موقعي
        </button>
      </form>
      <div ref={boxRef} className="h-56 rounded-xl border border-slate-300 overflow-hidden relative z-0" />
      <p className="text-xs text-slate-500 mt-1.5">
        اضغط على الخريطة أو اسحب العلامة أو دوس "موقعي" — الإحداثيات: {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
      </p>
    </div>
  );
}
