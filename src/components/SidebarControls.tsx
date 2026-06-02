/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  Leaf, 
  Layers,
  TrendingUp,
  AlertTriangle,
  Info,
  Truck,
  Sparkles,
  Award,
  Download
} from 'lucide-react';
import { SimulationParams } from '../types';

interface SidebarControlsProps {
  activeView: 'macro' | 'micro';
  setActiveView: (view: 'macro' | 'micro') => void;
  selectedHub: string;
  setSelectedHub: (hub: string) => void;
  activePolicy: 'dynamic' | 'sla' | 'eco' | 'safety';
  setActivePolicy: (policy: 'dynamic' | 'sla' | 'eco' | 'safety') => void;
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onExportCSV: () => void;
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  activeView,
  setActiveView,
  selectedHub,
  setSelectedHub,
  activePolicy,
  setActivePolicy,
  params,
  setParams,
  isRunning,
  onStart,
  onPause,
  onReset,
  onExportCSV,
}) => {
  const [showAcademicGuide, setShowAcademicGuide] = useState(true);

  const handleParamChange = (key: keyof SimulationParams, value: any) => {
    setParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Safe fleet composition normalizer to keep total allocation strictly at 100%
  const handleFleetCompositionChange = (type: 'motorcycle' | 'van' | 'ev', value: number) => {
    const minVal = 0;
    const maxVal = 100;
    let motoVal = params.fleetComposition?.motorcycle ?? 50;
    let vanVal = params.fleetComposition?.van ?? 25;
    let evVal = params.fleetComposition?.ev ?? 25;

    if (type === 'motorcycle') {
      motoVal = Math.min(Math.max(value, minVal), maxVal);
      const remaining = 100 - motoVal;
      const currentRemainingSum = (vanVal + evVal) || 1;
      vanVal = Math.round((vanVal / currentRemainingSum) * remaining);
      evVal = remaining - vanVal;
    } else if (type === 'van') {
      vanVal = Math.min(Math.max(value, minVal), maxVal);
      const remaining = 100 - vanVal;
      const currentRemainingSum = (motoVal + evVal) || 1;
      motoVal = Math.round((motoVal / currentRemainingSum) * remaining);
      evVal = remaining - motoVal;
    } else if (type === 'ev') {
      evVal = Math.min(Math.max(value, minVal), maxVal);
      const remaining = 100 - evVal;
      const currentRemainingSum = (motoVal + vanVal) || 1;
      motoVal = Math.round((motoVal / currentRemainingSum) * remaining);
      vanVal = remaining - motoVal;
    }

    setParams(prev => ({
      ...prev,
      fleetComposition: {
        motorcycle: motoVal,
        van: vanVal,
        ev: evVal
      }
    }));
  };

  return (
    <aside className="w-[410px] bg-[#090d1f] border-r border-[#1e293b]/70 flex flex-col p-6 overflow-y-auto z-10 shadow-2xl shrink-0 h-full select-none" id="logistics-decision-sidebar">
      
      {/* Sidebar Header */}
      <div className="mb-6 border-b border-[#1e293b] pb-5">
        <div className="flex items-center gap-2">
          <span className="p-1 px-2 text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded uppercase">OTORİTE KONTROL EKRENI</span>
          <span className="text-[9px] font-mono text-slate-500">DIGITAL TWIN V3.0</span>
        </div>
        <h1 className="text-lg font-black tracking-tight text-white mt-1.5 flex items-center gap-2">
          Lojistik Karar Destek Sistemi
        </h1>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-semibold">
          Yatırım bütçenizi yönetin; kaynak, rampa ve filo kombinasyonlarının finansal kâr/zarar (ROI) etkilerini anlık gözlemleyin.
        </p>
      </div>

      {/* CORE OPERATIONAL VIEW SELECTOR */}
      <div className="mb-5 bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl">
        <p className="text-[10px] text-blue-400 font-extrabold uppercase mb-2.5 tracking-wide">Ölçek &amp; İl Seçimi</p>
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setActiveView('micro')}
            className={`flex-1 py-1.5 px-1 text-[10.5px] font-bold rounded-lg transition-all duration-300 ${
              activeView === 'micro'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:text-slate-200 bg-transparent'
            }`}
          >
            📍 {selectedHub} (Mikro)
          </button>
          <button
            onClick={() => setActiveView('macro')}
            className={`flex-1 py-1.5 px-1 text-[10.5px] font-bold rounded-lg transition-all duration-300 ${
              activeView === 'macro'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:text-slate-200 bg-transparent'
            }`}
          >
            🗺️ 11 İl Ulusal (Makro)
          </button>
        </div>

        {/* Dynamic Province / Hub Select Dropdown */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-bold block">Aktif İnceleme İstasyonu (Hub):</label>
          <select
            value={selectedHub}
            onChange={(e) => {
              setSelectedHub(e.target.value);
            }}
            className="w-full bg-[#0a0d1a] border border-[#1e293b] text-slate-200 text-xs rounded-lg py-1.5 px-2.5 outline-none focus:border-blue-500 font-medium"
          >
            {['İstanbul', 'Bursa', 'İzmir', 'Antalya', 'Ankara', 'Samsun', 'Adana', 'Trabzon', 'Erzurum', 'Diyarbakır', 'Van'].map((city) => (
              <option key={city} value={city}>
                {city} ({city === 'İstanbul' ? 'Merkez Hub' : 'Bölge İstasyonu'})
              </option>
            ))}
          </select>
          <p className="text-[8.5px] text-slate-500 mt-1 leading-normal">
            * Türkiye haritası üzerindeki istasyonlara tıklayarak veya listeden seçerek o ilin mikro simülasyonunu anlık gözlemleyebilirsiniz.
          </p>
        </div>
      </div>

      {/* CORE CONTROL ACTIONS */}
      <div className="mb-6 bg-white/[0.02] border border-[#1e293b] p-4 rounded-xl space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onStart}
            disabled={isRunning}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
              isRunning 
                ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5' 
                : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-105 border border-blue-400/20 active:translate-y-0.5'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Başlat
          </button>
          <button
            onClick={onPause}
            disabled={!isRunning}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
              !isRunning 
                ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5' 
                : 'bg-white/5 text-slate-200 hover:bg-white/10 border border-white/10 active:translate-y-0.5'
            }`}
          >
            <Pause className="w-3.5 h-3.5" />
            Duraklat
          </button>
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg transition-all duration-200 border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 cursor-pointer active:translate-y-0.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Sıfırla
          </button>
        </div>
        <button
          onClick={onExportCSV}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all duration-250 bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-[1.01] border border-emerald-400/20 active:translate-y-0.5 cursor-pointer shadow-lg shadow-emerald-950/20"
        >
          <Download className="w-3.5 h-3.5 text-emerald-200 animate-bounce" />
          Operasyonel Raporu CSV İndir
        </button>
      </div>

      {/* LEVER 1: RAMPA KAPASİTESİ VE AKTİF FİLO BOYUTU */}
      <h2 className="text-[10px] font-black tracking-widest text-[#64748b] uppercase mb-3">
        1. DEPO Altyapı ve Kaynak Optimizasyonu
      </h2>

      <div className="space-y-4 mb-6">
        {/* Loading Bays Parameter */}
        <div className="bg-white/[0.02] border border-[#1e293b] p-4 rounded-xl relative hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-blue-500"></span>
                {activeView === 'micro' 
                  ? `${selectedHub} Rampa Sayısı (Yükleme Kapasitesi)` 
                  : 'Bölgesel Hub Altyapı Rampa Standardı'}
              </p>
              <span className="text-[9.5px] text-slate-400 block mt-0.5 leading-snug">
                {activeView === 'micro'
                  ? `${selectedHub} deposunda eş zamanlı yükleme yapabilecek maksimum kurye sayısı (rampa darboğaz oranı etkiler).`
                  : 'Türkiye genelindeki 11 ana hub deposunun standart yükleme rampa yatırım derinliği.'}
              </span>
            </div>
            <span className="text-[11px] font-mono bg-blue-500/15 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded font-extrabold shrink-0">
              {params.bayCount} Rampa
            </span>
          </div>

          <div className="mt-4">
            <input
              type="range"
              min="1"
              max="5"
              value={params.bayCount}
              onChange={(e) => handleParamChange('bayCount', parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 pt-3 border-t border-[#1e293b] text-[10px]">
            <div>
              <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> NET FAYDA:
              </span>
              <p className="text-slate-400 mt-0.5">Kuryelerin bekleme süresini azaltır, teslimatları hızlandırıp SLA cezalarını engeller.</p>
            </div>
            <div className="border-l border-slate-800 pl-3">
              <span className="text-rose-400 font-extrabold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> HİZMET BEDELI:
              </span>
              <p className="text-slate-400 mt-0.5">İşletme bütçesine rampa başına +$35/saat bakım ve operasyon maliyeti yansıtır.</p>
            </div>
          </div>
        </div>

        {/* Courier Count Parameter */}
        <div className="bg-white/[0.02] border border-[#1e293b] p-4 rounded-xl relative hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-amber-500"></span>
                {activeView === 'micro' 
                  ? `${selectedHub} Aktif Kurye Sayısı` 
                  : 'Bölgesel Hub Ortalama Dağıtım Filosu'}
              </p>
              <span className="text-[9.5px] text-slate-400 block mt-0.5 leading-snug">
                {activeView === 'micro'
                  ? `${selectedHub} şebekesinde paketleri adreslere dağıtan aktif kurye personeli sayısı.`
                  : '11 büyükşehir hub istasyonunun her birinde görevlendirilen otonom araç küme katsayısı.'}
              </span>
            </div>
            <span className="text-[11px] font-mono bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded font-extrabold shrink-0">
              {params.courierCount} Kurye
            </span>
          </div>

          <div className="mt-4">
            <input
              type="range"
              min="10"
              max="100"
              value={params.courierCount}
              onChange={(e) => handleParamChange('courierCount', parseInt(e.target.value))}
              disabled={activePolicy === 'dynamic'}
              className={`w-full h-1 bg-white/10 rounded-lg appearance-none accent-amber-500 ${
                activePolicy === 'dynamic' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
              }`}
            />
          </div>

          {activePolicy === 'dynamic' ? (
            <div className="mt-2 text-[10px] text-blue-400 bg-blue-500/5 border border-blue-500/10 p-2.5 rounded-lg flex items-center gap-2">
              <span className="text-xs">💡</span>
              <span>Filo büyüklüğü <b>Dinamik Ölçekli Otonom Ajan</b> politikası tarafınca sipariş yüküne göre otomatik optimize edilmektedir.</span>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3 pt-3 border-t border-[#1e293b] text-[10px]">
              <div>
                <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> NET FAYDA:
                </span>
                <p className="text-slate-400 mt-0.5">Saha kuyruklarını hızla eritir, kargo bekleme süresini minimize eder.</p>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-rose-400 font-extrabold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> MALİ GİDER:
                </span>
                <p className="text-slate-400 mt-0.5">Personel giderlerine saatlik kurye başı $25 ek ücret yansıtır.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LEVER 2: GRANULAR FLEET RATIO COMPOSITION PANEL */}
      <h2 className="text-[10px] font-black tracking-widest text-[#64748b] uppercase mb-3">
        2. Filo Kompozisyon Rasyosu (Çoklu Karışım)
      </h2>
      
      <div className="bg-gradient-to-br from-[#10142f] to-[#040612] border border-blue-500/20 p-5 rounded-2xl mb-6 hover:border-blue-400/30 transition-all">
        <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5 mb-1.5">
          <Truck className="w-4 h-4 text-blue-400 animate-pulse" />
          Müşterek Karma Filo Ayarı (Toplam %100)
        </p>
        <span className="text-[10px] text-slate-400 block mb-4 leading-normal">
          Her aracın hızı, yükleme hacmi, CO₂ salınımı ve yakıt/enerji aşınma katsayısı farklıdır. Dağılımı değiştirerek ideal maliyet politikasını belirleyin:
        </span>

        <div className="space-y-4">
          {/* Motorcycle Slider */}
          <div>
            <div className="flex justify-between items-center text-[10.5px] mb-1">
              <span className="text-amber-400 font-bold flex items-center gap-1">🛵 Motosiklet (Hızlı, Kıvrak)</span>
              <span className="text-slate-300 font-mono font-black">%{(params.fleetComposition?.motorcycle ?? 50)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={params.fleetComposition?.motorcycle ?? 50}
              onChange={(e) => handleFleetCompositionChange('motorcycle', parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded accent-amber-400 cursor-pointer"
            />
            <p className="text-[8.5px] text-slate-400 mt-0.5 leading-none">Hız: 45 km/s | Kapasite: 5 paket | Gider: $0.85/km | Yoğun trafikte en yüksek geçiş hızı.</p>
          </div>

          {/* Van Slider */}
          <div>
            <div className="flex justify-between items-center text-[10.5px] mb-1">
              <span className="text-purple-400 font-bold flex items-center gap-1">📦 Panelvan (Geniş Hacim)</span>
              <span className="text-slate-300 font-mono font-black">%{(params.fleetComposition?.van ?? 25)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={params.fleetComposition?.van ?? 25}
              onChange={(e) => handleFleetCompositionChange('van', parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded accent-purple-400 cursor-pointer"
            />
            <p className="text-[8.5px] text-slate-400 mt-0.5 leading-none">Hız: 30 km/s | Kapasite: 15 paket | Gider: $1.85/km | Yüksek kargo yüklerini tek turda taşır.</p>
          </div>

          {/* EV Slider */}
          <div>
            <div className="flex justify-between items-center text-[10.5px] mb-1">
              <span className="text-teal-400 font-bold flex items-center gap-1">⚡ Elektrikli (Çevreci, Dengeli)</span>
              <span className="text-slate-300 font-mono font-black">%{(params.fleetComposition?.ev ?? 25)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={params.fleetComposition?.ev ?? 25}
              onChange={(e) => handleFleetCompositionChange('ev', parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded accent-teal-400 cursor-pointer"
            />
            <p className="text-[8.5px] text-slate-400 mt-0.5 leading-none">Hız: 35 km/s | Kapasite: 10 paket | Gider: $0.35/km | SIFIR CO₂ salınımı, en düşük enerji sarfiyatı.</p>
          </div>
        </div>

        {/* Sum Indicator */}
        <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px]">
          <span className="text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-400" /> Atanan Araç Karışım Standardı:
          </span>
          <span className="text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            %100 TAM AKTİF
          </span>
        </div>
      </div>

      {/* LEVER 3: OPERASYON KURALLARI VE YÖNLENDİRME */}
      <h2 className="text-[10px] font-black tracking-widest text-[#64748b] uppercase mb-3">
        3. Dağıtım ve Nakliye Kanunları
      </h2>

      <div className="space-y-4 mb-6">
        {/* Max Capacity per route (Maks. Paket Taşıma Kapasitesi) */}
        <div className="bg-white/[0.02] border border-[#1e293b] p-4 rounded-xl relative hover:border-slate-700 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-emerald-500"></span>
                {activeView === 'micro' 
                  ? 'Araç Başı Paket Yükleme Kotası' 
                  : 'Hub Ring Araç Maks. Paket Limiti'}
              </p>
              <span className="text-[9.5px] text-slate-400 block mt-0.5 leading-snug">
                {activeView === 'micro'
                  ? 'Bir otonom kuryenin tek bir seferde depodan çıkarabileceği maksimum kargo paket barajı.'
                  : 'Bölgesel nakliyat tırlarının sefer başına taşımasına izin verilen tavan paket kotası.'}
              </span>
            </div>
            <span className="text-[11px] font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-extrabold shrink-0">
              {params.maxLoad} Adet
            </span>
          </div>

          <div className="mt-4">
            <input
              type="range"
              min="1"
              max="8"
              value={params.maxLoad}
              onChange={(e) => handleParamChange('maxLoad', parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 pt-3 border-t border-[#1e293b] text-[10px]">
            <div>
              <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> NET FAYDA:
              </span>
              <p className="text-slate-400 mt-0.5">Kuryelerin depoya gidiş-dönüş sıklığını ve dolayısıyla yakıt giderlerini azaltır.</p>
            </div>
            <div className="border-l border-slate-800 pl-3">
              <span className="text-rose-400 font-extrabold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> GÖTÜRÜSÜ:
              </span>
              <p className="text-slate-400 mt-0.5">Rotanın sonundaki müşteriler daha çok bekler; SLA ihlali olasılığı tırmanabilir.</p>
            </div>
          </div>
        </div>

        {/* Routing Algorithms Selection */}
        <div className="bg-white/[0.02] border border-[#1e293b] p-4 rounded-xl hover:border-slate-700 transition-all">
          <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2">
            <Layers className="w-4 h-4 text-purple-400" />
            Yönlendirme ve Optimizasyon Matematiği
          </p>
          <span className="text-[10px] text-slate-400 block mb-3 leading-snug">
            Matematiksel güzergah sıralama modeli. Dağıtım verimliliğini ve işletmenin kâr marjını doğrudan şekillendirir.
          </span>

          <div className="space-y-2">
            <button
              onClick={() => handleParamChange('routingAlgorithm', 'tsp')}
              className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex justify-between items-start ${
                params.routingAlgorithm === 'tsp'
                  ? 'bg-purple-500/10 border-purple-500 text-slate-200'
                  : 'bg-black/25 border-white/5 text-slate-400 hover:border-purple-500/20'
              }`}
            >
              <div>
                <span className="font-extrabold block">🧠 En Yakın Komşu Heuristic (TSP)</span>
                <span className="text-[9px] text-slate-400 mt-0.5 block">Öklid düzleminde her adımda en yakın adresi bularak yakıt ve ölü km kaybını %40 azaltır.</span>
              </div>
              <span className="text-[8px] bg-purple-500/20 text-purple-300 font-black px-1.5 py-0.5 rounded border border-purple-500/30 mt-1 uppercase shrink-0">Optimal</span>
            </button>

            <button
              onClick={() => handleParamChange('routingAlgorithm', 'sla-first')}
              className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex justify-between items-start ${
                params.routingAlgorithm === 'sla-first'
                  ? 'bg-purple-500/10 border-purple-500 text-slate-200'
                  : 'bg-black/25 border-white/5 text-slate-400 hover:border-purple-500/20'
              }`}
            >
              <div>
                <span className="font-extrabold block">🎯 SLA Zaman Öncelikli (Urgent First)</span>
                <span className="text-[9px] text-slate-400 mt-0.5 block">Zaman kısıtı daralan ekspres paketleri rotada ilk sıraya çeker.</span>
              </div>
              <span className="text-[8px] bg-emerald-500/20 text-emerald-300 font-black px-1.5 py-0.5 rounded border border-emerald-500/30 mt-1 uppercase shrink-0">Hızlı</span>
            </button>

            <button
              onClick={() => handleParamChange('routingAlgorithm', 'fifo')}
              className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex justify-between items-start ${
                params.routingAlgorithm === 'fifo'
                  ? 'bg-purple-500/10 border-purple-500 text-slate-200'
                  : 'bg-black/25 border-white/5 text-slate-400 hover:border-purple-500/20'
              }`}
            >
              <div>
                <span className="font-extrabold block">⌛ Rastgele Sıralama (FIFO)</span>
                <span className="text-[9px] text-slate-400 mt-0.5 block">Paketleri alınış sırasına göre taşır. Aşırı yakıt sarfiyatı ve finansal kayıplara yol açar.</span>
              </div>
              <span className="text-[8px] bg-rose-500/20 text-rose-300 font-black px-1.5 py-0.5 rounded border border-rose-500/30 mt-1 uppercase shrink-0">Kayıp</span>
            </button>
          </div>
        </div>
      </div>

      {/* LEVER 4: CENTRAL POLICY STRATEGIES */}
      <h2 className="text-[10px] font-black tracking-widest text-[#64748b] uppercase mb-3">
        4. OTONOM AJAN YOL POLİTİKALARI
      </h2>
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button
          onClick={() => setActivePolicy('dynamic')}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${
            activePolicy === 'dynamic'
              ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg'
              : 'bg-black/25 border-[#1e293b] text-slate-400 hover:border-slate-700'
          }`}
        >
          <Zap className="w-4 h-4 text-blue-400" />
          <span className="text-[11px] font-bold">Dinamik Ölçekli</span>
          <span className="text-[8.5px] text-slate-400 leading-tight">İş gücünü kargo yükü eğrisine göre otonom ölçekler</span>
        </button>

        <button
          onClick={() => setActivePolicy('safety')}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${
            activePolicy === 'safety'
              ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg'
              : 'bg-black/25 border-[#1e293b] text-slate-400 hover:border-slate-700'
          }`}
        >
          <Leaf className="w-4 h-4 text-emerald-400" />
          <span className="text-[11px] font-bold">Hasarsız / Ekolojik</span>
          <span className="text-[8.5px] text-slate-400 leading-tight">Hız sınırları korur, kaza riskini sıfıra düşürür</span>
        </button>
      </div>

      {/* EDUCATIONAL ACADEMIC LOGISTICS CORNER */}
      <div className="mt-2 bg-gradient-to-br from-indigo-500/10 to-blue-500/5 border border-indigo-500/15 rounded-2xl p-5 hover:border-indigo-400/25 transition-all">
        <button 
          onClick={() => setShowAcademicGuide(!showAcademicGuide)}
          className="w-full flex items-center justify-between text-left text-xs uppercase tracking-wider font-extrabold text-indigo-300 hover:text-indigo-200 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-400" />
            Akademik Lojistik Kılavuzu
          </span>
          <span className="text-[10px] bg-indigo-400/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-400/20">
            {showAcademicGuide ? 'Gizle' : 'Göster'}
          </span>
        </button>

        {showAcademicGuide && (
          <div className="mt-4 space-y-3.5 text-[11px] text-slate-300 leading-relaxed border-t border-white/5 pt-3 animate-fade-in">
            {/* LaTeX Note */}
            <div className="bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
              <span className="text-[10px] text-indigo-300 font-extrabold block mb-1">📘 LaTeX ve Dolar ($) İşareti Nedir?</span>
              <p className="text-slate-400 leading-snug">
                Akademik çalışmalarda (makale, rapor ve tezler) matematiksel semboller ile indisli değişkenler (Örn: <code className="text-pink-300 font-mono">$D_s$</code> veya <code className="text-pink-300 font-mono">$0.005$</code>) <b>LaTeX</b> sözdizimi ile yazılır. 
                <br /><br />
                Çift dolar (<code className="text-indigo-400 font-mono">$$</code>) blok formülleri, tek dolar (<code className="text-indigo-400 font-mono">$</code>) ise <b>cümle içi (inline) formülleri</b> belirtir. Word, LaTeX formatını otomatik denklemlere dönüştüren yerleşik formül editörlerine (Alt+= tuşuyla açılır) ve MathType eklentisine sahiptir; bu işaretler raporunuzu doğrudan Word'e aktarırken formüllerin kusursuz italik şık tasarımla basılmasını sağlar.
              </p>
            </div>

            {/* Algorithmic info elements */}
            <div>
              <h4 className="font-bold text-slate-100 mb-1 flex items-center gap-1">
                • Nearest Neighbor (Öklid TSP)
              </h4>
              <p className="text-slate-400">
                Gezgin satıcı rotalamasında kurye, her adımdaki Öklid vektör mesafesi en düşük olan düğümü bir sonraki teslimat adresi olarak seçer. Bu sayede ölü km oranını sıfıra yaklaştırır.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-100 mb-1 flex items-center gap-1">
                • M/M/b Rampa Modellemesi
              </h4>
              <p className="text-slate-400">
                Kuyruk Teorisindeki <b>M/M/{params.bayCount}</b> rampa modeline göre araçlar depoda servise girmek için sıraya girer. Servis hızı üstel dağılımla simüle edilerek rampa darboğaz oranını oluşturur.
              </p>
            </div>
          </div>
        )}
      </div>

    </aside>
  );
};
