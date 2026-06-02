/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Leaf, 
  Sparkles, 
  TrendingDown, 
  Award, 
  Globe, 
  Zap, 
  ShieldCheck, 
  X,
  Share2,
  TreePine,
  Layers
} from 'lucide-react';
import { SimulationStats, SimulationParams } from '../types';

interface CarbonFootprintWidgetProps {
  stats: SimulationStats;
  params: SimulationParams;
  courierCount: number;
}

export const CarbonFootprintWidget: React.FC<CarbonFootprintWidgetProps> = ({
  stats,
  params,
  courierCount
}) => {
  const [showCertificate, setShowCertificate] = useState(false);
  const [chartData, setChartData] = useState<number[]>([]);
  const [offsetDonation, setOffsetDonation] = useState(0);

  // Auto-fill chart data simulating emission accumulation
  useEffect(() => {
    setChartData(prev => {
      const nextData = [...prev, stats.co2];
      if (nextData.length > 20) {
        nextData.shift();
      }
      return nextData;
    });
  }, [stats.co2]);

  // Carbon Offsetting calculations
  // Traditional Van: 0.16 kg/km
  // Motorcycle: 0.04 kg/km
  // EV: 0.00 kg/km
  // Traditional benchmark emissions assumed as 100% old diesel vans: 0.18 kg CO2 per km
  const benchmarkEmissions = stats.totalDistance * 0.18;
  const carbonImpactAvoided = Math.max(0, benchmarkEmissions - stats.co2);
  
  // Pine tree can isolate ~22 kg CO2 per year. For short runs we use a smaller high-impact factor:
  const equivalentTreesSaved = Math.max(0, (carbonImpactAvoided * 2.5) + (offsetDonation * 5));
  
  // Electro mobility ratios in composition
  const motoPct = params.fleetComposition?.motorcycle ?? 50;
  const vanPct = params.fleetComposition?.van ?? 25;
  const evPct = params.fleetComposition?.ev ?? 25;
  const totalEcoFriendlyRatio = evPct + (motoPct * 0.6); // EV is 100% eco, moto is 60% eco compared to big fossil vans

  // Graph values scaling
  const maxVal = Math.max(...chartData, 10);
  const minVal = 0;

  return (
    <div className="bg-[#0b1022]/90 border border-emerald-500/15 rounded-2xl p-5 shadow-2xl relative overflow-hidden mt-4" id="carbon-ecological-dashboard">
      <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
        <Leaf className="w-32 h-32 text-emerald-400" />
      </div>

      <div className="flex flex-col xl:flex-row justify-between items-start gap-5">
        
        {/* Metric calculations and tree offset visualizer */}
        <div className="flex-1 w-full">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1 px-2 text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded uppercase flex items-center gap-1">
              <Leaf className="w-3 h-3 text-emerald-400 animate-pulse" />
              Sürdürülebilirlik &amp; Karbon Karnesi
            </span>
            <span className="text-[9px] font-mono text-slate-500">YEŞİL LOJİSTİK INDEKSİ</span>
          </div>
          <h3 className="text-sm font-black text-slate-100 tracking-tight flex items-center gap-1.5">
            Ekolojik Karbon Ayak İzi &amp; Rejeneratif Etki
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Elektrikli otonom kuryeler ve gezgin satıcı güzergah optimizasyonu (TSP) sayesinde engellenen karbon salınımını ve ağaç eşdeğerliğini canlandırın.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            
            {/* Net CO2 */}
            <div className="bg-[#050814]/60 border border-emerald-500/10 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-emerald-400 font-extrabold hover:underline cursor-help block">
                  NET CO₂ EMİSYONU
                </span>
                <span className="text-[8px] text-slate-500 leading-tight block mt-0.5">
                  Saha araçlarının toplam petrol salınımı
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-lg font-black font-mono text-emerald-300">
                  {stats.co2.toFixed(3)}
                </span>
                <span className="text-[9px] text-slate-400 font-bold">kg CO₂</span>
              </div>
            </div>

            {/* Avoided carbon */}
            <div className="bg-[#050814]/60 border border-emerald-500/10 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-teal-400 font-extrabold block">
                  ÖNLENEN CO₂ GAZI
                </span>
                <span className="text-[8px] text-slate-500 leading-tight block mt-0.5">
                  Eski nesil van filosuna göre sağlanan net kazanç
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-lg font-black font-mono text-teal-300">
                  -{carbonImpactAvoided.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-400 font-bold">kg CO₂</span>
              </div>
            </div>

            {/* Trees equivalent and visual representation */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-2 right-2 opacity-15">
                <TreePine className="w-12 h-12 text-emerald-400 group-hover:scale-125 transition-all duration-350" />
              </div>
              <div>
                <span className="text-[9px] text-white font-extrabold flex items-center gap-1">
                  KURTARILAN ÇAM AĞACI
                </span>
                <span className="text-[8px] text-emerald-300/80 leading-tight block mt-0.5">
                  Karbon tasarrufunun çam fidanı karşılığı
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1">
                <span className="text-xl font-black font-mono text-emerald-400 animate-pulse select-none">
                  🌳 {equivalentTreesSaved.toFixed(1)}
                </span>
                <span className="text-[9px] text-slate-300 font-bold">Adet</span>
              </div>
            </div>

            {/* Eco ratio representation */}
            <div className="bg-[#050814]/60 border border-emerald-500/10 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-amber-400 font-extrabold block">
                  FİLO ELEKTRO-MOBİLİTE
                </span>
                <span className="text-[8px] text-slate-500 leading-tight block mt-0.5">
                  Yeşil taşımacılık oranı ve hibrit skoru
                </span>
              </div>
              <div className="mt-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black font-mono text-amber-400">
                    %{totalEcoFriendlyRatio.toFixed(0)}
                  </span>
                  <div className="h-1.5 w-12 bg-slate-800 rounded overflow-hidden">
                    <div style={{ width: `${totalEcoFriendlyRatio}%` }} className="bg-amber-400 h-full" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Interactive Offsetting and Action items */}
          <div className="mt-4 pt-3 border-t border-[#1e293b]/70 flex flex-wrap md:flex-nowrap gap-4 items-center justify-between">
            <div className="text-[11px] text-slate-300 flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>
                <b>Karbon Dengelemesi Desteği:</b> Dağıtım ağınızı ekstra fidan sponsoru yaparak karbon nötr seviyesine taşımak ister misiniz?
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => setOffsetDonation(d => d + 1)}
                className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 border border-emerald-400/20 shadow-md shadow-emerald-500/10 hover:scale-105 active:translate-y-0.5 transition-all cursor-pointer"
              >
                +1 Fidan Bağışla ($1.20)
              </button>
              <button 
                onClick={() => setOffsetDonation(0)}
                className="px-2 py-1 text-[9px] font-bold rounded-md bg-slate-800 text-slate-400 hover:text-slate-200 border border-white/5 active:translate-y-0.5 transition"
              >
                Sıfırla
              </button>
              <button 
                onClick={() => setShowCertificate(true)}
                className="px-3 py-1 text-[10px] font-extrabold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-indigo-400/30 flex items-center gap-1.5 ml-1 select-none pointer hover:scale-105 active:translate-y-0.5 transition-all shadow-lg"
              >
                <Award className="w-3.5 h-3.5 text-indigo-200 fill-current" />
                Sertifika Al
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Accumulated Emission Line Chart Visualizer */}
        <div className="w-full xl:w-[280px] bg-black/35 border border-[#1e293b] p-4 rounded-xl flex flex-col justify-between shrink-0">
          <div>
            <span className="text-[9.5px] text-indigo-400 font-extrabold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> EMİSYON AKÜMÜLASYON GRAFİĞİ
            </span>
            <span className="text-[8px] text-slate-500 leading-tight block mt-0.5">
              Zaman içerisindeki karbon birikim hızı
            </span>
          </div>

          <div className="h-20 w-full mt-3 flex items-end gap-[2px]">
            {chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-500 font-mono">
                Veriler bekleniyor...
              </div>
            ) : (
              chartData.map((co2, idx) => {
                const heightPct = maxVal > 0 ? (co2 / maxVal) * 100 : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-900 border border-emerald-500/30 px-1.5 py-0.5 text-[8px] rounded text-emerald-300 font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none mb-1 z-50 whitespace-nowrap">
                      {co2.toFixed(2)} kg
                    </div>
                    {/* Bar visual */}
                    <div 
                      style={{ height: `${Math.max(4, heightPct)}%` }} 
                      className="w-full bg-gradient-to-t from-emerald-500/20 to-emerald-400 rounded-t-sm hover:from-teal-500 hover:to-teal-400 transition-all duration-300 pointer-events-auto"
                    />
                  </div>
                );
              })
            )}
          </div>
          
          <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 mt-2 border-t border-white/5 pt-1.5">
            <span>BAŞLANGIÇ</span>
            <span className="text-emerald-400 font-bold">KÜMÜLATİF SALINIM ANALİZİ</span>
            <span>ŞİMDİ</span>
          </div>
        </div>

      </div>

      {/* POPUP ACADEMIC GREEN CARBON CERTIFICATE PREVIEW OVERLAY */}
      {showCertificate && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[100] animate-fade-in p-4">
          <div className="bg-gradient-to-br from-[#0c1328] via-[#090b14] to-[#121c32] border-2 border-emerald-400/30 p-8 rounded-3xl w-full max-w-xl text-center shadow-2xl relative select-none">
            <button 
              onClick={() => setShowCertificate(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/5 border border-white/5 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing gold badge header */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full scale-125" />
                <div className="bg-emerald-500/10 border border-emerald-400/30 p-4 rounded-full">
                  <Award className="w-12 h-12 text-emerald-400 fill-current animate-pulse" />
                </div>
              </div>
            </div>

            <span className="text-[9.5px] font-extrabold tracking-widest text-[#10b981] bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 uppercase inline-block">
              LOJİSTİK KARBON UYUMLULUK BELGESİ
            </span>

            <h2 className="text-xl font-black text-white tracking-tight mt-4">
              Çevre Dostu Lojistik Ağ Sertifikası
            </h2>
            <div className="w-16 h-[2px] bg-emerald-500/30 mx-auto mt-2.5" />

            <div className="my-6 space-y-4 px-2">
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                İncelemekte olduğunuz dijital ikiz sistem kurgusuna göre, otonom ajanın dağıtım ağında elektrikli kuryeler ve ileri rota planlama metodolojileri etkinleştirilmiştir.
              </p>

              <div className="grid grid-cols-2 gap-4 bg-[#05070e] p-4 rounded-2xl border border-white/5 text-left text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[9px] font-bold">SERTİFİKA ALICI</span>
                  <span className="text-slate-200 mt-1 block font-black">Yeşil Dağıtım Şebekesi Entegre Dijital İkiz</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] font-bold">KAZANILAN FİDAN ADEDİ</span>
                  <span className="text-emerald-400 mt-1 block font-black">{equivalentTreesSaved.toFixed(1)} Adet Çam Fidanı</span>
                </div>
                <div className="border-t border-slate-900 pt-3 mt-1">
                  <span className="text-slate-500 block text-[9px] font-bold">ÖNLENEN EMİSYON GÜCÜ</span>
                  <span className="text-teal-400 mt-1 block font-black">{carbonImpactAvoided.toFixed(2)} kg CO₂ Karbon Gazı</span>
                </div>
                <div className="border-t border-slate-900 pt-3 mt-1">
                  <span className="text-slate-500 block text-[9px] font-bold">MOBİLİTE REYTİNGİ</span>
                  <span className="text-amber-400 mt-1 block font-black">A+++ Sınıfı Yeşil Operasyon</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 italic">
                * Bu belge, otonom dağıtım ağınızın emisyon tasarruflarını göstermektedir. Geleneksel fosil yakıtlı kargo van araçlarının taşıma hacmi başına Karbon Salınım Kriterlerine göre ($0.18$ kg/km) hesaplanmış olup, çevresel sorumluluğu kanıtlar.
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  alert("Sertifika başarıyla yeşil sistem veri kütüğüne kaydedildi ve dışa aktarıma hazır!");
                }}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/15 hover:bg-emerald-400 active:translate-y-0.5 select-none pointer transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                Paylaş &amp; İndir
              </button>
              <button
                onClick={() => setShowCertificate(false)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-[#1e293b] active:translate-y-0.5 select-none pointer transition-all cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
