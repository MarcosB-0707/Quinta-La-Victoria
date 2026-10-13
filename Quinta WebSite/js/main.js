// ============================================
// QUINTA LA VICTORIA — JAVASCRIPT
// Archivo: js/main.js
// ============================================

// ============================================
// CONFIGURACIÓN CENTRAL (EDITAR AQUÍ)
// ============================================
const CONFIG = {
  WHATSAPP_NUMBER: '595992389584',
  PRECIOS: {
    base: 80000,
    promo: 60000,
    minimoPromo: 10,
    maxPersonas: 30
  },
  TEMA_DEFAULT: 'dark',
  AUTOPLAY_GALERIA: 5000
};

// ============================================
// UTILIDADES
// ============================================
const utils = {
  formatPrice(n) {
    return 'Gs. ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  },
  $ (sel, ctx = document) { return ctx.querySelector(sel); },
  $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; },

  // Convierte '2026-10-15' → '15 de octubre de 2026'
  formatDateLong(isoStr) {
    if (!isoStr) return '';
    const MESES = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const [y, m, d] = isoStr.split('-').map(Number);
    if (!y || !m || !d) return '';
    return `${d} de ${MESES[m - 1]} de ${y}`;
  },

  // Convierte '2026-10-15' → '15/10/2026'
  formatDateShort(isoStr) {
    if (!isoStr) return '';
    const [y, m, d] = isoStr.split('-');
    return `${d}/${m}/${y}`;
  }
};

// ============================================
// TEMA (DARK / LIGHT)
// ============================================
const theme = {
  init() {
    const saved = localStorage.getItem('qlv_theme') || CONFIG.TEMA_DEFAULT;
    this.apply(saved);
    const btn = utils.$('#themeToggle');
    if (btn) btn.addEventListener('click', () => this.toggle());
  },
  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    this.apply(next);
    localStorage.setItem('qlv_theme', next);
  },
  apply(t) {
    document.documentElement.setAttribute('data-theme', t);
    const sun = utils.$('#iconSun');
    const moon = utils.$('#iconMoon');
    if (sun) sun.style.display = t === 'dark' ? 'block' : 'none';
    if (moon) moon.style.display = t === 'dark' ? 'none' : 'block';
  }
};

// ============================================
// NAVBAR
// ============================================
const navbar = {
  init() {
    const nav = utils.$('#navbar');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    });
  }
};

// ============================================
// MENÚ MÓVIL
// ============================================
const mobileMenu = {
  init() {
    const btn = utils.$('#menuBtn');
    const menu = utils.$('#mobileMenu');
    if (!btn || !menu) return;
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      menu.classList.toggle('active');
      document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
    });
    utils.$$('#mobileMenu a').forEach(a => {
      a.addEventListener('click', () => {
        btn.classList.remove('active');
        menu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }
};

// ============================================
// FORMULARIO DE RESERVA (con fecha del calendario)
// ============================================
const reservation = {
  // Agregamos 'date' al estado de validación
  state: { name: false, phone: false, people: false, date: false },

  init() {
    const form = utils.$('#reservationForm');
    if (!form) return;

    const name = utils.$('#resName');
    const phone = utils.$('#resPhone');
    const people = utils.$('#resPeople');
    const dateInput = utils.$('#resDate');
    const submit = utils.$('#submitBtn');
    const calendarWidget = utils.$('#calendarWidget');

    const validate = () => {
      // Nombre: al menos 2 palabras, solo letras y espacios
      this.state.name =
        /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,}$/.test(name.value.trim()) &&
        name.value.trim().split(/\s+/).length >= 2;

      // Teléfono: 09XXXXXXXX
      this.state.phone = /^09\d{8}$/.test(phone.value.trim());

      // Personas: 1-30
      const p = parseInt(people.value);
      this.state.people = p >= 1 && p <= CONFIG.PRECIOS.maxPersonas;

      // Fecha: debe haber una seleccionada en el calendario
      this.state.date = !!(dateInput && dateInput.value);

      submit.disabled = !(
        this.state.name &&
        this.state.phone &&
        this.state.people &&
        this.state.date
      );

      this.updatePrice();
    };

    // Inputs de texto/número
    [name, phone, people].forEach(el => {
      el.addEventListener('input', () => {
        el.classList.remove('error');
        validate();
      });
      el.addEventListener('blur', () => {
        if (el.value) {
          const key = el.id.replace('res', '').toLowerCase();
          if (!this.state[key]) el.classList.add('error');
        }
      });
    });

    // Fecha: viene del calendario (input hidden, cambia por JS)
    if (dateInput) {
      dateInput.addEventListener('change', () => {
        if (dateInput.value && calendarWidget) {
          calendarWidget.classList.remove('error');
        }
        validate();
      });
    }

    // Submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Si el calendario no tiene fecha, mostrar error visual
      if (!this.state.date && calendarWidget) {
        calendarWidget.classList.add('error');
        calendarWidget.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (submit.disabled) return;

      const p = parseInt(people.value);
      const price = p >= CONFIG.PRECIOS.minimoPromo ? CONFIG.PRECIOS.promo : CONFIG.PRECIOS.base;
      const total = p * price;

      // Fecha formateada para el mensaje
      const isoDate = dateInput ? dateInput.value : '';
      const fechaLarga = utils.formatDateLong(isoDate);
      const fechaCorta = utils.formatDateShort(isoDate);

      // Construimos el mensaje con saltos de línea reales (\n)
      // y luego lo codificamos con encodeURIComponent para WhatsApp.
      const lineas = [
        '¡Hola Quinta La Victoria! 🎉',
        '',
        'Quiero reservar:',
        '',
        `👤 Nombre: ${name.value.trim()}`,
        `📱 Teléfono: ${phone.value.trim()}`,
        `👥 Personas: ${p}`,
        `📅 Fecha del evento: ${fechaLarga} (${fechaCorta})`,
        `💰 Total estimado: ${utils.formatPrice(total)}`,
        '',
        '¿Me confirman disponibilidad para esa fecha? ¡Gracias!'
      ];

      const msg = encodeURIComponent(lineas.join('\n'));
      window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${msg}`, '_blank');
    });
  },

  updatePrice() {
    const peopleEl = utils.$('#resPeople');
    if (!peopleEl) return;
    const people = parseInt(peopleEl.value) || 0;
    const display = utils.$('#priceDisplay');
    const value = utils.$('#totalPrice');
    const note = utils.$('#priceNote');

    if (people < 1) {
      value.textContent = 'Gs. 0';
      note.textContent = 'Completá la cantidad de personas';
      display.classList.remove('promo');
    } else {
      const price = people >= CONFIG.PRECIOS.minimoPromo ? CONFIG.PRECIOS.promo : CONFIG.PRECIOS.base;
      const total = people * price;
      value.textContent = utils.formatPrice(total);
      if (people >= CONFIG.PRECIOS.minimoPromo) {
        note.textContent = `✨ ¡Promo aplicada! ${people} × ${utils.formatPrice(price)}`;
        display.classList.add('promo');
      } else {
        note.textContent = `${people} × ${utils.formatPrice(price)}`;
        display.classList.remove('promo');
      }
    }
  }
};

// ============================================
// FAQ ACORDEÓN
// ============================================
const faq = {
  init() {
    utils.$$('.faq-item').forEach(item => {
      const q = utils.$('.faq-question', item);
      const a = utils.$('.faq-answer', item);
      if (!q || !a) return;
      q.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');
        utils.$$('.faq-item').forEach(i => {
          i.classList.remove('active');
          const ans = utils.$('.faq-answer', i);
          if (ans) ans.style.maxHeight = null;
        });
        if (!isOpen) {
          item.classList.add('active');
          a.style.maxHeight = a.scrollHeight + 'px';
        }
      });
    });
  }
};

// ============================================
// CARRUSEL GALERÍA
// ============================================
const carousel = {
  index: 0,
  slides: [],
  autoplay: null,
  initialized: false,
  init() {
    const track = utils.$('#carouselTrack');
    if (!track || this.initialized) return;
    this.initialized = true;
    this.slides = utils.$$('.carousel-slide');
    this.buildDots();
    this.bindEvents();
    this.goTo(0);
    this.startAutoplay();
  },
  buildDots() {
    const dots = utils.$('#carouselDots');
    if (!dots) return;
    dots.innerHTML = '';
    this.slides.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', `Slide ${i + 1}`);
      d.type = 'button';
      d.addEventListener('click', () => { this.goTo(i); this.resetAutoplay(); });
      dots.appendChild(d);
    });
  },
  bindEvents() {
    const prev = utils.$('#carouselPrev');
    const next = utils.$('#carouselNext');
    if (prev) prev.addEventListener('click', () => { this.prev(); this.resetAutoplay(); });
    if (next) next.addEventListener('click', () => { this.next(); this.resetAutoplay(); });
    const container = utils.$('#carouselContainer');
    if (!container) return;
    container.addEventListener('mouseenter', () => this.stopAutoplay());
    container.addEventListener('mouseleave', () => this.startAutoplay());
    let startX = 0;
    container.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    container.addEventListener('touchend', (e) => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? this.next() : this.prev();
        this.resetAutoplay();
      }
    });
  },
  goTo(i) {
    if (!this.slides.length) return;
    this.index = (i + this.slides.length) % this.slides.length;
    const track = utils.$('#carouselTrack');
    if (track) track.style.transform = `translateX(-${this.index * 100}%)`;
    utils.$$('.carousel-dot').forEach((d, idx) => d.classList.toggle('active', idx === this.index));
  },
  next() { this.goTo(this.index + 1); },
  prev() { this.goTo(this.index - 1); },
  startAutoplay() {
    this.stopAutoplay();
    if (!this.slides.length) return;
    this.autoplay = setInterval(() => this.next(), CONFIG.AUTOPLAY_GALERIA);
  },
  stopAutoplay() { clearInterval(this.autoplay); },
  resetAutoplay() { this.stopAutoplay(); this.startAutoplay(); }
};

// ============================================
// LIGHTBOX
// ============================================
const lightbox = {
  init() {
    const lb = utils.$('#lightbox');
    const img = utils.$('#lightboxImg');
    if (!lb || !img) return;
    utils.$$('.gallery-item').forEach(item => {
      item.addEventListener('click', () => {
        img.src = item.dataset.img;
        lb.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });
    const closeBtn = utils.$('#lightboxClose');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    lb.addEventListener('click', (e) => { if (e.target === lb) this.close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.close(); });
  },
  close() {
    const lb = utils.$('#lightbox');
    if (lb) lb.classList.remove('active');
    document.body.style.overflow = '';
  }
};

// ============================================
// ANIMACIONES AL SCROLL
// ============================================
const reveal = {
  init() {
    if (!('IntersectionObserver' in window)) {
      utils.$$('.reveal').forEach(el => el.classList.add('visible'));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    utils.$$('.reveal').forEach(el => obs.observe(el));
  }
};

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  theme.init();
  navbar.init();
  mobileMenu.init();
  reservation.init();
  faq.init();
  carousel.init();  // Solo se activa en galeria.html
  lightbox.init();
  reveal.init();
  const year = utils.$('#year');
  if (year) year.textContent = new Date().getFullYear();
});