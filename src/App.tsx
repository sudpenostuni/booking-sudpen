import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Check, Loader2, Info, MessageCircle } from 'lucide-react';
import { Analytics } from "@vercel/analytics/react";

// Types
interface Slot {
  time: string;
  traffic: 'low' | 'medium' | 'high';
  available: boolean;
}

export default function App() {
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTomorrowString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortByTraffic, setSortByTraffic] = useState(false);

  // Generate slots locally
  const generateSlotsForDate = (dateStr: string) => {
    // Parse dateStr (YYYY-MM-DD) as local date to get correct day of week
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    
    const now = new Date();
    const todayStr = getTodayString();
    const isToday = dateStr === todayStr;
    
    // Cutoff time: now + 30 minutes
    const cutoffTime = new Date(now.getTime() + 30 * 60000);

    // Helper to generate slots
    const generateTimeSlots = (startHour: number, startMinute: number, endHour: number, endMinute: number) => {
      const slots: Slot[] = [];
      let current = new Date(`2000-01-01T${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`);
      const end = new Date(`2000-01-01T${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`);

      while (current < end) {
        const timeString = current.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const hour = current.getHours();
        const minute = current.getMinutes();
        
        // Traffic logic
        let traffic: 'low' | 'medium' | 'high' = 'low';
        
        if (hour >= 9 && hour < 12) traffic = 'high';
        else if (hour >= 12 && hour < 13) traffic = 'medium';
        else if (hour >= 16 && hour < 18) traffic = 'high';
        else if (hour >= 18 && hour < 19) traffic = 'medium';
        else if (hour >= 19) traffic = 'low';

        let available = true;
        
        // 20-minute rule
        if (isToday) {
            const slotTime = new Date();
            slotTime.setHours(hour, minute, 0, 0);
            if (slotTime < cutoffTime) {
                available = false;
            }
        }

        slots.push({ time: timeString, traffic, available });
        current.setMinutes(current.getMinutes() + 30);
      }
      return slots;
    };

    // Sunday: Closed
    if (dayOfWeek === 0) return [];
    
    // Saturday: Morning only (09:00 - 13:00)
    if (dayOfWeek === 6) return generateTimeSlots(9, 0, 13, 0);
    
    // Mon-Fri: Morning (09:00 - 13:00) + Afternoon (16:30 - 20:00)
    const morning = generateTimeSlots(9, 0, 13, 0);
    const afternoon = generateTimeSlots(16, 30, 20, 0);
    return [...morning, ...afternoon];
  };

  // Update slots when date changes
  useEffect(() => {
    setLoading(true);
    // Simulate network delay for better UX
    setTimeout(() => {
      const generatedSlots = generateSlotsForDate(selectedDate);
      setSlots(generatedSlots);
      setLoading(false);
    }, 300);
  }, [selectedDate]);

  const recommendedSlots = slots.filter(s => s.available && s.traffic === 'low').slice(0, 3);

  const handleSlotClick = (slot: Slot) => {
    if (!slot.available) return;
    const dateObj = new Date(selectedDate);
    const dateStr = dateObj.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
    const message = `RITIRO STAMPE\nORE ${slot.time} ( ${dateStr} )`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/3917972545?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col font-sans text-[#1a1a1a]">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-[#1a1a1a]">Sudpen</h1>
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Prenotazioni</div>
      </header>

      <main className="flex-1 p-4 max-w-md mx-auto w-full pb-40">
        
        {/* Off-Peak Promotion Banner */}
        <div className="mb-6 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-900">Evita la coda!</h3>
            <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
              Prenota durante le <strong>ore tranquille</strong> per un servizio più rapido.
            </p>
          </div>
        </div>

        {/* Recommended Slots */}
        {recommendedSlots.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between px-1 mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Consigliati (Ore Tranquille)</h2>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase">Priorità</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {recommendedSlots.map((slot) => (
                <motion.button
                  key={`rec-${slot.time}`}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSlotClick(slot)}
                  className="flex-shrink-0 w-32 bg-white border-2 border-emerald-500/20 p-4 rounded-2xl text-center shadow-sm hover:border-emerald-500/40 transition-all"
                >
                  <span className="block text-2xl font-bold text-emerald-900">{slot.time}</span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Tranquillo</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Slots Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-serif font-semibold">Tutti gli Orari</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSortByTraffic(!sortByTraffic)}
                className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full transition-all border ${
                  sortByTraffic 
                    ? 'bg-emerald-600 text-white border-emerald-600' 
                    : 'bg-white text-gray-400 border-gray-200'
                }`}
              >
                {sortByTraffic ? 'Per Traffico' : 'Per Orario'}
              </button>
              {loading && <Loader2 className="animate-spin text-[#5A5A40]" size={18} />}
            </div>
          </div>

          {!loading && slots.length === 0 && (
            <div className="text-center py-10 text-gray-500 bg-white rounded-2xl p-6">
              <Clock className="mx-auto mb-3 opacity-20" size={48} />
              <p>Nessun orario disponibile per questa data.</p>
              <p className="text-sm mt-1">Siamo chiusi o tutti gli slot sono occupati.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {[...slots]
              .sort((a, b) => {
                if (!sortByTraffic) return 0; // Keep chronological
                const trafficOrder = { low: 0, medium: 1, high: 2 };
                return trafficOrder[a.traffic] - trafficOrder[b.traffic];
              })
              .map((slot) => (
                <motion.button
                  layout
                  key={slot.time}
                  disabled={!slot.available}
                  whileTap={slot.available ? { scale: 0.98 } : {}}
                  onClick={() => handleSlotClick(slot)}
                  className={`
                    relative p-4 rounded-xl border text-left transition-all shadow-sm flex flex-col justify-between h-24
                    ${!slot.available 
                      ? 'opacity-50 bg-gray-100 border-gray-200 cursor-not-allowed' 
                      : slot.traffic === 'low' && sortByTraffic
                        ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-100'
                        : 'bg-white border-gray-100 active:border-[#5A5A40] active:bg-[#fcfcf9]'}
                  `}
                >
                <div className="flex justify-between items-start w-full">
                  <span className="text-xl font-semibold tracking-tight">{slot.time}</span>
                  <MessageCircle size={18} className="text-[#25D366]" />
                </div>
                
                <div className="mt-auto">
                  <span className={`
                    inline-flex items-center text-[10px] px-2 py-1 rounded-full uppercase tracking-wide font-bold
                    ${slot.traffic === 'low' ? 'bg-green-100 text-green-700' : 
                      slot.traffic === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-red-50 text-red-700'}
                  `}>
                    {slot.traffic === 'low' ? 'Tranquillo' : slot.traffic === 'medium' ? 'Medio' : 'Affollato'}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </main>

      {/* Fixed Bottom Date Picker */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-md mx-auto space-y-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Seleziona Data
            </label>
            <span className="text-xs font-medium text-[#5A5A40]">
              {new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'long' })}
            </span>
          </div>

          <div className="grid grid-cols-[1fr_1fr_auto] gap-3">
            <button 
              onClick={() => setSelectedDate(getTodayString())}
              className={`py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                selectedDate === getTodayString()
                  ? 'bg-[#5A5A40] text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Oggi
            </button>
            
            <button 
              onClick={() => setSelectedDate(getTomorrowString())}
              className={`py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                selectedDate === getTomorrowString()
                  ? 'bg-[#5A5A40] text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Domani
            </button>

            <div className="relative">
              <input 
                type="date" 
                value={selectedDate}
                min={getTodayString()}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <button 
                className={`h-full aspect-square flex items-center justify-center rounded-xl transition-all ${
                  selectedDate !== getTodayString() && 
                  selectedDate !== getTomorrowString()
                    ? 'bg-[#5A5A40] text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Calendar size={20} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 pt-1">
            <Info size={12} />
            <p>Tocca un orario per prenotare su WhatsApp</p>
          </div>
        </div>
      </div>
      <Analytics />
    </div>
  );
}
