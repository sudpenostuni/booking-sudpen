import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Database Setup
const db = new Database('sudpen.db');
db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customerName TEXT NOT NULL,
    customerEmail TEXT NOT NULL,
    customerPhone TEXT,
    date TEXT NOT NULL,
    timeSlot TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes

  // Get available slots for a date with "busyness" logic
  app.get('/api/slots', (req, res) => {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // Determine day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = new Date(date as string).getDay();
    
    let allSlots: { time: string, traffic: string }[] = [];

    // Helper to generate slots
    const generateSlots = (startHour: number, startMinute: number, endHour: number, endMinute: number) => {
      const slots = [];
      let current = new Date(`2000-01-01T${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`);
      const end = new Date(`2000-01-01T${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`);

      while (current < end) {
        const timeString = current.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        
        // Determine traffic based on time
        let traffic = 'low';
        const hour = current.getHours();
        
        // Traffic logic based on historical data:
        // 08:00 - 12:00 : High (3000-4000+)
        // 12:00 - 13:00 : Medium (~1900)
        // 16:30 - 18:00 : High (3700-4200)
        // 18:00 - 19:00 : Medium (~2400)
        // 19:00 - 20:00 : Low (~500)

        if (hour >= 8 && hour < 12) {
          traffic = 'high';
        } else if (hour >= 12 && hour < 13) {
          traffic = 'medium';
        } else if (hour >= 16 && hour < 18) {
          traffic = 'high';
        } else if (hour >= 18 && hour < 19) {
          traffic = 'medium';
        } else if (hour >= 19) {
          traffic = 'low';
        }

        slots.push({ time: timeString, traffic });
        
        // Increment by 30 minutes
        current.setMinutes(current.getMinutes() + 30);
      }
      return slots;
    };

    // Sunday: Closed
    if (dayOfWeek === 0) {
      allSlots = [];
    } 
    // Saturday: Morning only (08:00 - 13:00)
    else if (dayOfWeek === 6) {
      allSlots = generateSlots(8, 0, 13, 0);
    } 
    // Mon-Fri: Morning (08:00 - 13:00) + Afternoon (16:30 - 20:00)
    else {
      const morningSlots = generateSlots(8, 0, 13, 0);
      const afternoonSlots = generateSlots(16, 30, 20, 0);
      allSlots = [...morningSlots, ...afternoonSlots];
    }

    // Check existing bookings
    const bookings = db.prepare('SELECT timeSlot FROM appointments WHERE date = ?').all(date) as { timeSlot: string }[];
    const bookedTimes = new Set(bookings.map(b => b.timeSlot));

    const availableSlots = allSlots.map(slot => ({
      ...slot,
      available: !bookedTimes.has(slot.time)
    }));

    res.json(availableSlots);
  });

  // Book an appointment
  app.post('/api/book', (req, res) => {
    const { name, email, phone, date, time } = req.body;

    if (!name || !email || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const stmt = db.prepare('INSERT INTO appointments (customerName, customerEmail, customerPhone, date, timeSlot) VALUES (?, ?, ?, ?, ?)');
      const info = stmt.run(name, email, phone, date, time);
      
      // Simulate webhook call here if needed in future
      console.log(`Webhook: New booking for ${name} at ${time} on ${date}`);

      res.json({ success: true, id: info.lastInsertRowid });
    } catch (error) {
      console.error('Booking error:', error);
      res.status(500).json({ error: 'Failed to book appointment' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving (simplified for this environment)
    app.use(express.static(path.resolve(__dirname, 'dist')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
