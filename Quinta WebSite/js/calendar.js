/* ============================================
   CALENDARIO DE DISPONIBILIDAD
   Archivo: js/calendar.js
   Conecta con /api/calendar (Cloudflare Function)
   ============================================ */

(function () {
  'use strict';

  const MONTHS_ES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  class BookingCalendar {
    constructor(opts) {
      this.widget = document.getElementById(opts.widgetId);
      this.daysEl = document.getElementById('calDays');
      this.monthEl = document.getElementById('calMonth');
      this.statusEl = document.getElementById('calStatus');
      this.prevBtn = document.getElementById('calPrev');
      this.nextBtn = document.getElementById('calNext');
      this.hiddenInput = document.getElementById(opts.inputId);
      this.onSelect = opts.onSelect || (() => {});

      if (!this.daysEl || !this.hiddenInput) return;

      this.busyDays = new Set();
      this.selected = null;
      this.today = startOfDay(new Date());
      this.viewMonth = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
      this.maxMonthAhead = opts.maxMonthAhead || 6;

      this.bindEvents();
      this.loadAvailability();
    }

    bindEvents() {
      if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.changeMonth(-1));
      if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.changeMonth(1));
    }

    async loadAvailability() {
      try {
        this.setStatus('Cargando disponibilidad…');
        const res = await fetch('/api/calendar');
        if (!res.ok) throw new Error('Error al cargar');
        const data = await res.json();
        this.busyDays = new Set(data.busyDays || []);
        this.setStatus('');
        this.render();
      } catch (err) {
        console.error(err);
        this.setStatus('No se pudo cargar el calendario. Escribinos por WhatsApp.', 'error');
        this.render();
      }
    }

    changeMonth(delta) {
      const next = new Date(this.viewMonth);
      next.setMonth(next.getMonth() + delta);

      const minMonth = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
      const maxMonth = new Date(this.today.getFullYear(), this.today.getMonth() + this.maxMonthAhead, 1);

      if (next < minMonth || next > maxMonth) return;
      this.viewMonth = next;
      this.render();
    }

    render() {
      if (!this.monthEl || !this.daysEl) return;

      this.monthEl.textContent = `${MONTHS_ES[this.viewMonth.getMonth()]} ${this.viewMonth.getFullYear()}`;

      const minMonth = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
      const maxMonth = new Date(this.today.getFullYear(), this.today.getMonth() + this.maxMonthAhead, 1);
      if (this.prevBtn) this.prevBtn.disabled = this.viewMonth <= minMonth;
      if (this.nextBtn) this.nextBtn.disabled = this.viewMonth >= maxMonth;

      this.daysEl.innerHTML = '';

      const year = this.viewMonth.getFullYear();
      const month = this.viewMonth.getMonth();
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Celdas vacías antes del día 1
      for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'cal-day cal-day--empty';
        this.daysEl.appendChild(empty);
      }

      // Días del mes
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const key = formatDate(date);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cal-day';
        btn.textContent = d;
        btn.dataset.date = key;

        const isPast = date < this.today;
        const isToday = date.getTime() === this.today.getTime();
        const isBusy = this.busyDays.has(key);
        const isSelected = this.selected === key;

        if (isPast) {
          btn.classList.add('cal-day--past');
          btn.disabled = true;
        } else if (isBusy) {
          btn.classList.add('cal-day--busy');
          btn.disabled = true;
        } else {
          btn.classList.add('cal-day--available');
        }

        if (isToday) btn.classList.add('cal-day--today');
        if (isSelected) btn.classList.add('cal-day--selected');

        btn.addEventListener('click', () => this.select(key));
        this.daysEl.appendChild(btn);
      }
    }

    select(key) {
      this.selected = key;
      this.hiddenInput.value = key;
      this.hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));

      this.daysEl.querySelectorAll('.cal-day').forEach(el => {
        el.classList.toggle('cal-day--selected', el.dataset.date === key);
      });

      const [y, m, d] = key.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      this.setStatus(`📅 Fecha elegida: ${formatLong(date)}`, 'success');
      this.onSelect(key, date);
    }

    setStatus(text, type = '') {
      if (!this.statusEl) return;
      this.statusEl.textContent = text;
      this.statusEl.className = 'calendar-status' + (type ? ` is-${type}` : '');
    }
  }

  // ---------- Utilidades ----------
  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatLong(d) {
    return `${d.getDate()} de ${MONTHS_ES[d.getMonth()]} de ${d.getFullYear()}`;
  }

  // ---------- Inicialización ----------
  document.addEventListener('DOMContentLoaded', () => {
    window.bookingCalendar = new BookingCalendar({
      widgetId: 'calendarWidget',
      inputId: 'resDate',
      maxMonthAhead: 6,
      onSelect: (key, date) => {
        // Feedback opcional: podés hacer más cosas acá
        console.log('Fecha seleccionada:', key);
      }
    });
  });
})();