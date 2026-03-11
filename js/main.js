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
   6. Contact Form Handling (index.html inline form)
   ------------------------------------------------------------ */
(function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

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

    // Disable button and show loading state
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';

    // Simulate async submission (replace with actual endpoint when available)
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Show success state
    form.style.display = 'none';
    if (successEl) {
      successEl.classList.add('visible');
    }

    // Reset
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
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
