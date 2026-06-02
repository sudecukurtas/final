/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { 
  Customer, 
  Courier, 
  TurkeyHub, 
  MacroTruck, 
  Particle, 
  SimulationParams,
  SimulationStats
} from '../types';
import { 
  Leaf, 
  Globe, 
  Layers, 
  Radar, 
  Activity, 
  Compass 
} from 'lucide-react';

interface SimulationCanvasProps {
  activeView: 'macro' | 'micro';
  selectedHub: string;
  setSelectedHub: (hub: string) => void;
  params: SimulationParams;
  customers: Customer[];
  couriers: Courier[];
  turkeyHubs: TurkeyHub[];
  macroTrucks: MacroTruck[];
  particles: Particle[];
  depot: { x: number; y: number; size: number };
  loadingQueue: Courier[];
  loadingBays: { id: number; offsetY: number; courier: Courier | null; timeLeft: number }[];
  isSLAAtRisk: boolean;
  stats: SimulationStats;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  activeView,
  selectedHub,
  setSelectedHub,
  params,
  customers,
  couriers,
  turkeyHubs,
  macroTrucks,
  particles,
  depot,
  loadingQueue,
  loadingBays,
  isSLAAtRisk,
  stats,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [gridOffset, setGridOffset] = useState(0);
  const [mapStyle, setMapStyle] = useState<'carbon_heatmap' | 'topography' | 'hologram'>('carbon_heatmap');

  // Dynamic Resize Observer context
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ 
        width: Math.max(width, 400), 
        height: Math.max(height, 350) 
      });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update canvas size, coordinates of depo, and grid offset animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Centered depot coordinates update
    depot.x = dimensions.width / 2;
    depot.y = dimensions.height / 2;

  }, [dimensions, depot]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeView !== 'macro' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const w = canvas.width;
    const h = canvas.height;

    // Search matches within clickable bounds
    for (const hub of turkeyHubs) {
      const hx = (hub.xPct / 100) * w;
      const hy = (hub.yPct / 100) * h;
      const radius = 6.5 + (hub.currentOrders / 750);
      const clickableRadius = radius + 15; // friendly padding

      const dx = x - hx;
      const dy = y - hy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= clickableRadius) {
        setSelectedHub(hub.name);
        break;
      }
    }
  };

  // Handle continuous render ticks independent of React states
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const drawLoop = () => {
      // 1. Clear background
      ctx.fillStyle = '#03050c';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // 2. Draw Digital Grid Backplate
      drawGrid(ctx, dimensions.width, dimensions.height);

      // 3. Draw Weather Environments Slowdowns Overlay
      drawWeatherFX(ctx, dimensions.width, dimensions.height);

      // 4. Draw Specific View
      if (activeView === 'macro') {
        drawMacroView(ctx, dimensions.width, dimensions.height);
      } else {
        drawMicroView(ctx);
      }

      // 5. Draw active particle explosions
      drawParticles(ctx);

      // Scroll background grids
      setGridOffset(prev => (prev + 0.3 * params.simSpeed) % 50);

      animId = requestAnimationFrame(drawLoop);
    };

    animId = requestAnimationFrame(drawLoop);
    return () => cancelAnimationFrame(animId);
  }, [dimensions, activeView, params.simSpeed, params.weather, params.traffic, customers, couriers, turkeyHubs, macroTrucks, particles, loadingQueue, loadingBays, mapStyle, stats]);

  // Digital Twin techno-grid or GPS Coordinate Grid Layer
  const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // If in macro view and using Topography or Carbon heatmaps, draw a high-fidelity GPS Geographic style coordinate grid
    if (activeView === 'macro' && (mapStyle === 'topography' || mapStyle === 'carbon_heatmap')) {
      ctx.save();
      ctx.setLineDash([2, 5]);
      ctx.lineWidth = 0.8;
      ctx.font = '8px font-mono, monospace';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.35)'; // Slate light labels

      // 1. Draw Longitude lines (Turkish coordinates range 26°E to 45°E)
      const longitudes = [28, 31, 34, 37, 40, 43];
      longitudes.forEach(lon => {
        const x = ((lon - 26) / 19) * w;
        
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.08)';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();

        // Print longitude label at top & bottom edge
        ctx.textAlign = 'center';
        ctx.fillText(`${lon}°00' E`, x, 14);
        ctx.fillText(`${lon}°00' E`, x, h - 8);
      });

      // 2. Draw Latitude lines (Turkish coordinates range 36°N to 42°N)
      const latitudes = [37, 38, 39, 40, 41];
      latitudes.forEach(lat => {
        const y = ((42 - lat) / 6) * h;
        
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.08)';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();

        // Print latitude label on left & right edge border
        ctx.textAlign = 'left';
        ctx.fillText(`${lat}°00' N`, 10, y - 4);
        ctx.textAlign = 'right';
        ctx.fillText(`${lat}°00' N`, w - 10, y - 4);
      });

      ctx.restore();
    } else {
      // Classic hologram tactical scanline grid
      ctx.strokeStyle = mapStyle === 'hologram' ? 'rgba(59, 130, 246, 0.03)' : 'rgba(59, 130, 246, 0.025)';
      ctx.lineWidth = 1;
      const size = 50;

      ctx.beginPath();
      // vertical grid lines
      for (let x = 0; x < w; x += size) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      // animated horizontal scrolling grid
      for (let y = (gridOffset % size) - size; y < h; y += size) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();
    }
  };

  // Weather Environmental Simulation Glow
  const drawWeatherFX = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    if (params.weather === 'rainy') {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.02)';
      ctx.fillRect(0, 0, w, h);
      
      // Draw falling rain steaks
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.15)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let i = 0; i < 15; i++) {
        const rx = (Math.random() * w);
        const ry = (Math.random() * h);
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 4, ry + 16);
      }
      ctx.stroke();
    } else if (params.weather === 'snowy') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(0, 0, w, h);

      // Draw floating snow crystals
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (let i = 0; i < 20; i++) {
        const sx = Math.random() * w;
        const sy = Math.random() * h;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.2 + Math.random() * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // Macro Turkey Map View Renderer
  const drawMacroView = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // 1. High-Fidelity Turkey Boundary (24 geo-coordinates mapping)
    const turkeyBorder = [
      { x: 3, y: 31 }, // Edirne / Thrace
      { x: 12, y: 28 }, // Northern Istanbul Bosporus entrance
      { x: 15, y: 32 }, // Southern Istanbul Marmara exit
      { x: 18, y: 33 }, // Kocaeli Gulf
      { x: 26, y: 26 }, // Zonguldak / Western Black Sea bulge
      { x: 42, y: 21 }, // Sinop Cape (Most Northern Point)
      { x: 50, y: 26 }, // Samsun Gulf
      { x: 68, y: 24 }, // Trabzon Coast
      { x: 88, y: 23 }, // Northeast border / Artvin
      { x: 97, y: 30 }, // East border / Kars
      { x: 98, y: 48 }, // Mount Ararat
      { x: 99, y: 55 }, // Southeast border / Hakkarî
      { x: 80, y: 73 }, // Border near Şanlıurfa / Syria
      { x: 62, y: 76 }, // Hatay Southernmost tip
      { x: 58, y: 68 }, // Adana Gulf
      { x: 48, y: 74 }, // Mersin / Anamur Cape
      { x: 32, y: 76 }, // Antalya East Coast
      { x: 25, y: 75 }, // Antalya Gulf / Kemer
      { x: 18, y: 73 }, // Fethiye Peninsula
      { x: 8, y: 70 }, // Datça / Muğla tip
      { x: 6, y: 61 }, // Bodrum / Aegean
      { x: 3, y: 55 }, // İzmir / Karaburun
      { x: 5, y: 44 }, // Ayvalık / Gulf of Edremit
      { x: 1, y: 38 }, // Çanakkale / Troy
      { x: 2, y: 32 }, // Gelibolu Peninsula
    ];

    // Draw Map Landmass Backplate Glow
    ctx.beginPath();
    turkeyBorder.forEach((pt, idx) => {
      const bx = (pt.x / 100) * w;
      const by = (pt.y / 100) * h;
      if (idx === 0) ctx.moveTo(bx, by);
      else ctx.lineTo(bx, by);
    });
    ctx.closePath();

    // Adapt landmass fill and border color depending on selected mapStyle
    if (mapStyle === 'carbon_heatmap') {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.03)'; // Fresh ecological tint
      ctx.fill();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.28)'; // Emerald border glow
      ctx.lineWidth = 2.0;
      ctx.stroke();
    } else if (mapStyle === 'topography') {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.015)'; // Copper gold tint
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)'; // Glowing gold-copper borders
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Topological contours (multiple decreasing scales inside landmass)
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.04)';
      ctx.lineWidth = 0.8;
      for (const scale of [0.97, 0.94, 0.91]) {
        ctx.beginPath();
        turkeyBorder.forEach((pt, idx) => {
          // coordinate centering scale
          const bx = ((pt.x - 50) * scale + 50) / 100 * w;
          const by = ((pt.y - 50) * scale + 50) / 100 * h;
          if (idx === 0) ctx.moveTo(bx, by);
          else ctx.lineTo(bx, by);
        });
        ctx.closePath();
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.015)'; // Cyber blue tint
      ctx.fill();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.18)'; // Techno Indigo borders
      ctx.lineWidth = 2.0;
      ctx.stroke();
    }

    // National Radar Sweeper Sweep originating from Ankara (Central Node) for futuristic Hologram Style
    if (mapStyle === 'hologram') {
      const sweepAngle = (Date.now() / 1200) % (Math.PI * 2);
      ctx.save();
      const ax = 0.42 * w;
      const ay = 0.45 * h;
      const radarRadius = Math.max(w, h) * 0.65;
      
      const sweepGrad = ctx.createRadialGradient(ax, ay, 20, ax, ay, radarRadius);
      sweepGrad.addColorStop(0, 'rgba(59, 130, 246, 0.06)');
      sweepGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.02)');
      sweepGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');
      
      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.arc(ax, ay, radarRadius, sweepAngle, sweepAngle + Math.PI / 4);
      ctx.closePath();
      ctx.fill();
      
      // Radar sweep leading edge line
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + Math.cos(sweepAngle + Math.PI / 4) * radarRadius, ay + Math.sin(sweepAngle + Math.PI / 4) * radarRadius);
      ctx.stroke();
      ctx.restore();
    }

    // Internal political region highlights (dashed lines)
    ctx.strokeStyle = mapStyle === 'carbon_heatmap' 
      ? 'rgba(16, 185, 129, 0.05)' 
      : (mapStyle === 'topography' ? 'rgba(245, 158, 11, 0.04)' : 'rgba(99, 102, 241, 0.04)');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.35, h * 0.25);
    ctx.lineTo(w * 0.38, h * 0.77);
    ctx.moveTo(w * 0.65, h * 0.25);
    ctx.lineTo(w * 0.62, h * 0.77);
    ctx.stroke();

    // 2. Maritime Sea Typography Captions (Adds map realism)
    ctx.fillStyle = mapStyle === 'carbon_heatmap' 
      ? 'rgba(16, 185, 129, 0.45)' 
      : (mapStyle === 'topography' ? 'rgba(180, 130, 60, 0.45)' : 'rgba(30, 41, 59, 0.55)');
    ctx.font = '9px font-mono, monospace';
    ctx.letterSpacing = '5px';
    ctx.textAlign = 'center';
    ctx.fillText('KARADENİZ (BLACK SEA)', w * 0.52, h * 0.12);
    ctx.fillText('AKDENİZ (MEDITERRANEAN SEA)', w * 0.45, h * 0.88);
    ctx.fillText('EGE DENİZİ', w * 0.05, h * 0.78);
    ctx.fillText('MARMARA', w * 0.12, h * 0.36);
    ctx.letterSpacing = '0px'; // Reset letterspacing

    // 3. Connector pipelines between hubs
    ctx.strokeStyle = mapStyle === 'carbon_heatmap' 
      ? 'rgba(16, 185, 129, 0.06)' 
      : (mapStyle === 'topography' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(59, 130, 246, 0.04)');
    ctx.lineWidth = 1.0;
    const connections = [
      ['İstanbul', 'Bursa'], ['İstanbul', 'Ankara'], ['Bursa', 'İzmir'], 
      ['İzmir', 'Antalya'], ['Antalya', 'Adana'], ['Ankara', 'Adana'],
      ['Ankara', 'Samsun'], ['Samsun', 'Trabzon'], ['Trabzon', 'Erzurum'],
      ['Erzurum', 'Diyarbakır'], ['Diyarbakır', 'Van'], ['Ankara', 'Diyarbakır'],
      ['Bursa', 'Ankara']
    ];

    connections.forEach(conn => {
      const h1 = turkeyHubs.find(node => node.name === conn[0]);
      const h2 = turkeyHubs.find(node => node.name === conn[1]);
      if (h1 && h2) {
        ctx.beginPath();
        ctx.moveTo((h1.xPct / 100) * w, (h1.yPct / 100) * h);
        ctx.lineTo((h2.xPct / 100) * w, (h2.yPct / 100) * h);
        ctx.stroke();
      }
    });

    // 4. Draw Transit Cargo Trucks
    macroTrucks.forEach(truck => {
      const x1 = (truck.fromHub.xPct / 100) * w;
      const y1 = (truck.fromHub.yPct / 100) * h;
      const x2 = (truck.toHub.xPct / 100) * w;
      const y2 = (truck.toHub.yPct / 100) * h;

      const cx = x1 + (x2 - x1) * truck.progress;
      const cy = y1 + (y2 - y1) * truck.progress;

      // Glowing pink transiting particle
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ec4899';
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Static geographic coordinate mappings for topographic labels
    const hubCoords: Record<string, string> = {
      'İstanbul': "41.0°N, 29.0°E",
      'Bursa': "40.2°N, 29.1°E",
      'İzmir': "38.4°N, 27.1°E",
      'Antalya': "36.9°N, 30.7°E",
      'Ankara': "39.9°N, 32.9°E",
      'Samsun': "41.3°N, 36.3°E",
      'Adana': "37.0°N, 35.3°E",
      'Trabzon': "41.0°N, 39.7°E",
      'Erzurum': "39.9°N, 41.2°E",
      'Diyarbakır': "37.9°N, 40.2°E",
      'Van': "38.5°N, 43.4°E"
    };

    // 5. Regional Hubs and Carbon Intensity Heat Halos
    turkeyHubs.forEach(hub => {
      const hx = (hub.xPct / 100) * w;
      const hy = (hub.yPct / 100) * h;

      const isSnowingEast = (params.weather === 'snowy' && ['Erzurum', 'Trabzon', 'Van'].includes(hub.name));
      const isCongestedWest = (params.traffic > 55 && hub.name === 'İstanbul');

      let color = '#38bdf8'; // Glowing azure
      if (isSnowingEast) color = '#ffffff'; // White for blizzards
      if (isCongestedWest) color = '#f43f5e'; // Warning red

      // Dynamic Carbon footprint emission elements
      let carbonIntensityColor = 'rgba(16, 185, 129, 0.45)'; // Emerald for Eco / EV
      let carbonIntensityBlur = 10;
      if (params.vehicleType === 'van') {
        carbonIntensityColor = 'rgba(239, 68, 68, 0.45)'; // Crimson for fossil diesel van
        carbonIntensityBlur = 18;
      } else if (params.vehicleType === 'motorcycle') {
        carbonIntensityColor = 'rgba(245, 158, 11, 0.40)'; // Amber for regular motorcycle
        carbonIntensityBlur = 12;
      }

      // Draw Carbon Footprint Heat Aura
      const carbonRadius = 14 + (hub.currentOrders / 450);

      // If carbon heatmap is the active layer, draw the state-of-the-art radial heatmap pulses
      if (mapStyle === 'carbon_heatmap') {
        const radGrad = ctx.createRadialGradient(hx, hy, 4, hx, hy, carbonRadius * 1.6);
        if (params.vehicleType === 'ev') {
          radGrad.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
          radGrad.addColorStop(0.4, 'rgba(16, 185, 129, 0.12)');
          radGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
        } else if (params.vehicleType === 'van') {
          radGrad.addColorStop(0, 'rgba(239, 68, 68, 0.5)');
          radGrad.addColorStop(0.4, 'rgba(239, 68, 68, 0.16)');
          radGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        } else {
          radGrad.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
          radGrad.addColorStop(0.4, 'rgba(245, 158, 11, 0.12)');
          radGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        }
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(hx, hy, carbonRadius * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw dashed stroke showing emission boundary standard
      ctx.shadowBlur = carbonIntensityBlur;
      ctx.shadowColor = carbonIntensityColor;
      ctx.strokeStyle = carbonIntensityColor;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.arc(hx, hy, carbonRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Draw topography rings for geographic topo view
      if (mapStyle === 'topography') {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.12)';
        ctx.lineWidth = 0.5;
        for (let cr = 15; cr <= 35; cr += 10) {
          ctx.beginPath();
          ctx.arc(hx, hy, cr + Math.sin(Date.now() / 800 + hx) * 1.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Draw original Hub Core Node
      const radius = 6.5 + (hub.currentOrders / 750);
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(hx, hy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Pulsing Ring for live telemetry heartbeat
      const pulseRadius = radius + Math.sin(hub.pulse) * 4.5;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(hx, hy, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      // Visual Halo Selection Highlight
      if (hub.name === selectedHub) {
        ctx.strokeStyle = '#f59e0b'; // Dynamic glowing gold
        ctx.lineWidth = 2.0;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#f59e0b';
        ctx.beginPath();
        ctx.arc(hx, hy, radius + 7 + Math.sin(Date.now() / 120) * 2.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Label
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 9.5px Plus Jakarta Sans, "sans-serif"';
      ctx.textAlign = 'center';
      ctx.fillText(hub.name, hx, hy - radius - 8);

      // Info badge / telemetry data
      ctx.fillStyle = '#64748b';
      ctx.font = '7px font-mono, monospace';
      ctx.fillText(`K:${hub.activeCouriers} | S:${hub.currentOrders}`, hx, hy + radius + 11);

      // Draw dynamic carbon emission label right under the telemetry info
      // Estimate each hub's contribution relative to its base orders
      const orderShare = hub.baseOrders / 11450;
      const co2Val = stats.co2 > 0 ? (orderShare * stats.co2) : (orderShare * 15.6);
      
      let badgeColor = '#10b981'; // Green for eco carbon-neutral
      let badgeLabel = 'YÜKSEK YEŞİL';
      if (params.vehicleType === 'van') {
        badgeColor = '#ef4444'; // Red for high pollution
        badgeLabel = 'FOSİL SALINIM';
      } else if (params.vehicleType === 'motorcycle') {
        badgeColor = '#f59e0b'; // Yellow for moderate
        badgeLabel = 'STANDART ETKİ';
      }

      ctx.save();
      ctx.textAlign = 'center';
      
      if (mapStyle === 'carbon_heatmap') {
        // Neon-glowing Carbon Footprint Display directly on each city node
        ctx.fillStyle = badgeColor;
        ctx.font = 'bold 7.5px font-mono, monospace';
        ctx.fillText(`CO₂: ${co2Val.toFixed(2)} kg`, hx, hy + radius + 21);
        
        ctx.fillStyle = 'rgba(100, 116, 139, 0.4)';
        ctx.font = '5.5px font-mono, monospace';
        ctx.fillText(badgeLabel, hx, hy + radius + 28);
      } else if (mapStyle === 'topography') {
        // Draw coordinate positions for topographic GPS styling
        ctx.fillStyle = 'rgba(245, 158, 11, 0.65)';
        ctx.font = '6.5px font-mono, monospace';
        ctx.fillText(hubCoords[hub.name] || 'COORD UNKNOWN', hx, hy + radius + 21);
      }
      ctx.restore();
    });
  };

  // Micro View Representation (Selected City Area Grid Layout)
  const drawMicroView = (ctx: CanvasRenderingContext2D) => {
    // Street roadmap GPS background frame
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.02)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    // Draw horizontal road blocks
    for (let r = 50; r < dimensions.height; r += 70) {
      ctx.moveTo(0, r);
      ctx.lineTo(dimensions.width, r);
    }
    // Draw vertical road blocks
    for (let c = 50; c < dimensions.width; c += 80) {
      ctx.moveTo(c, 0);
      ctx.lineTo(c, dimensions.height);
    }
    ctx.stroke();

    // Draw some stylized diagonal highways
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.012)';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(dimensions.width * 1.2, dimensions.height);
    ctx.moveTo(dimensions.width, 0);
    ctx.lineTo(-200, dimensions.height);
    ctx.stroke();

    // 1. Render Cargo Central Depot Warehouse
    drawWarehouseDepot(ctx);

    // 2. Render Waiting Queue path indicator lines
    drawWarehouseQueueIndicator(ctx);

    // 3. Render Packages at customer drops
    customers.forEach(cust => {
      let color = '#10b981'; // Standard green
      if (cust.priority === 'Hızlı Teslimat') color = '#ec4899'; // Urgent magenta
      if (cust.priority === 'Aynı Gün') color = '#f59e0b'; // Amber yellow

      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cust.x, cust.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Halo pulse around urgent deliveries
      if (cust.priority === 'Hızlı Teslimat') {
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cust.x, cust.y, 5 + Math.sin(cust.pulseTime) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // 4. Render Active Couriers
    couriers.forEach(cour => {
      if (cour.state === 'idle' || cour.state === 'loading') return;

      let color = '#f59e0b'; // Delivery yellow
      if (cour.state === 'returning') color = '#64748b'; // Returning slate
      if (cour.state === 'entering_queue') color = '#3b82f6'; // Blue queue
      if (cour.state === 'delayed') color = '#f43f5e'; // Warning red

      // Delivery mode custom color depending on vehicleType
      if (cour.state === 'delivering') {
        if (cour.vehicleType === 'ev') {
          color = '#14b8a6'; // Cyan-Teal for Electric Vehicles
        } else if (cour.vehicleType === 'van') {
          color = '#a855f7'; // Bright Purple for Cargo Panelvans
        } else {
          color = '#f59e0b'; // Amber-Yellow for Motorcycles
        }
      }

      // Draw fading trail tracker path
      if (cour.trail.length > 0) {
        ctx.beginPath();
        ctx.moveTo(cour.trail[0].x, cour.trail[0].y);
        for (let i = 1; i < cour.trail.length; i++) {
          ctx.lineTo(cour.trail[i].x, cour.trail[i].y);
        }
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      // Main Courier Capsule Node shape depending on vehicleType
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      
      if (cour.vehicleType === 'van') {
        // Cargo Panelvan (Rounded Rectangle shape)
        ctx.beginPath();
        ctx.roundRect(cour.x - 6, cour.y - 3.5, 12, 7, 1.5);
        ctx.fill();
      } else if (cour.vehicleType === 'ev') {
        // High-tech Diamond shape for EV Leaf vehicles
        ctx.beginPath();
        ctx.moveTo(cour.x, cour.y - 5.5);
        ctx.lineTo(cour.x + 5.5, cour.y);
        ctx.lineTo(cour.x, cour.y + 5.5);
        ctx.lineTo(cour.x - 5.5, cour.y);
        ctx.closePath();
        ctx.fill();
      } else {
        // Classic fast Circle target for Motorcycles
        ctx.beginPath();
        ctx.arc(cour.x, cour.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Visual routing TSP link lines
      if (cour.state === 'delivering' && cour.packageBundle.length > 0) {
        ctx.beginPath();
        ctx.moveTo(cour.x, cour.y);
        for (let i = cour.currentStopIndex; i < cour.packageBundle.length; i++) {
          ctx.lineTo(cour.packageBundle[i].x, cour.packageBundle[i].y);
        }
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Visual text tags for active delays
      if (cour.state === 'delayed') {
        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 7.5px font-mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(cour.delayReason, cour.x, cour.y - 9);
      }
    });
  };

  // Draw central operations warehouse
  const drawWarehouseDepot = (ctx: CanvasRenderingContext2D) => {
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#3b82f6';
    ctx.fillStyle = 'rgba(7, 10, 22, 0.95)';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    // Rounded corner depot node
    ctx.roundRect(
      depot.x - depot.size / 2, 
      depot.y - depot.size / 2, 
      depot.size, 
      depot.size, 
      12
    );
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw active Loading Bays
    loadingBays.forEach(bay => {
      const bx = depot.x - 36;
      const by = depot.y + bay.offsetY;

      ctx.fillStyle = bay.courier ? 'rgba(244, 63, 94, 0.25)' : 'rgba(16, 185, 129, 0.15)';
      ctx.strokeStyle = bay.courier ? '#f43f5e' : '#10b981';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(bx - 12, by - 6, 24, 12, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '7px font-mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`R${bay.id}`, bx, by + 3);
    });

    // Depot label
    ctx.fillStyle = '#f59e0b'; // Gold branding
    ctx.font = 'bold 8.5px Plus Jakarta Sans, "sans-serif"';
    ctx.textAlign = 'center';
    ctx.fillText(selectedHub.toUpperCase(), depot.x + 10, depot.y - 2);
    ctx.font = '7px font-mono, monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('DEPOSU', depot.x + 10, depot.y + 7);
  };

  // Draw indicators for backlog queue
  const drawWarehouseQueueIndicator = (ctx: CanvasRenderingContext2D) => {
    if (loadingQueue.length === 0) return;

    const qStartX = depot.x + 36;
    const qStartY = depot.y;

    ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(qStartX, qStartY);
    ctx.lineTo(qStartX + loadingQueue.length * 11, qStartY);
    ctx.stroke();

    for (let i = 0; i < loadingQueue.length; i++) {
      const cx = qStartX + i * 11 + 5.5;
      const cy = qStartY;
      ctx.fillStyle = '#3b82f6';
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#3b82f6';
      ctx.beginPath();
      ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 8px font-mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`KUYRUK: ${loadingQueue.length}`, qStartX + 2, qStartY - 8);
  };

  // Particle updates
  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  };

  return (
    <div 
      className="bg-[#03050c] border border-white/[0.04] rounded-3xl relative overflow-hidden flex justify-center items-center shadow-2xl h-[520px] w-full shrink-0"
      ref={containerRef}
    >
      {/* HUD HEADER OVERLAY */}
      <div className="absolute top-5 left-5 bg-[#070a16]/85 backdrop-blur-md border border-white/5 rounded-xl px-4 py-2.5 text-[10px] font-extrabold tracking-widest text-blue-400 flex items-center gap-2 select-none uppercase shadow-lg select-none z-50">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
        <span id="hudLabel">
          {activeView === 'macro' 
            ? 'Türkiye Geneli Makro Lojistik Ağı' 
            : `${selectedHub} Hub Yüksek Sadakatli Ajan Simülasyonu`}
        </span>
      </div>

      {/* DISASTERS & SLA WARNING OVERLAYS */}
      {activeView === 'macro' && params.weather === 'snowy' && (
        <div className="absolute top-5 right-5 bg-rose-500/90 border border-rose-500 border-rose-600 rounded-xl px-4 py-2.5 text-xs font-bold text-white flex items-center gap-2 select-none animate-bounce shadow-xl z-50">
          <span>❄️</span>
          <span>ERZURUM/ Trabzon GÖÇÜK KAR FIRTINASI! OTONOM HIZ SINIRI ETKİN.</span>
        </div>
      )}

      {activeView === 'micro' && isSLAAtRisk && (
        <div className="absolute top-5 right-5 bg-rose-500/90 border border-rose-500 border-rose-600 rounded-xl px-4 py-2.5 text-xs font-bold text-white flex items-center gap-2 select-none animate-bounce shadow-xl z-50">
          <span>⚠️</span>
          <span>SLA LİMİTİ KRİTİK EŞİĞE GELDİ! HUB SIKIŞMA ALARMI.</span>
        </div>
      )}

      {/* MAIN CANVAS ELEMENT */}
      <canvas 
        ref={canvasRef} 
        style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
        className="block cursor-pointer" 
        onClick={handleCanvasClick}
      />

      {/* FLOATING MAP CONTROLS & ECO CO2 EMISSIONS LEGEND (Macro view specific) */}
      {activeView === 'macro' && (
        <div className="absolute bottom-5 left-5 bg-[#070a16]/90 backdrop-blur border border-white/5 p-4 rounded-2xl flex flex-col gap-3 shadow-2xl max-w-sm select-none z-50 animate-fade-in">
          <div>
            <div className="text-[9px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              TÜRKİYE DİJİTAL HARİTA KATMANI
            </div>
            <p className="text-[7.5px] text-slate-500 font-mono mt-0.5 leading-none">
              Harita tarzını değiştirerek karbon salınımı ve coğrafi yoğunluğu analiz edin.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => setMapStyle('carbon_heatmap')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-left transition-all duration-200 ${
                mapStyle === 'carbon_heatmap'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                  : 'bg-white/[0.01] border-white/5 text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
              }`}
            >
              <Leaf className="w-3.5 h-3.5" />
              <div className="flex-1">
                <div className="text-[9.5px] font-bold">🍀 Karbon Emisyon Isı Haritası</div>
                <div className="text-[7px] text-slate-500 font-mono">Hub bazlı gaz salınım bulutlarını ve CO₂ kg izler.</div>
              </div>
            </button>

            <button
              onClick={() => setMapStyle('topography')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-left transition-all duration-200 ${
                mapStyle === 'topography'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                  : 'bg-white/[0.01] border-white/5 text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <div className="flex-1">
                <div className="text-[9.5px] font-bold">📐 Topografik GPS Haritası</div>
                <div className="text-[7px] text-slate-500 font-mono">Enlem/Boylam ağ çizgileri ve coğrafi arazi koordinatları.</div>
              </div>
            </button>

            <button
              onClick={() => setMapStyle('hologram')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-left transition-all duration-200 ${
                mapStyle === 'hologram'
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                  : 'bg-white/[0.01] border-white/5 text-slate-405 hover:bg-white/[0.04] hover:text-slate-200'
              }`}
            >
              <Radar className="w-3.5 h-3.5" />
              <div className="flex-1">
                <div className="text-[9.5px] font-bold">📡 Hologram Ulusal Şebeke</div>
                <div className="text-[7px] text-slate-500 font-mono">Askeri radar taraması, canlı sevk hatları ve sinyalleri.</div>
              </div>
            </button>
          </div>

          {/* DYNAMIC CARBON SCALE BAR */}
          <div className="border-t border-white/5 pt-2.5 mt-0.5">
            <div className="flex justify-between text-[7px] font-mono text-slate-400 uppercase leading-none mb-1">
              <span>Karbon Salınım Ölçeği</span>
              <span className="font-bold text-emerald-400">Canlı Değerler</span>
            </div>
            <div className="h-2 w-full rounded bg-slate-800/80 flex overflow-hidden p-[1px] border border-white/5">
              <span className="flex-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500"></span>
            </div>
            <div className="flex justify-between text-[6.5px] font-mono text-slate-500 mt-1">
              <span>TEMİZ (%100 EV)</span>
              <span>LİMİTTE (MOTOR)</span>
              <span>KRİTİK (KARA PANELVAN)</span>
            </div>
          </div>
        </div>
      )}

      {/* LEGEND HUD OVERLAY */}
      <div className="absolute bottom-5 right-5 bg-[#070a16]/85 backdrop-blur px-4 py-2.5 rounded-xl border border-white/5 flex gap-4 text-[10px] font-bold select-none text-slate-300 shadow-xl z-50">
        {activeView === 'macro' ? (
          <>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-md shadow-blue-500/20 animate-pulse"></span> Bölgesel Hub
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white shadow-md shadow-white/20"></span> Karlı Karayolu
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-md shadow-pink-500/20"></span> Kurye Transit
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-md shadow-blue-500/20"></span> Depo Rampa
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/20"></span> Müşteri
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-md shadow-amber-500/20"></span> Kurye (Dolu)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shadow-md shadow-slate-500/20"></span> Kurye (Boş)
            </div>
          </>
        )}
      </div>
    </div>
  );
};
