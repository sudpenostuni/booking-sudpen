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

  // Generate slots locally
  const generateSlotsForDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Helper to generate slots
    const generateTimeSlots = (startHour: number, startMinute: number, endHour: number, endMinute: number) => {
      const slots: Slot[] = [];
      let current = new Date(`2000-01-01T${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`);
      const end = new Date(`2000-01-01T${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`);

      while (current < end) {
        const timeString = current.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const hour = current.getHours();
        
        // Traffic logic
        let traffic: 'low' | 'medium' | 'high' = 'low';
        
        if (hour >= 8 && hour < 12) traffic = 'high';
        else if (hour >= 12 && hour < 13) traffic = 'medium';
        else if (hour >= 16 && hour < 18) traffic = 'high';
        else if (hour >= 18 && hour < 19) traffic = 'medium';
        else if (hour >= 19) traffic = 'low';

        slots.push({ time: timeString, traffic, available: true });
        current.setMinutes(current.getMinutes() + 30);
      }
      return slots;
    };

    // Sunday: Closed
    if (dayOfWeek === 0) return [];
    
    // Saturday: Morning only (08:00 - 13:00)
    if (dayOfWeek === 6) return generateTimeSlots(8, 0, 13, 0);
    
    // Mon-Fri: Morning (08:00 - 13:00) + Afternoon (16:30 - 20:00)
    const morning = generateTimeSlots(8, 0, 13, 0);
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

  const handleSlotClick = (slot: Slot) => {
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
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className={`py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                selectedDate === new Date().toISOString().split('T')[0]
                  ? 'bg-[#5A5A40] text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Oggi
            </button>
            
            <button 
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              className={`py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                selectedDate === (() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  return d.toISOString().split('T')[0];
                })()
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
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <button 
                className={`h-full aspect-square flex items-center justify-center rounded-xl transition-all ${
                  selectedDate !== new Date().toISOString().split('T')[0] && 
                  selectedDate !== (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })()
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
    </div>
  );
}
