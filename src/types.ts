/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Customer {
  id: number;
  x: number;
  y: number;
  createdAt: number;
  priority: 'Hızlı Teslimat' | 'Aynı Gün' | 'Standart';
  pulseTime: number;
}

export type VehicleType = 'motorcycle' | 'van' | 'ev';

export interface Courier {
  id: number;
  x: number;
  y: number;
  state: 'idle' | 'entering_queue' | 'loading' | 'delivering' | 'returning' | 'delayed';
  targetCustomer: Customer | null;
  packageBundle: Customer[];
  currentStopIndex: number;
  packageCreatedAt: number;
  trail: { x: number; y: number }[];
  delayTicks: number;
  delayReason: string;
  vehicleType: VehicleType;
}

export interface SimulationParams {
  traffic: number;
  weather: 'sunny' | 'rainy' | 'snowy';
  customerAbsence: number;
  orderRate: number;
  courierCount: number;
  simSpeed: number;
  vehicleType: VehicleType;
  fleetComposition: {
    motorcycle: number;
    van: number;
    ev: number;
  };
  bayCount: number; // 1 to 5 loading bays
  maxLoad: number; // Max packages loaded per courier per trip
  routingAlgorithm: 'tsp' | 'fifo' | 'sla-first'; // Decision routing strategies
}

export interface TurkeyHub {
  name: string;
  xPct: number;
  yPct: number;
  baseOrders: number;
  activeCouriers: number;
  currentOrders: number;
  pulse: number;
}

export interface MacroTruck {
  fromHub: TurkeyHub;
  toHub: TurkeyHub;
  progress: number;
  speed: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  decay: number;
  size: number;
}

export interface SimulationStats {
  success: number;
  failed: number;
  totalOrdersGenerated: number;
  totalDeliveryTime: number;
  totalDistance: number;
  deadDistance: number;
  co2: number;
  drivingTime: number;
  idleTime: number;
  telemetryCount: number;
  queueTotalWaitTime: number;
  queueEnteredCount: number;
  queueBottleneckTicks: number;
  totalSimTicks: number;
  slaWindow: number[];
  revenue: number;
  spendingWages: number;
  spendingFuel: number;
  spendingBays: number;
  spendingPenalties: number;
}

export interface TelemetryLog {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'normal';
}
