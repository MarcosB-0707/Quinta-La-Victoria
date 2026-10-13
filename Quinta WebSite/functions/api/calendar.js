// ============================================
// CLOUDFLARE PAGES FUNCTION
// Archivo: functions/api/calendar.js
// URL: https://tu-dominio.pages.dev/api/calendar
// ============================================

const CALENDAR_ID = 'be1c23f1ecfc4fb15b342f06c6cf7d68d8622da0621643cdfdbd8a63f77e977@group.calendar.google.com';
const ICS_URL = `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_ID)}/public/basic.ics`;

export async function onRequest(context) {
  try {
    const response = await fetch(ICS_URL, {
      headers: { 'User-Agent': 'QuintaLaVictoria/1.0' }
    });

    if (!response.ok) {
      return json({ error: 'No se pudo obtener el calendario' }, 502);
    }

    const icsText = await response.text();
    const busyDays = parseICS(icsText);

    return json({
      busyDays,
      updatedAt: new Date().toISOString()
    }, 200, {
      'Cache-Control': 'public, max-age=300'
    });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders
    }
  });
}

function parseICS(icsText) {
  const busyDays = new Set();
  const lines = icsText.replace(/\r\n[ \t]/g, '').split(/\r?\n/);

  let inEvent = false;
  let dtstart = null;
  let dtend = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      dtstart = null;
      dtend = null;
      continue;
    }
    if (line === 'END:VEVENT') {
      inEvent = false;
      if (dtstart) {
        const start = parseICSDate(dtstart);
        const end = dtend ? parseICSDate(dtend) : new Date(start);
        if (!dtend) end.setDate(end.getDate() + 1);
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          busyDays.add(formatDate(d));
        }
      }
      continue;
    }
    if (!inEvent) continue;

    if (line.startsWith('DTSTART')) {
      dtstart = line.split(':').pop().trim();
    } else if (line.startsWith('DTEND')) {
      dtend = line.split(':').pop().trim();
    }
  }

  return Array.from(busyDays);
}

function parseICSDate(str) {
  const year = parseInt(str.slice(0, 4), 10);
  const month = parseInt(str.slice(4, 6), 10) - 1;
  const day = parseInt(str.slice(6, 8), 10);
  return new Date(year, month, day);
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}