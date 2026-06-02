/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { SidebarControls } from './components/SidebarControls';
import { MetricsHeader } from './components/MetricsHeader';
import { SimulationCanvas } from './components/SimulationCanvas';
import { TelemetryLogs } from './components/TelemetryLogs';
import { CarbonFootprintWidget } from './components/CarbonFootprintWidget';
import { 
  Customer, 
  Courier, 
  TurkeyHub, 
  MacroTruck, 
  Particle, 
  SimulationParams, 
  SimulationStats, 
  TelemetryLog 
} from './types';

// Physical Constant Scale Multipliers
const DISTANCE_SCALE = 0.005; // 1 pixel = 5 meters (0.005 km)
const TIME_SCALE = 150;        // 1 real second = 150 sim-seconds (2.5 sim minutes)

const WEATHER_SPEED_MULTI = { sunny: 1.0, rainy: 0.8, snowy: 0.4 };
const WEATHER_FAIL_RISK = { sunny: 0.015, rainy: 0.07, snowy: 0.20 };

const VEHICLE_STATS = {
  motorcycle: { speedKmh: 45, trafficResist: 0.75, co2PerKm: 0.04, capacity: 5 },
  van: { speedKmh: 30, trafficResist: 0.25, co2PerKm: 0.16, capacity: 15 },
  ev: { speedKmh: 35, trafficResist: 0.40, co2PerKm: 0.00, capacity: 10 }
};

export default function App() {
  // Views and Policies Standard state
  const [activeView, setActiveView] = useState<'macro' | 'micro'>('macro');
  const [activePolicy, setActivePolicy] = useState<'dynamic' | 'sla' | 'eco' | 'safety'>('dynamic');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [selectedHub, setSelectedHub] = useState<string>('İstanbul');

  // Global Interactive Parameters state
  const [params, setParams] = useState<SimulationParams>({
    traffic: 20,
    weather: 'sunny',
    customerAbsence: 5,
    orderRate: 4,
    courierCount: 45,
    simSpeed: 1,
    vehicleType: 'motorcycle',
    fleetComposition: {
      motorcycle: 50,
      van: 25,
      ev: 25
    },
    bayCount: 3,
    maxLoad: 4,
    routingAlgorithm: 'tsp',
  });

  const getVehicleTypeByCompositionIndex = (index: number): 'motorcycle' | 'van' | 'ev' => {
    const mRatio = params.fleetComposition?.motorcycle ?? 50;
    const vRatio = params.fleetComposition?.van ?? 25;
    const evRatio = params.fleetComposition?.ev ?? 25;
    const total = mRatio + vRatio + evRatio || 1;
    
    const pct = (index * 7.3) % 1; // Psuedo-stochastic distribution to spread vehicles nicely
    const mThreshold = mRatio / total;
    const vThreshold = (mRatio + vRatio) / total;
    
    if (pct < mThreshold) return 'motorcycle';
    if (pct < vThreshold) return 'van';
    return 'ev';
  };

  // Main high-perf mutable stats refs
  const statsRef = useRef<SimulationStats>({
    success: 0,
    failed: 0,
    totalOrdersGenerated: 0,
    totalDeliveryTime: 0,
    totalDistance: 0,
    deadDistance: 0,
    co2: 0,
    drivingTime: 0,
    idleTime: 0,
    telemetryCount: 0,
    queueTotalWaitTime: 0,
    queueEnteredCount: 0,
    queueBottleneckTicks: 0,
    totalSimTicks: 0,
    slaWindow: [],
    revenue: 0,
    spendingWages: 0,
    spendingFuel: 0,
    spendingBays: 0,
    spendingPenalties: 0,
  });

  // Standard React rendering state synchronized at set frame rates
  const [syncedStats, setSyncedStats] = useState<SimulationStats>({ ...statsRef.current });

  // Simulation Entities Refs to prevent state delay in fast canvas loops
  const customersRef = useRef<Customer[]>([]);
  const couriersRef = useRef<Courier[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const loadingQueueRef = useRef<Courier[]>([]);
  const logCounterRef = useRef<number>(0);

  // Loading bays references inside warehouse (Kadıköy)
  const loadingBaysRef = useRef([
    { id: 1, offsetY: -20, courier: null as Courier | null, timeLeft: 0 },
    { id: 2, offsetY: 0, courier: null as Courier | null, timeLeft: 0 },
    { id: 3, offsetY: 20, courier: null as Courier | null, timeLeft: 0 }
  ]);

  // Center coordinate reference for depot
  const depotRef = useRef({ x: 400, y: 300, size: 44 });

  // Stream logs
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const loggedEventsSetRef = useRef<Set<string>>(new Set());

  // Turkey Macro Network nodes initialization
  const turkeyHubsRef = useRef<TurkeyHub[]>([
    { name: 'İstanbul', xPct: 14, yPct: 30, baseOrders: 2400, activeCouriers: 3100, currentOrders: 2400, pulse: 0 },
    { name: 'Bursa', xPct: 20, yPct: 42, baseOrders: 850, activeCouriers: 950, currentOrders: 850, pulse: 0 },
    { name: 'İzmir', xPct: 8, yPct: 55, baseOrders: 1400, activeCouriers: 1550, currentOrders: 1400, pulse: 0 },
    { name: 'Antalya', xPct: 25, yPct: 72, baseOrders: 600, activeCouriers: 750, currentOrders: 600, pulse: 0 },
    { name: 'Ankara', xPct: 42, yPct: 45, baseOrders: 1900, activeCouriers: 2050, currentOrders: 1900, pulse: 0 },
    { name: 'Samsun', xPct: 54, yPct: 28, baseOrders: 450, activeCouriers: 550, currentOrders: 450, pulse: 0 },
    { name: 'Adana', xPct: 56, yPct: 75, baseOrders: 800, activeCouriers: 900, currentOrders: 800, pulse: 0 },
    { name: 'Trabzon', xPct: 70, yPct: 26, baseOrders: 400, activeCouriers: 450, currentOrders: 400, pulse: 0 },
    { name: 'Erzurum', xPct: 84, yPct: 38, baseOrders: 350, activeCouriers: 450, currentOrders: 350, pulse: 0 },
    { name: 'Diyarbakır', xPct: 82, yPct: 64, baseOrders: 550, activeCouriers: 700, currentOrders: 550, pulse: 0 },
    { name: 'Van', xPct: 92, yPct: 54, baseOrders: 250, activeCouriers: 300, currentOrders: 250, pulse: 0 }
  ]);

  const macroTrucksRef = useRef<MacroTruck[]>([]);

  // Simulation Time Track meters
  const simTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const orderTimerRef = useRef<number>(0);

  // Initialize Turkey network road lines
  const initMacroPipeline = () => {
    const pipelines = [
      ['İstanbul', 'Bursa'], ['İstanbul', 'Ankara'], ['Bursa', 'İzmir'], 
      ['İzmir', 'Antalya'], ['Antalya', 'Adana'], ['Ankara', 'Adana'],
      ['Ankara', 'Samsun'], ['Samsun', 'Trabzon'], ['Trabzon', 'Erzurum'],
      ['Erzurum', 'Diyarbakır'], ['Diyarbakır', 'Van'], ['Ankara', 'Diyarbakır'],
      ['Bursa', 'Ankara']
    ];

    const trucks: MacroTruck[] = [];
    pipelines.forEach(conn => {
      const h1 = turkeyHubsRef.current.find(h => h.name === conn[0]);
      const h2 = turkeyHubsRef.current.find(h => h.name === conn[1]);
      if (h1 && h2) {
        trucks.push({ fromHub: h1, toHub: h2, progress: Math.random(), speed: 0.005 + Math.random() * 0.008 });
        trucks.push({ fromHub: h2, toHub: h1, progress: Math.random(), speed: 0.005 + Math.random() * 0.008 });
      }
    });
    macroTrucksRef.current = trucks;
  };

  // Re-generate courier pool strictly matching state count
  const initCouriers = () => {
    couriersRef.current = [];
    loadingQueueRef.current = [];
    loadingBaysRef.current.forEach(b => {
      b.courier = null;
      b.timeLeft = 0;
    });

    for (let i = 0; i < params.courierCount; i++) {
      const c: Courier = {
        id: i + 1,
        x: depotRef.current.x,
        y: depotRef.current.y,
        state: 'entering_queue',
        targetCustomer: null,
        packageBundle: [],
        currentStopIndex: 0,
        packageCreatedAt: 0,
        trail: [],
        delayTicks: 0,
        delayReason: '',
        vehicleType: getVehicleTypeByCompositionIndex(i),
      };
      loadingQueueRef.current.push(c);
      couriersRef.current.push(c);
    }
  };

  // Dispatch live telemetry logs
  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'normal' = 'normal') => {
    const logId = `${simTimeRef.current}-${logCounterRef.current++}-${Math.random()}`;
    const newLog: TelemetryLog = {
      id: logId,
      timestamp: Math.floor(simTimeRef.current),
      message,
      type
    };

    setLogs(prev => {
      const truncated = prev.length > 40 ? prev.slice(0, 39) : prev;
      return [newLog, ...truncated];
    });

    statsRef.current.telemetryCount++;
  };

  // Particle bursts coordinates helper
  const createExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 9; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4.4,
        vy: (Math.random() - 0.5) * 4.4,
        color,
        life: 1.0,
        decay: 0.03 + Math.random() * 0.04,
        size: 1.8 + Math.random() * 2.8,
      });
    }
  };

  // Nearest Neighbor TSP heuristic router optimization
  const optimizeBundleRoute = (bundle: Customer[]) => {
    if (params.routingAlgorithm === 'fifo') {
      return [...bundle].sort((a, b) => a.id - b.id);
    }
    
    if (params.routingAlgorithm === 'sla-first') {
      const urgent = bundle.filter(c => c.priority === 'Hızlı Teslimat');
      const standard = bundle.filter(c => c.priority !== 'Hızlı Teslimat');
      return [...optimizeNearestNeighbor(urgent), ...optimizeNearestNeighbor(standard)];
    }

    return optimizeNearestNeighbor(bundle);
  };

  const optimizeNearestNeighbor = (pool: Customer[]) => {
    const list = [...pool];
    const sorted: Customer[] = [];
    let cx = depotRef.current.x;
    let cy = depotRef.current.y;

    while (list.length > 0) {
      let bestIdx = 0;
      let minDist = Infinity;
      for (let i = 0; i < list.length; i++) {
        const dx = list[i].x - cx;
        const dy = list[i].y - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minDist) {
          minDist = d;
          bestIdx = i;
        }
      }
      const nextStop = list.splice(bestIdx, 1)[0];
      sorted.push(nextStop);
      cx = nextStop.x;
      cy = nextStop.y;
    }
    return sorted;
  };

  // Order generator trigger
  const triggerNewOrderGeneration = () => {
    const margin = 70;
    const widthLimit = depotRef.current.x * 2;
    const heightLimit = depotRef.current.y * 2;

    let rx = margin + Math.random() * (widthLimit - margin * 2);
    let ry = margin + Math.random() * (heightLimit - margin * 2);

    // Keep orders from spawning right on top of DEPOT
    const dx = rx - depotRef.current.x;
    const dy = ry - depotRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) < 80) {
      rx += dx > 0 ? 90 : -90;
      ry += dy > 0 ? 90 : -90;
    }

    const rnd = Math.random();
    let priorityVal: Customer['priority'] = 'Standart';
    if (rnd > 0.85) {
      priorityVal = 'Hızlı Teslimat';
    } else if (rnd > 0.65) {
      priorityVal = 'Aynı Gün';
    }

    const orderId = statsRef.current.totalOrdersGenerated + 1;
    const newCustomer: Customer = {
      id: orderId,
      x: rx,
      y: ry,
      createdAt: simTimeRef.current,
      priority: priorityVal,
      pulseTime: Math.random() * Math.PI,
    };

    customersRef.current.push(newCustomer);
    statsRef.current.totalOrdersGenerated++;

    addLog(`Yeni Sipariş #${newCustomer.id} [${newCustomer.priority}] sisteme alındı. Hub yönlendirmesi aktif.`, 'normal');
  };

  // Reset core states to defaults
  const handleReset = () => {
    setIsRunning(false); // Pause simulation on reset
    simTimeRef.current = 0;
    lastTimeRef.current = 0;
    orderTimerRef.current = 0;
    customersRef.current = [];
    particlesRef.current = [];
    
    // Reset all Turkey region hub orders and pulses
    turkeyHubsRef.current.forEach(hub => {
      hub.currentOrders = hub.baseOrders;
      hub.pulse = 0;
    });

    statsRef.current = {
      success: 0,
      failed: 0,
      totalOrdersGenerated: 0,
      totalDeliveryTime: 0,
      totalDistance: 0,
      deadDistance: 0,
      co2: 0,
      drivingTime: 0,
      idleTime: 0,
      telemetryCount: 1,
      queueTotalWaitTime: 0,
      queueEnteredCount: 0,
      queueBottleneckTicks: 0,
      totalSimTicks: 0,
      slaWindow: [],
      revenue: 0,
      spendingWages: 0,
      spendingFuel: 0,
      spendingBays: 0,
      spendingPenalties: 0,
    };

    initCouriers();
    initMacroPipeline();
    setSyncedStats({ ...statsRef.current });
    
    // Set a clean and descriptive initial log message on reset
    const resetLog: TelemetryLog = {
      id: `reset-${Date.now()}`,
      timestamp: 0,
      message: "Dijital ikiz sistemi başarıyla fabrika ayarlarına sıfırlandı. Yeni bir test başlatmak için 'Başlat' butonuna tıklayabilirsiniz.",
      type: "info"
    };
    setLogs([resetLog]);
  };

  // Start initialization hooks
  useEffect(() => {
    initMacroPipeline();
    initCouriers();
    addLog("Dijital ikiz kontrol kulesi bağlandı. Canlı telemetri akışı izleniyor.", "info");
  }, []);

  // Sync loading bays with params.bayCount
  useEffect(() => {
    const currentBays = loadingBaysRef.current;
    const nextBays = Array.from({ length: params.bayCount }, (_, i) => {
      const existing = currentBays[i];
      const spacing = 18;
      const totalHeight = (params.bayCount - 1) * spacing;
      const startY = -totalHeight / 2;
      return {
        id: i + 1,
        offsetY: startY + i * spacing,
        courier: existing ? existing.courier : null as Courier | null,
        timeLeft: existing ? existing.timeLeft : 0
      };
    });
    loadingBaysRef.current = nextBays;
    addLog(`Depo yükleme rampa kapasitesi ${params.bayCount} rampa olarak güncellendi.`, 'info');
  }, [params.bayCount]);

  // Update couriers when courierCount parameter is modified manually (whenever not in dynamic state)
  useEffect(() => {
    if (activePolicy !== 'dynamic' && isRunning) {
      const diff = params.courierCount - couriersRef.current.length;
      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          const nextId = couriersRef.current.length + 1;
          const nc: Courier = {
            id: nextId,
            x: depotRef.current.x,
            y: depotRef.current.y,
            state: 'entering_queue',
            targetCustomer: null,
            packageBundle: [],
            currentStopIndex: 0,
            packageCreatedAt: 0,
            trail: [],
            delayTicks: 0,
            delayReason: '',
            vehicleType: getVehicleTypeByCompositionIndex(nextId - 1),
          };
          loadingQueueRef.current.push(nc);
          couriersRef.current.push(nc);
        }
        addLog(`Otonom kurye havuzu boyutu manuel olarak ${params.courierCount} birime ölçeklendi.`, 'info');
      } else if (diff < 0) {
        couriersRef.current = couriersRef.current.slice(0, params.courierCount);
        loadingQueueRef.current = loadingQueueRef.current.filter(c => c.id <= params.courierCount);
        addLog(`Otonom kurye havuzu boyutu manuel olarak ${params.courierCount} birime düşürüldü.`, 'info');
      }
    }
  }, [params.courierCount, activePolicy]);

  // Sync existing couriers vehicle types when fleet composition splits change
  useEffect(() => {
    couriersRef.current.forEach((cour, idx) => {
      cour.vehicleType = getVehicleTypeByCompositionIndex(idx);
    });
    addLog("Saha filosunun araç dağılım kompozisyonu operasyonel olarak güncellendi.", "info");
  }, [params.fleetComposition?.motorcycle, params.fleetComposition?.van, params.fleetComposition?.ev]);

  // Log active policy shifts
  useEffect(() => {
    addLog(`Merkeziyetsiz Ajan Politikası Aktif Edildi: [${activePolicy.toUpperCase()}]`, 'info');
  }, [activePolicy]);

  // View switches
  useEffect(() => {
    addLog(`Operasyon görünümü değiştirildi: [${activeView.toUpperCase()} GÖRÜNÜMÜ]`, 'info');
  }, [activeView]);

  // Core Math & Physics Tick Loops
  useEffect(() => {
    if (!isRunning) return;

    let lastTimestamp = performance.now();
    let renderSyncInterval = 0;

    const simTick = (timestamp: number) => {
      const deltaMs = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      // Throttle extreme browser frame lag
      const dt = Math.min(deltaMs, 100);

      const speedFactor = params.simSpeed;
      const stepSimSec = (dt / 1000) * speedFactor * TIME_SCALE;

      simTimeRef.current += stepSimSec;
      statsRef.current.totalSimTicks += dt * speedFactor;

      // Accumulate hourly operational costs (wages and active loading bays)
      const stepSimHours = stepSimSec / 3600;
      statsRef.current.spendingWages += 25 * couriersRef.current.length * stepSimHours;
      statsRef.current.spendingBays += 35 * params.bayCount * stepSimHours;

      // MACRO VIEW RECKONING
      if (activeView === 'macro') {
        // Stochastic fluctuating regional load orders
        turkeyHubsRef.current.forEach(hub => {
          hub.pulse += 0.05 * speedFactor;
          if (Math.random() < 0.04 * speedFactor) {
            hub.currentOrders = Math.max(
              150, 
              hub.baseOrders + Math.floor((Math.random() - 0.5) * (hub.baseOrders * 0.35))
            );
          }
        });

        // Pipeline transits
        macroTrucksRef.current.forEach(truck => {
          const weatherModifier = WEATHER_SPEED_MULTI[params.weather];
          const trafficModifier = 1 - (params.traffic / 185);
          const totalModifier = weatherModifier * trafficModifier;

          truck.progress += truck.speed * speedFactor * totalModifier * 0.25;
          if (truck.progress >= 1.0) {
            truck.progress = 0;
            // Reverse travel
            const temp = truck.fromHub;
            truck.fromHub = truck.toHub;
            truck.toHub = temp;
          }
        });
      } 
      // MICRO VIEW (KADIKÖY)
      else {
        // 1. Order Arrival Tick
        orderTimerRef.current += dt * speedFactor;
        const requiredIntervalMs = 1000 / params.orderRate;
        if (orderTimerRef.current >= requiredIntervalMs) {
          const spawnCount = Math.floor(orderTimerRef.current / requiredIntervalMs);
          for (let i = 0; i < spawnCount; i++) {
            triggerNewOrderGeneration();
          }
          orderTimerRef.current = orderTimerRef.current % requiredIntervalMs;
        }

        // 2. Dynamic auto-scaling policy trigger
        if (activePolicy === 'dynamic') {
          const backlog = customersRef.current.length;
          const currentCount = couriersRef.current.length;

          if (backlog > 20 && currentCount < 110 && Math.random() < 0.08 * speedFactor) {
            const nextId = currentCount + 1;
            const spawnedCourier: Courier = {
              id: nextId,
              x: depotRef.current.x,
              y: depotRef.current.y,
              state: 'entering_queue',
              targetCustomer: null,
              packageBundle: [],
              currentStopIndex: 0,
              packageCreatedAt: 0,
              trail: [],
              delayTicks: 0,
              delayReason: '',
              vehicleType: getVehicleTypeByCompositionIndex(nextId - 1),
            };
            loadingQueueRef.current.push(spawnedCourier);
            couriersRef.current.push(spawnedCourier);
            setParams(p => ({ ...p, courierCount: nextId }));
            addLog(`📈 Dinamik Politika: Sipariş yoğunluğu arttı. Kurye #${nextId} sahaya sürüldü.`, 'info');
          } else if (backlog < 5 && currentCount > 45 && Math.random() < 0.04 * speedFactor) {
            const idleIndex = couriersRef.current.findIndex(c => c.state === 'idle' || c.state === 'entering_queue');
            if (idleIndex !== -1) {
              const removed = couriersRef.current.splice(idleIndex, 1)[0];
              loadingQueueRef.current = loadingQueueRef.current.filter(q => q.id !== removed.id);
              setParams(p => ({ ...p, courierCount: couriersRef.current.length }));
              addLog(`📉 Dinamik Politika: Sipariş yükü hafifledi. Kurye #${removed.id} garaja çekildi.`, 'info');
            }
          }
        }

        // 3. Update loading bays & queue theory bottlenecks
        let baysOccupied = 0;
        loadingBaysRef.current.forEach(bay => {
          if (bay.courier) {
            baysOccupied++;
            bay.timeLeft -= stepSimSec;
            if (bay.timeLeft <= 0) {
              const courier = bay.courier;
              bay.courier = null;

              // Compute loading payload size based directly on the strategic maxLoad lever configured by the operator
              const maxPayload = params.maxLoad;

              const loadSize = Math.min(maxPayload, customersRef.current.length);
              if (loadSize > 0) {
                const bundle: Customer[] = [];
                for (let i = 0; i < loadSize; i++) {
                  const custIndex = Math.floor(Math.random() * customersRef.current.length);
                  bundle.push(customersRef.current.splice(custIndex, 1)[0]);
                }

                // Apply TSP Routing
                courier.packageBundle = optimizeBundleRoute(bundle);
                courier.targetCustomer = courier.packageBundle[0];
                courier.packageCreatedAt = courier.targetCustomer.createdAt;
                courier.state = 'delivering';
                courier.currentStopIndex = 0;
                courier.trail = [];

                addLog(`Kurye #${courier.id} depodan ${loadSize} sipariş yükledi ve VRP rotasına çıktı.`, 'info');
              } else {
                courier.state = 'idle';
              }
            }
          }
        });

        if (baysOccupied === loadingBaysRef.current.length) {
          statsRef.current.queueBottleneckTicks += dt * speedFactor;
        }

        // Dispatch waiting queue vehicles to empty bays
        let emptyBay = loadingBaysRef.current.find(b => b.courier === null);
        while (emptyBay && loadingQueueRef.current.length > 0) {
          const nextCourier = loadingQueueRef.current.shift()!;
          emptyBay.courier = nextCourier;
          nextCourier.state = 'loading';

          // loading process time (sim-seconds)
          const baseLoadingTime = activePolicy === 'eco' ? 180 : 120;
          emptyBay.timeLeft = baseLoadingTime;

          emptyBay = loadingBaysRef.current.find(b => b.courier === null);
        }

        // 4. Update Micro Couriers Physics & Deliveries
        couriersRef.current.forEach(cour => {
          if (cour.state === 'idle') {
            statsRef.current.idleTime += stepSimSec;
            return;
          }

          if (cour.state === 'loading') {
            return;
          }

          if (cour.state === 'delayed') {
            cour.delayTicks -= stepSimSec;
            if (cour.delayTicks <= 0) {
              cour.state = 'delivering';
              addLog(`Kurye #${cour.id} gecikme engelini çözerek dağıtıma devam ediyor.`, 'normal');
            }
            return;
          }

          if (cour.state === 'entering_queue') {
            statsRef.current.queueTotalWaitTime += stepSimSec;
            return;
          }

          statsRef.current.drivingTime += stepSimSec;

          // Compute dynamics velocity
          const vStats = VEHICLE_STATS[cour.vehicleType];
          const weatherMulti = WEATHER_SPEED_MULTI[params.weather];
          const trafficSlowdown = 1 - (params.traffic / 100) * (1 - vStats.trafficResist);
          const policyMulti = activePolicy === 'eco' ? 0.82 : 1.0; // Eco limits speed for emission optimization

          const speedKmh = vStats.speedKmh * weatherMulti * trafficSlowdown * policyMulti;
          const traveledKm = (speedKmh / 3600) * stepSimSec;
          const traveledPx = traveledKm / DISTANCE_SCALE;

          statsRef.current.totalDistance += traveledKm;
          // Fuel and depreciation cost tailored per vehicle type
          const energyCostMultiplier = cour.vehicleType === 'ev' ? 0.35 : cour.vehicleType === 'van' ? 1.85 : 0.85;
          statsRef.current.spendingFuel += traveledKm * energyCostMultiplier;
          
          if (cour.state === 'returning') {
            statsRef.current.deadDistance += traveledKm;
          }

          // CO2 Footprint accounting
          let emissionRatio = vStats.co2PerKm;
          if (activePolicy === 'eco') {
            emissionRatio *= 0.70; // Eco driving saves 30% emissions
          }
          statsRef.current.co2 += traveledKm * emissionRatio;

          const targetX = cour.state === 'delivering' && cour.targetCustomer ? cour.targetCustomer.x : depotRef.current.x;
          const targetY = cour.state === 'delivering' && cour.targetCustomer ? cour.targetCustomer.y : depotRef.current.y;

          const dx = targetX - cour.x;
          const dy = targetY - cour.y;
          const distancePx = Math.sqrt(dx * dx + dy * dy);

          // Update Trail tracker
          cour.trail.push({ x: cour.x, y: cour.y });
          if (cour.trail.length > 8) cour.trail.shift();

          // Flat tire accidental hazard
          if (cour.state === 'delivering' && Math.random() < 0.00018 * speedFactor) {
            // Safety policy completely nullifies accidents 
            if (activePolicy !== 'safety' || (params.weather === 'snowy' && Math.random() < 0.2)) {
              cour.state = 'delayed';
              cour.delayTicks = 200; // time offset
              cour.delayReason = 'LASTİK PATLADI';
              createExplosion(cour.x, cour.y, '#f43f5e');
              addLog(`⚠️ Aksaklık: Kurye #${cour.id} lastik hasarı nedeniyle gecikmeye girdi.`, 'error');
              return;
            }
          }

          if (distancePx < traveledPx) {
            cour.x = targetX;
            cour.y = targetY;

            if (cour.state === 'delivering' && cour.targetCustomer) {
              const customerObj = cour.targetCustomer;
              const deliveryDuration = simTimeRef.current - cour.packageCreatedAt;

              // Absence metrics
              const absenceProbability = params.customerAbsence / 100;
              let hazardProbability = WEATHER_FAIL_RISK[params.weather];
              if (activePolicy === 'safety') {
                hazardProbability = 0; // safety metrics override
              }

              const failedDelivery = Math.random() < (absenceProbability + hazardProbability);

              if (!failedDelivery) {
                statsRef.current.success++;
                statsRef.current.totalDeliveryTime += deliveryDuration;
                createExplosion(cour.x, cour.y, '#10b981');
                
                // Financial Revenue Tracking
                const isExpress = customerObj.priority === 'Hızlı Teslimat';
                const premiumPayment = isExpress ? 25 : 15;
                statsRef.current.revenue += premiumPayment;

                // SLA validation: Check if custom threshold exceeded
                const threshold = isExpress ? 480 : 900; // 8 minutes vs 15 minutes
                if (deliveryDuration > threshold) {
                  const lateFee = isExpress ? 30 : 20;
                  statsRef.current.spendingPenalties += lateFee;
                  addLog(`⚠️ Geç Teslim: Sipariş #${customerObj.id} süre sınırını aşarak gecikmeli teslim edildi (Ceza: -$${lateFee})`, 'error');
                } else {
                  addLog(`Sipariş #${customerObj.id} [${customerObj.priority}] -> Başarıyla Zamanında Teslim Edildi (Kurye #${cour.id})`, 'success');
                }

                // Record rolling SLA metric window
                const currentSLA = (statsRef.current.success / (statsRef.current.success + statsRef.current.failed)) * 100;
                statsRef.current.slaWindow.push(currentSLA);
                if (statsRef.current.slaWindow.length > 50) statsRef.current.slaWindow.shift();

              } else {
                statsRef.current.failed++;
                createExplosion(cour.x, cour.y, '#f43f5e');
                
                // Add failed delivery penalty
                statsRef.current.spendingPenalties += 30; // $30 failure penalty
                
                const reasonStr = Math.random() < absenceProbability ? 'Müşteri Adreste Bulunamadı' : 'Saha Hava Engeli / Kaza';
                addLog(`Sipariş #${customerObj.id} [${customerObj.priority}] -> Alıcı Hatası / İade: ${reasonStr} (Ceza: -$30)`, 'error');
              }

              // Proceed to next stop or return empty
              cour.currentStopIndex++;
              if (cour.currentStopIndex < cour.packageBundle.length) {
                cour.targetCustomer = cour.packageBundle[cour.currentStopIndex];
                cour.packageCreatedAt = cour.targetCustomer.createdAt;

                // address finding search delay
                if (Math.random() < 0.12) {
                  cour.state = 'delayed';
                  cour.delayTicks = 110;
                  cour.delayReason = 'ADRES ARAMA';
                }
              } else {
                cour.state = 'returning';
                cour.targetCustomer = null;
                cour.packageBundle = [];
              }

            } else if (cour.state === 'returning') {
              cour.state = 'entering_queue';
              cour.trail = [];
              loadingQueueRef.current.push(cour);
              statsRef.current.queueEnteredCount++;
            }
          } else {
            // Traverse
            cour.x += (dx / distancePx) * traveledPx;
            cour.y += (dy / distancePx) * traveledPx;
          }
        });
      }

      // 5. Sync React states periodically to guarantee smooth 60fps rendering
      renderSyncInterval += dt;
      if (renderSyncInterval > 150) {
        setSyncedStats({ ...statsRef.current });
        renderSyncInterval = 0;
      }

      const loopId = requestAnimationFrame(simTick);
      return loopId;
    };

    const activeLoopId = requestAnimationFrame(simTick);
    return () => cancelAnimationFrame(activeLoopId);
  }, [isRunning, activeView, activePolicy, params]);

  // Export fully detailed operational simulation ledger
  const onExportCSV = () => {
    const totalProcessed = statsRef.current.success + statsRef.current.failed;
    const slaSuccess = totalProcessed > 0 ? (statsRef.current.success / totalProcessed) * 100 : 98.2;
    const avgDeliveryMin = statsRef.current.success > 0 ? (statsRef.current.totalDeliveryTime / statsRef.current.success) / 60 : 0.0;
    const bottleneckPercent = statsRef.current.totalSimTicks > 0 ? (statsRef.current.queueBottleneckTicks / statsRef.current.totalSimTicks) * 100 : 0.0;
    const deadMileagePct = statsRef.current.totalDistance > 0 ? (statsRef.current.deadDistance / statsRef.current.totalDistance) * 100 : 0.0;

    const csvRows = [
      ['Metrik Parametre Raporu', 'Dijital Ikiz Degeri'],
      ['Olusturuldugu Tarih (UTC)', new Date().toISOString()],
      ['Aktif Gorunum Katmani', activeView === 'macro' ? 'Turkiye Geneli (Makro)' : `${selectedHub} Hub (Mikro)`],
      ['Uygulanan Mobil Karar Politikasi', activePolicy.toUpperCase()],
      ['Toplam Basarili Siparis Teslimati', statsRef.current.success],
      ['Toplam Geri Donen / Basarisiz Siparis', statsRef.current.failed],
      ['SLA Ilk Seferde Hizmet Basari (%)', `${slaSuccess.toFixed(2)}%`],
      ['Ortalama Musteri Teslim Suresi (dk)', `${avgDeliveryMin.toFixed(2)} dk`],
      ['Depo Kuyruk Darbogaz Orani (%)', `${bottleneckPercent.toFixed(2)}%`],
      ['Kat Edilen Toplam Mesafe (km)', `${statsRef.current.totalDistance.toFixed(2)} km`],
      ['Olu Kilometre Orani (%)', `${deadMileagePct.toFixed(2)}%`],
      ['Net CO2 Karbon Salinimi (kg)', `${statsRef.current.co2.toFixed(4)} kg`],
      ['Saha Calisan Kurye Sayisi', params.courierCount],
      ['Hava Durumu Kosulu', params.weather]
    ];

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.map(row => row.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dijital_ikiz_loji_raporu_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addLog("Lojistik metrik veri akış tablosu başarıyla CSV olarak indirildi.", "success");
  };

  const isSLAAtRisk = activeView === 'micro' && syncedStats.success > 10 && (syncedStats.success / (syncedStats.success + syncedStats.failed)) < 0.85;

  return (
    <div className="flex bg-[#05070f] text-slate-100 font-sans w-screen h-screen overflow-hidden">
      {/* SIDEBAR PARAMETERS */}
      <SidebarControls
        activeView={activeView}
        setActiveView={setActiveView}
        selectedHub={selectedHub}
        setSelectedHub={setSelectedHub}
        activePolicy={activePolicy}
        setActivePolicy={setActivePolicy}
        params={params}
        setParams={setParams}
        isRunning={isRunning}
        onStart={() => {
          setIsRunning(true);
          addLog("Simülasyon canlı operasyon moduna alındı.", "info");
        }}
        onPause={() => {
          setIsRunning(false);
          addLog("Simülasyon geçici olarak duraklatıldı.", "info");
        }}
        onReset={handleReset}
        onExportCSV={onExportCSV}
      />

      {/* DETAILED CONTENT AREA */}
      <main className="flex-1 flex flex-col p-6 overflow-y-auto h-full pb-12 space-y-4">
        {/* METRICS ROW */}
        <MetricsHeader
          activeView={activeView}
          stats={syncedStats}
          courierCount={couriersRef.current.length}
          activePolicy={activePolicy}
          vehicleType={params.vehicleType}
          selectedHub={selectedHub}
          fleetComposition={params.fleetComposition}
        />

        {/* INTERACTIVE GRAPH CANVAS */}
        <SimulationCanvas
          activeView={activeView}
          selectedHub={selectedHub}
          setSelectedHub={setSelectedHub}
          params={params}
          customers={customersRef.current}
          couriers={couriersRef.current}
          turkeyHubs={turkeyHubsRef.current}
          macroTrucks={macroTrucksRef.current}
          particles={particlesRef.current}
          depot={depotRef.current}
          loadingQueue={loadingQueueRef.current}
          loadingBays={loadingBaysRef.current}
          isSLAAtRisk={isSLAAtRisk}
          stats={syncedStats}
        />

        {/* ECO CARBON ANALYTICS FOOTPRINT ROADMAP OVERLAY */}
        <CarbonFootprintWidget 
          stats={syncedStats} 
          params={params} 
          courierCount={couriersRef.current.length}
        />

        {/* TELEMETRY LOGGER PANEL */}
        <TelemetryLogs logs={logs} />
      </main>
    </div>
  );
}
