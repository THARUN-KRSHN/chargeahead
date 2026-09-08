'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import type { LatLng, RouteStop, Place } from '@/types';

// ── Types ─────────────────────────────────────────────────────

interface MapCanvasProps {
  origin: Place;
  destination: Place;
  stops?: RouteStop[];
  height?: string;
  className?: string;
}

// ── Projection helpers ────────────────────────────────────────

interface Bounds {
  minLat: number; maxLat: number;
  minLng: number; maxLng: number;
}

function getBounds(points: LatLng[], padding = 0.12): Bounds {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const latSpan = Math.max(...lats) - Math.min(...lats) || 0.05;
  const lngSpan = Math.max(...lngs) - Math.min(...lngs) || 0.05;
  return {
    minLat: Math.min(...lats) - latSpan * padding,
    maxLat: Math.max(...lats) + latSpan * padding,
    minLng: Math.min(...lngs) - lngSpan * padding,
    maxLng: Math.max(...lngs) + lngSpan * padding,
  };
}

function project(lat: number, lng: number, bounds: Bounds, w: number, h: number): { x: number; y: number } {
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * w;
  const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * h; // invert y (lat grows up)
  return { x, y };
}

// ── Grid / road background pattern ────────────────────────────

function RoadGrid({ bounds, w, h }: { bounds: Bounds; w: number; h: number }) {
  const proj = (lat: number, lng: number) => project(lat, lng, bounds, w, h);

  // Interpolate grid lines across the bounding box
  const latStep = (bounds.maxLat - bounds.minLat) / 8;
  const lngStep = (bounds.maxLng - bounds.minLng) / 8;

  const horizontalLines = Array.from({ length: 9 }, (_, i) => {
    const lat = bounds.minLat + i * latStep;
    const a = proj(lat, bounds.minLng);
    const b = proj(lat, bounds.maxLng);
    return { y1: a.y, y2: b.y, x1: a.x, x2: b.x };
  });

  const verticalLines = Array.from({ length: 9 }, (_, i) => {
    const lng = bounds.minLng + i * lngStep;
    const a = proj(bounds.minLat, lng);
    const b = proj(bounds.maxLat, lng);
    return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  });

  return (
    <>
      {/* City block background */}
      {horizontalLines.map((l, i) => (
        <line
          key={`h${i}`}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke={i % 3 === 0 ? '#D1D5DB' : '#E9ECEF'}
          strokeWidth={i % 3 === 0 ? 1.5 : 0.8}
        />
      ))}
      {verticalLines.map((l, i) => (
        <line
          key={`v${i}`}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke={i % 3 === 0 ? '#D1D5DB' : '#E9ECEF'}
          strokeWidth={i % 3 === 0 ? 1.5 : 0.8}
        />
      ))}
    </>
  );
}

// ── Animated route polyline ────────────────────────────────────

function AnimatedRouteLine({
  points,
  bounds,
  w, h,
}: {
  points: LatLng[];
  bounds: Bounds;
  w: number;
  h: number;
}) {
  const pathRef = useRef<SVGPolylineElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(id);
  }, []);

  const pts = points.map((p) => {
    const { x, y } = project(p.lat, p.lng, bounds, w, h);
    return `${x},${y}`;
  }).join(' ');

  return (
    <polyline
      ref={pathRef}
      points={pts}
      fill="none"
      stroke="#10B981"
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={animated ? undefined : '8 6'}
      style={{
        filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.5))',
        opacity: 0.9,
      }}
    />
  );
}

// ── Pin components ─────────────────────────────────────────────

type PinType = 'origin' | 'stop' | 'destination';

function MapPin({
  x, y, type, label, confidence, onClick,
}: {
  x: number; y: number;
  type: PinType;
  label: string;
  confidence?: number;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const colors: Record<PinType, { bg: string; border: string; text: string }> = {
    origin:      { bg: '#3B82F6', border: '#1D4ED8', text: '#fff' },
    stop:        { bg: '#F59E0B', border: '#D97706', text: '#000' },
    destination: { bg: '#10B981', border: '#059669', text: '#fff' },
  };
  const c = colors[type];

  const pinSize = hovered ? 22 : 18;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      style={{ cursor: 'pointer' }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Glow ring */}
      <circle r={pinSize + 6} fill={c.bg} opacity={hovered ? 0.18 : 0.1} />
      {/* Confidence ring for stops */}
      {type === 'stop' && confidence !== undefined && (
        <circle
          r={pinSize + 3}
          fill="none"
          stroke={confidence >= 80 ? '#10B981' : confidence >= 60 ? '#F59E0B' : '#EF4444'}
          strokeWidth={2}
          strokeDasharray={`${((confidence / 100) * 2 * Math.PI * (pinSize + 3)).toFixed(1)} 999`}
          strokeLinecap="round"
          transform="rotate(-90)"
          opacity={0.7}
        />
      )}
      {/* Main circle */}
      <circle r={pinSize} fill={c.bg} stroke={c.border} strokeWidth={2} />
      {/* Icon inside */}
      {type === 'origin' && (
        // Navigation arrow
        <text textAnchor="middle" dominantBaseline="central" fontSize={pinSize * 0.9} fill={c.text}>▲</text>
      )}
      {type === 'destination' && (
        // Flag
        <text textAnchor="middle" dominantBaseline="central" fontSize={pinSize * 0.8} fill={c.text}>⚑</text>
      )}
      {type === 'stop' && (
        // Zap bolt (SVG path)
        <path
          d={`M1,-${pinSize * 0.45} L-${pinSize * 0.2},${pinSize * 0.05} L${pinSize * 0.05},${pinSize * 0.05} L-1,${pinSize * 0.45} L${pinSize * 0.2},-${pinSize * 0.05} L-${pinSize * 0.05},-${pinSize * 0.05} Z`}
          fill={c.text}
        />
      )}
      {/* Label tooltip */}
      {hovered && (
        <g transform={`translate(${pinSize + 4}, -16)`}>
          <rect
            x={0} y={-12} rx={6} ry={6}
            width={Math.min(label.length * 6.5 + 16, 200)} height={24}
            fill="#111827" opacity={0.92}
          />
          <text
            x={8} y={1}
            fontSize={11} fill="#fff" fontWeight={600}
            style={{ fontFamily: 'inherit' }}
          >
            {label.length > 28 ? label.slice(0, 28) + '…' : label}
          </text>
        </g>
      )}
    </g>
  );
}

// ── Main MapCanvas component ──────────────────────────────────

export function MapCanvas({ origin, destination, stops = [], height = '100%', className = '' }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 480 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // Observe container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    obs.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => obs.disconnect();
  }, []);

  // Compute all route points
  const routePoints: LatLng[] = [
    origin.coords,
    ...stops.map((s) => s.station.coordinates),
    destination.coords,
  ];

  const bounds = getBounds(routePoints);
  const { w, h } = size;

  // ── Pan handlers ──────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  }, []);
  const onMouseUp = useCallback(() => { isDragging.current = false; }, []);

  // ── Zoom handler ──────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(4, Math.max(0.5, z - e.deltaY * 0.001)));
  }, []);

  const recenter = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const originPt = project(origin.coords.lat, origin.coords.lng, bounds, w, h);
  const destPt = project(destination.coords.lat, destination.coords.lng, bounds, w, h);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-[#F1F5F9] select-none ${className}`}
      style={{ height }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
    >
      {/* Transformable canvas */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '50% 50%',
          width: '100%',
          height: '100%',
          cursor: isDragging.current ? 'grabbing' : 'grab',
        }}
      >
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          style={{ display: 'block', userSelect: 'none' }}
        >
          {/* Background */}
          <rect x={0} y={0} width={w} height={h} fill="#F1F5F9" />

          {/* Road grid */}
          <RoadGrid bounds={bounds} w={w} h={h} />

          {/* Animated route line */}
          {routePoints.length >= 2 && (
            <AnimatedRouteLine points={routePoints} bounds={bounds} w={w} h={h} />
          )}

          {/* Stop pins */}
          {stops.map((stop, i) => {
            const { x, y } = project(stop.station.coordinates.lat, stop.station.coordinates.lng, bounds, w, h);
            return (
              <MapPin
                key={stop.station.id}
                x={x} y={y}
                type="stop"
                label={`Stop ${i + 1}: ${stop.station.name}`}
                confidence={stop.station.confidenceScore}
              />
            );
          })}

          {/* Origin pin */}
          <MapPin x={originPt.x} y={originPt.y} type="origin" label={origin.label} />

          {/* Destination pin */}
          <MapPin x={destPt.x} y={destPt.y} type="destination" label={destination.label} />
        </svg>
      </div>

      {/* ── Controls overlay ── */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
        <button
          onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
          className="w-9 h-9 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center text-lg font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          aria-label="Zoom in"
        >+</button>
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
          className="w-9 h-9 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center text-lg font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          aria-label="Zoom out"
        >−</button>
        <button
          onClick={recenter}
          className="w-9 h-9 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          aria-label="Recenter map"
          title="Recenter"
        >⊙</button>
      </div>

      {/* ── Legend ── */}
      <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 text-[10px] font-bold text-gray-600 shadow-sm z-10">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Origin</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> Charge Stop</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Destination</span>
      </div>
    </div>
  );
}
