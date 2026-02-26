import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Check, Loader2, Info, MessageCircle } from 'lucide-react';

// Types
interface Slot {
  time: string;
  traffic: 'low' | 'medium' | 'high';
  available: boolean;
}

export default function App() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch slots when date changes
  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/slots?date=${selectedDate}`);
        const data = await res.json();
        setSlots(data);
      } catch (err) {
        console.error("Failed to fetch slots", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [selectedDate]);

  const handleSlotClick = (slot: Slot) => {
    const dateObj = new Date(selectedDate);
    const dateStr = dateObj.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
    const message = `prenotazione ritiro a partire dalle ore : ${slot.time} del ${dateStr}`;
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
        
        {/* Slots Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-serif font-semibold">Orari Disponibili</h2>
            {loading && <Loader2 className="animate-spin text-[#5A5A40]" size={18} />}
          </div>

          {!loading && slots.length === 0 && (
            <div className="text-center py-10 text-gray-500 bg-white rounded-2xl p-6">
              <Clock className="mx-auto mb-3 opacity-20" size={48} />
              <p>Nessun orario disponibile per questa data.</p>
              <p className="text-sm mt-1">Siamo chiusi o tutti gli slot sono occupati.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {slots.map((slot) => (
              <motion.button
                key={slot.time}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSlotClick(slot)}
                className={`
                  relative p-4 rounded-xl border text-left transition-all shadow-sm flex flex-col justify-between h-24
                  ${!slot.available 
                    ? 'opacity-50 bg-gray-100 border-gray-200 cursor-not-allowed' 
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
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">
            Seleziona Data
          </label>
          <div className="relative">
            <input 
              type="date" 
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#5A5A40] appearance-none"
            />
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>
          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 pt-1">
            <Info size={12} />
            <p>Tocca un orario per prenotare su WhatsApp</p>
          </div>
        </div>
      </div>
    </div>
  );
}
