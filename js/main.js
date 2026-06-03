/* ============================================================
   HACKWARE — main.js
   hackware.tech
   ============================================================ */

'use strict';

/* ------------------------------------------------------------
   1. Navbar — background on scroll
   ------------------------------------------------------------ */
(function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ------------------------------------------------------------
   2. Mobile Menu
   ------------------------------------------------------------ */
(function initMobileMenu() {
  const burger = document.querySelector('.navbar__burger');
  const mobileMenu = document.querySelector('.navbar__mobile');
  if (!burger || !mobileMenu) return;

  burger.addEventListener('click', () => {
    const isOpen = burger.classList.toggle('open');
    mobileMenu.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close on link click
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!burger.contains(e.target) && !mobileMenu.contains(e.target)) {
      burger.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
})();

/* ------------------------------------------------------------
   3. Scroll-triggered Reveal Animations
   ------------------------------------------------------------ */
(function initReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
})();

/* ------------------------------------------------------------
   4. Smooth Scroll for Anchor Links
   ------------------------------------------------------------ */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navH = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-h') || '72', 10);
      const top = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

/* ------------------------------------------------------------
   5. Hero SVG — Subtle Node Pulse Animation
   ------------------------------------------------------------ */
(function initHeroSVGAnimation() {
  const nodes = document.querySelectorAll('.hero-node');
  if (!nodes.length) return;

  nodes.forEach((node, i) => {
    const delay = i * 0.4;
    node.style.animationDelay = `${delay}s`;
  });
})();

/* ------------------------------------------------------------
   6. Contact Form Handling (contato.html)
   ------------------------------------------------------------ */
(function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  // Endpoint do Cloudflare Worker que envia via MailerSend.
  // Substitua pela URL final após `wrangler deploy`.
  const ENDPOINT = 'https://contact-site.hackware.workers.dev';

  const successEl = document.getElementById('form-success');
  const submitBtn = form.querySelector('[type="submit"]');

  const requiredFields = form.querySelectorAll('[required]');

  function validateField(field) {
    const val = field.value.trim();
    let valid = val !== '';
    if (field.type === 'email') {
      valid = valid && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    }
    field.classList.toggle('error', !valid);
    return valid;
  }

  requiredFields.forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('error')) validateField(field);
    });
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    let allValid = true;
    requiredFields.forEach(field => {
      if (!validateField(field)) allValid = false;
    });

    if (!allValid) return;

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';

    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      form.style.display = 'none';
      if (successEl) successEl.classList.add('visible');
    } catch (err) {
      console.error('Falha ao enviar formulário:', err);
      alert('Não foi possível enviar sua mensagem agora. Tente novamente em instantes.');
      if (window.turnstile) window.turnstile.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
})();

/* ------------------------------------------------------------
   7. Stat Counter Animation
   ------------------------------------------------------------ */
(function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const easeOutQuad = t => t * (2 - t);

  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 1500;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.floor(easeOutQuad(progress) * target);
      el.textContent = `${prefix}${value}${suffix}`;
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
})();

/* ------------------------------------------------------------
   8. Active Nav Link on Scroll
   ------------------------------------------------------------ */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.navbar__link[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.style.color = '';
          if (link.getAttribute('href') === `#${entry.target.id}`) {
            link.style.color = 'var(--text)';
          }
        });
      }
    });
  }, {
    threshold: 0.4,
    rootMargin: '-72px 0px 0px 0px'
  });

  sections.forEach(s => observer.observe(s));
})();


/* ------------------------------------------------------------
   9. Hero SVG — Parallax 3D que segue o mouse
   ------------------------------------------------------------ */
(function initHeroParallax() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const scene = document.querySelector('.hero__bg[data-scene]');
  if (!scene) return;
  const tilt = scene.querySelector('[data-tilt]');
  if (!tilt) return;

  let mx = 0, my = 0, cx = 0, cy = 0, sx = 0, sy = 0, t = 0;
  const MAX_X = 13, MAX_Y = 19, SHIFT = 26;

  window.addEventListener('mousemove', (e) => {
    mx = (e.clientX / window.innerWidth) * 2 - 1;
    my = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  (function loop() {
    t += 0.016;
    const idleX = Math.sin(t * 0.5) * 0.16;
    const idleY = Math.cos(t * 0.42) * 0.16;
    cx += ((-(my + idleY) * MAX_X) - cx) * 0.05;
    cy += (((mx + idleX) * MAX_Y) - cy) * 0.05;
    sx += (((mx + idleX) * SHIFT) - sx) * 0.05;
    sy += (((my + idleY) * SHIFT) - sy) * 0.05;
    tilt.style.transform = 'translate3d(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px,0) rotateX(' + cx.toFixed(2) + 'deg) rotateY(' + cy.toFixed(2) + 'deg)';
    requestAnimationFrame(loop);
  })();
})();
