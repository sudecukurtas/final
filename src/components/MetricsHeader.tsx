/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  TrendingUp, 
  HelpCircle, 
  DollarSign, 
  User, 
  Box, 
  Clock, 
  FileText, 
  AlertOctagon, 
  Cpu,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Globe,
  Zap,
  Award,
  Leaf
} from 'lucide-react';
import { SimulationStats } from '../types';

interface MetricsHeaderProps {
  activeView: 'macro' | 'micro';
  stats: SimulationStats;
  courierCount: number;
  activePolicy: 'dynamic' | 'sla' | 'eco' | 'safety';
  vehicleType: string;
  selectedHub?: string;
  fleetComposition?: {
    motorcycle: number;
    van: number;
    ev: number;
  };
}

export const MetricsHeader: React.FC<MetricsHeaderProps> = ({
  activeView,
  stats,
  courierCount,
  activePolicy,
  vehicleType,
  selectedHub = 'İstanbul',
  fleetComposition,
}) => {
  // 1. SLA dynamic calculation
  const totalProcessed = stats.success + stats.failed;
  const currentSLA = totalProcessed > 0 ? (stats.success / totalProcessed) * 100 : 96.4;

  // Compute standard deviation dynamically from window
  const computeConfidenceStd = () => {
    if (stats.slaWindow.length === 0) return 1.2;
    const mean = stats.slaWindow.reduce((a, b) => a + b, 0) / stats.slaWindow.length;
    const variance = stats.slaWindow.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / stats.slaWindow.length;
    return Math.sqrt(variance) + 0.2;
  };

  const stdDevVal = computeConfidenceStd();

  // 2. Average delivery time
  const avgTimeSec = stats.success > 0 ? stats.totalDeliveryTime / stats.success : 0;
  const avgTimeMin = avgTimeSec / 60;

  // 3. Queue bottleneck ratio
  const queueRatio = stats.totalSimTicks > 0 ? (stats.queueBottleneckTicks / stats.totalSimTicks) * 100 : 0;
  const avgQueueWaitSec = stats.queueEnteredCount > 0 ? (stats.queueTotalWaitTime / stats.queueEnteredCount) : 0;

  // 4. Financial Calculations
  const grossIncomes = stats.revenue;
  const totalCosts = stats.spendingWages + stats.spendingBays + stats.spendingFuel + stats.spendingPenalties;
  const netProfit = grossIncomes - totalCosts;

  return (
    <div className="space-y-4 mb-5 shrink-0 select-none" id="logistics-metrics-center">
      
      {/* SECTION 1: FINANCIAL ROI SCREEN FOR AUTHORITY LOGISTICS DIRECTOR */}
      <div className="bg-[#0c1024]/80 border border-blue-500/20 rounded-2xl p-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <DollarSign className="w-24 h-24 text-emerald-400" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-3 mb-4">
          <div>
            <h2 className="text-xs font-black tracking-widest text-emerald-400 uppercase flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              Finansal Kar-Zarar ve Yatırım ROI Takip Paneli
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
              Yatırım yaptığınız kaynakların (rampa, kurye) getirdiği kârı ve gecikme cezalarından sağladığı net faydayı canlandırır.
            </p>
          </div>
          <div className="mt-2 md:mt-0 flex gap-2">
            <span className="text-[9.5px] bg-emerald-500/10 text-emerald-400 font-extrabold px-2.5 py-1 rounded border border-emerald-500/20">
              💵 Başarılı Teslim Payout: +$15 | Express: +$25
            </span>
            <span className="text-[9.5px] bg-rose-500/10 text-rose-400 font-extrabold px-2.5 py-1 rounded border border-rose-500/20">
              🚨 Gecikme / İade SLA Cezası: -$30
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* NET profit/benefit */}
          <div className={`col-span-2 rounded-xl p-3.5 border flex flex-col justify-between ${
            netProfit >= 0 
              ? 'bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-slate-900 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
              : 'bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-slate-900 border-rose-500/30'
          }`}>
            <div>
              <span className="text-[9.5px] uppercase font-bold tracking-wider text-slate-300 block">
                Net Operasyon Kârı / Kararlılık ROI
              </span>
              <span className="text-xs text-slate-400 mt-0.5 block leading-tight">
                Net kazanç durumu. Rampa/Kurye yatırımıyla kârı artırın.
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className={`text-2xl font-black font-mono tracking-tight ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(1)}
              </span>
              <span className="text-slate-400 text-[10px] font-bold">USD</span>
            </div>
          </div>

          {/* Gross Revenues */}
          <div className="bg-[#0d1327]/40 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">
                Brüt Teslimat Geliri
              </span>
              <span className="text-[8.5px] text-slate-500 mt-0.5 block leading-none">
                Tamamlanan sipariş kazancı
              </span>
            </div>
            <div className="mt-2 text-lg font-black font-mono text-emerald-400">
              +${grossIncomes.toFixed(0)}
            </div>
          </div>

          {/* Wages cost */}
          <div className="bg-[#0d1327]/40 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">
                Kurye Personel Giderleri
              </span>
              <span className="text-[8.5px] text-slate-500 mt-0.5 block leading-none">
                Aktif personel saatlik $25
              </span>
            </div>
            <div className="mt-2 text-lg font-black font-mono text-slate-200">
              -${stats.spendingWages.toFixed(0)}
            </div>
          </div>

          {/* Depot Bays upkeep */}
          <div className="bg-[#0d1327]/40 border border-white/5 rounded-xl p-3 flex flex-col justify-between relative group">
            <div>
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">
                Altyapı Bay İşletim Costu
              </span>
              <span className="text-[8.5px] text-slate-500 mt-0.5 block leading-none">
                Rampa amortisman gideri
              </span>
            </div>
            <div className="mt-2 text-lg font-black font-mono text-slate-200">
              -${stats.spendingBays.toFixed(0)}
            </div>
          </div>

          {/* Late penalties / SLA Failure cost */}
          <div className="bg-gradient-to-br from-rose-500/10 to-slate-900 border border-rose-500/10 rounded-xl p-3 flex flex-col justify-between relative group">
            <div>
              <span className="text-[9px] uppercase font-bold tracking-wider text-rose-300 block">
                Gecikme &amp; İade Cezaları
              </span>
              <span className="text-[8.5px] text-rose-400/60 mt-0.5 block leading-tight">
                Zaman sınırını aşan cezalar!
              </span>
            </div>
            <div className="mt-2 text-lg font-black font-mono text-rose-400">
              -${stats.spendingPenalties.toFixed(1)}
            </div>
          </div>

        </div>
      </div>

      {/* COMPOSITE LOGISTICS PERFORMANCE INDEX (LPI) SCORECARD */}
      {(() => {
        const evPct = fleetComposition ? fleetComposition.ev : 25;
        const motoPct = fleetComposition ? fleetComposition.motorcycle : 50;
        const ecoScore = Math.min(100, Math.max(10, evPct + (motoPct * 0.6) + ((100 - evPct - motoPct) * 0.1)));
        const warehouseScore = Math.max(10, Math.min(100, 100 - (queueRatio * 3.5)));
        const profitMargin = grossIncomes > 0 ? (netProfit / grossIncomes) : 0.45;
        const financialScore = Math.max(15, Math.min(100, 30 + (profitMargin * 120)));
        const compositeLPI = (currentSLA * 0.35) + (ecoScore * 0.25) + (warehouseScore * 0.20) + (financialScore * 0.20);
        const worldBankLPI = 1.0 + (compositeLPI / 100) * 4.0;

        let levelLabel = "Orta Seviye - Gelişime Açık";
        let levelColor = "text-amber-400";
        let levelBg = "bg-amber-500/10 border-amber-500/20";
        let levelGlow = "shadow-[0_0_15px_rgba(245,158,11,0.15)]";

        if (worldBankLPI >= 4.2) {
          levelLabel = "Mükemmel Lojistik Altyapı - Sürdürülebilir Lider Sınıf";
          levelColor = "text-emerald-400";
          levelBg = "bg-emerald-500/10 border-emerald-500/30";
          levelGlow = "shadow-[0_0_20px_rgba(16,185,129,0.25)]";
        } else if (worldBankLPI >= 3.5) {
          levelLabel = "İyi Gelişmiş - Güçlü Operasyonel Kararlılık";
          levelColor = "text-teal-400";
          levelBg = "bg-teal-500/10 border-teal-500/20";
          levelGlow = "shadow-[0_0_15px_rgba(20,184,166,0.15)]";
        } else if (worldBankLPI < 2.5) {
          levelLabel = "Kritik Seviye - Sürdürülebilir Reform Gerekli!";
          levelColor = "text-rose-400";
          levelBg = "bg-rose-500/10 border-rose-500/30";
          levelGlow = "shadow-[0_0_15px_rgba(239,68,68,0.2)]";
        }

        return (
          <div className="bg-[#0c1024]/80 border border-indigo-500/20 rounded-2xl p-4 shadow-xl relative overflow-hidden" id="composite-lpi-scorecard">
            <div className="absolute top-0 right-0 p-3 opacity-[0.03] pointer-events-none">
              <Award className="w-24 h-24 text-indigo-400" />
            </div>

            <div className="flex flex-col lg:flex-row gap-5 items-stretch">
              
              {/* Central Index Circle Gauge */}
              <div className={`lg:w-1/4 rounded-xl p-4 flex flex-col justify-between items-center text-center border bg-gradient-to-br from-indigo-950/20 via-slate-900/40 to-slate-950/80 border-indigo-500/25 ${levelGlow}`}>
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#818cf8] flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Lojistik Performans Endeksi (LPI)
                  </span>
                  <p className="text-[7.5px] text-slate-400 font-mono mt-0.5 uppercase leading-tight">
                    Dünya Bankası Sürdürülebilirlik Standartlarında Canlı Ölçüm
                  </p>
                </div>

                <div className="my-3 relative flex items-center justify-center">
                  {/* Digital Index Gauge Rating Display */}
                  <div className="text-4xl font-extrabold font-mono tracking-tighter text-slate-100 flex items-baseline">
                    <span>{worldBankLPI.toFixed(2)}</span>
                    <span className="text-slate-500 text-lg ml-0.5">/5.0</span>
                  </div>
                </div>

                <div className={`w-full py-1.5 px-3 rounded-lg border text-center text-[9px] font-bold ${levelColor} ${levelBg}`}>
                  {levelLabel}
                </div>
              </div>

              {/* Sub-Indices Detail Grid */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                
                {/* Score 1: SLA */}
                <div className="bg-[#0d1327]/40 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9.5px] uppercase font-bold tracking-wider text-slate-350 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        Zamanında Teslim &amp; Hizmet Kalitesi Endeksi
                      </span>
                      <p className="text-[8px] text-slate-500 leading-tight block mt-0.5">
                        Zaman pencerelerine uygun başarılı kurye seyahat oranı.
                      </p>
                    </div>
                    <span className="text-xs font-black font-mono text-indigo-400">%{currentSLA.toFixed(1)}</span>
                  </div>
                  <div className="mt-3.5">
                    <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                      <div style={{ width: `${currentSLA}%` }} className="bg-indigo-500 h-full rounded-full transition-all duration-300" />
                    </div>
                    <div className="flex justify-between text-[7px] font-mono text-slate-550 mt-1">
                      <span>VERİMSİZ (&lt;%80)</span>
                      <span>UYGUN (%95+)</span>
                      <span>MÜKEMMEL (%100)</span>
                    </div>
                  </div>
                </div>

                {/* Score 2: Eco Footprint */}
                <div className="bg-[#0d1327]/40 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9.5px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
                        <Leaf className="w-3.5 h-3.5" />
                        Ekolojik Sürdürülebilirlik &amp; Karbon Endeksi
                      </span>
                      <p className="text-[8px] text-slate-500 leading-tight block mt-0.5">
                        Aktif filonun elektrikli otonom kurye ve yakıt emisyon oranı.
                      </p>
                    </div>
                    <span className="text-xs font-black font-mono text-emerald-400">%{ecoScore.toFixed(0)}</span>
                  </div>
                  <div className="mt-3.5">
                    <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                      <div style={{ width: `${ecoScore}%` }} className="bg-emerald-500 h-full rounded-full transition-all duration-300" />
                    </div>
                    <div className="flex justify-between text-[7px] font-mono text-slate-550 mt-1">
                      <span>FOSİL PANELVAN / YÜKSEK CO₂</span>
                      <span>HİBRİT (%50)</span>
                      <span>SIFIR EMİSYON (%100 EV)</span>
                    </div>
                  </div>
                </div>

                {/* Score 3: Warehouse & Bays Queue */}
                <div className="bg-[#0d1327]/40 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9.5px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1">
                        <Box className="w-3.5 h-3.5" />
                        Altyapı Depolama Rampa Verimlilik Endeksi
                      </span>
                      <p className="text-[8px] text-slate-500 leading-tight block mt-0.5">
                        Yükleme rampalarında darbe-boğaz bekleme ve servis hızı.
                      </p>
                    </div>
                    <span className="text-xs font-black font-mono text-amber-400">%{warehouseScore.toFixed(1)}</span>
                  </div>
                  <div className="mt-3.5">
                    <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                      <div style={{ width: `${warehouseScore}%` }} className="bg-amber-500 h-full rounded-full transition-all duration-300" />
                    </div>
                    <div className="flex justify-between text-[7px] font-mono text-slate-550 mt-1">
                      <span>RAMPA SIKIŞIKLIĞI</span>
                      <span>ORTALAMA (%70)</span>
                      <span>STABİL SEVK (%100)</span>
                    </div>
                  </div>
                </div>

                {/* Score 4: Financial ROI net benefits */}
                <div className="bg-[#0d1327]/40 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9.5px] uppercase font-bold tracking-wider text-[#e879f9] flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-[#e879f9]" />
                        Mali Sürdürülebilirlik &amp; ROI Verim Endeksi
                      </span>
                      <p className="text-[8px] text-slate-500 leading-tight block mt-0.5">
                        Lojistik harcamaların (ücret, yakıt, rampa) gelirlere karşı oranı.
                      </p>
                    </div>
                    <span className="text-xs font-black font-mono text-[#e879f9]">%{financialScore.toFixed(1)}</span>
                  </div>
                  <div className="mt-3.5">
                    <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                      <div style={{ width: `${financialScore}%` }} className="bg-[#d946ef] h-full rounded-full transition-all duration-300" />
                    </div>
                    <div className="flex justify-between text-[7px] font-mono text-slate-550 mt-1">
                      <span>YÜKSEK ZARAR / ATIL KAYNAK</span>
                      <span>BAŞABAŞ NOKTASI (%50)</span>
                      <span>YÜKSEK AMORTİSMAN (%100)</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        );
      })()}

      {/* SECTION 2: OPERATIONAL METRICS HEADER */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. SECURED COURIERS */}
        <div className="bg-[#0d1327]/35 border border-[#1e293b]/50 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all duration-200">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
            Saha Filosu
          </span>
          <div className="mt-1 text-lg font-black font-mono text-blue-400 leading-snug">
            {activeView === 'macro' ? '12.380 Kurye' : `${courierCount} Kurye`}
          </div>
          {activeView === 'micro' && fleetComposition ? (
            <div className="space-y-1.5 mt-1">
              <div className="h-1.5 w-full rounded-full bg-slate-800 flex overflow-hidden">
                <div 
                  style={{ width: `${fleetComposition.motorcycle}%` }} 
                  className="bg-amber-500" 
                  title={`Motosiklet: %${fleetComposition.motorcycle}`}
                />
                <div 
                  style={{ width: `${fleetComposition.van}%` }} 
                  className="bg-purple-500" 
                  title={`Panelvan: %${fleetComposition.van}`}
                />
                <div 
                  style={{ width: `${fleetComposition.ev}%` }} 
                  className="bg-teal-500" 
                  title={`Elektrikli: %${fleetComposition.ev}`}
                />
              </div>
              <div className="flex justify-between text-[7px] font-mono text-slate-400 leading-none">
                <span className="text-amber-500">M:%{fleetComposition.motorcycle}</span>
                <span className="text-purple-400">P:%{fleetComposition.van}</span>
                <span className="text-teal-400">E:%{fleetComposition.ev}</span>
              </div>
            </div>
          ) : (
            <span className="text-[9px] text-[#475569] mt-1 font-bold truncate block">
              81 İl Ulusal Sistem Filosu
            </span>
          )}
        </div>

        {/* 2. PROCESSED ORDERS */}
        <div className="bg-[#0d1327]/35 border border-[#1e293b]/50 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all duration-200">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
            Toplam Sipariş
          </span>
          <div className="mt-2 text-xl font-black font-mono text-slate-200">
            {activeView === 'macro' 
              ? (stats.totalOrdersGenerated * 280).toLocaleString('tr-TR') 
              : stats.totalOrdersGenerated}
          </div>
          <span className="text-[9px] text-[#475569] mt-1 font-bold truncate">
            {activeView === 'macro' ? 'Ulusal Ağda Toplam Sipariş' : 'Alınan Toplam Paket'}
          </span>
        </div>

        {/* 3. SLA COMPLIANCE SERVICE */}
        <div className="bg-[#0d1327]/35 border border-[#1e293b]/50 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all duration-200">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
            SLA zamanlama kalitesi
          </span>
          <div className="mt-2 text-xl font-black font-mono text-emerald-400">
            {currentSLA.toFixed(1)}%
          </div>
          <span className="text-[9px] text-slate-500 mt-1 font-bold truncate">
            Hedef Standart: &gt;95.0%
          </span>
        </div>

        {/* 4. AVERAGE ROUTE TRANSIT */}
        <div className="bg-[#0d1327]/35 border border-[#1e293b]/50 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all duration-200">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
            Ortalama Durak Süresi
          </span>
          <div className="mt-2 text-xl font-black font-mono text-amber-400">
            {avgTimeMin.toFixed(1)} dk
          </div>
          <span className="text-[9px] text-slate-500 mt-1 font-bold truncate">
            Zaman aşımı &amp; gecikmeler dahil
          </span>
        </div>

        {/* 5. HOURLY LOADING BAY WAIT TIME */}
        <div className="bg-[#0d1327]/35 border border-[#1e293b]/50 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all duration-200">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
            Depo Rampa Darboğazı
          </span>
          <div className="mt-2 text-xl font-black font-mono text-rose-400">
            {activeView === 'macro' ? '0.0%' : `${queueRatio.toFixed(1)}%`}
          </div>
          <span className="text-[9px] text-slate-500 mt-1 font-bold truncate">
            {activeView === 'macro' ? 'Ağ Yükleri Stabil' : `Gecikme Beklemesi: ${avgQueueWaitSec.toFixed(0)}sn`}
          </span>
        </div>

        {/* 6. FUEL COST AND NET DEED ENVIRONMENT */}
        <div className="bg-[#0d1327]/35 border border-[#1e293b]/50 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all duration-200">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
            Ulaşım Enerji Gideri
          </span>
          <div className="mt-2 text-xl font-black font-mono text-purple-400">
            ${stats.spendingFuel.toFixed(1)}
          </div>
          <span className="text-[9px] text-slate-500 mt-1 font-bold truncate">
            {stats.co2.toFixed(1)} kg Net CO₂ Isı Atığı
          </span>
        </div>

      </div>

    </div>
  );
};
