/**
 * Animated Cursor System
 * Desktop-only animated cursor with dot and ring
 */

export function initCursor() {
  // Check if device supports pointer
  const isDesktop = window.matchMedia('(pointer: fine)').matches;
  if (!isDesktop) return;

  // Create cursor elements
  const dot = document.createElement('div');
  dot.id = 'cursor-dot';
  const ring = document.createElement('div');
  ring.id = 'cursor-ring';

  document.body.appendChild(dot);
  document.body.appendChild(ring);

  let mouseX = 0;
  let mouseY = 0;
  let dotX = 0;
  let dotY = 0;
  let ringX = 0;
  let ringY = 0;

  // Update cursor position
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Dot follows immediately
    dotX = mouseX;
    dotY = mouseY;
    dot.style.left = dotX - 4 + 'px';
    dot.style.top = dotY - 4 + 'px';
  });

  // Ring follows with lerp
  function animateRing() {
    const lerpFactor = 0.08; // 80ms equivalent
    ringX += (mouseX - ringX) * lerpFactor;
    ringY += (mouseY - ringY) * lerpFactor;

    ring.style.left = ringX - 18 + 'px';
    ring.style.top = ringY - 18 + 'px';

    requestAnimationFrame(animateRing);
  }
  animateRing();

  // Hover effects on interactive elements
  const interactiveElements = document.querySelectorAll(
    'button, a, input, textarea, [role="button"], .clickable'
  );

  interactiveElements.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      ring.classList.add('hover');
    });

    el.addEventListener('mouseleave', () => {
      ring.classList.remove('hover');
    });
  });

  // Mouse down effect
  document.addEventListener('mousedown', () => {
    dot.classList.add('active');
  });

  document.addEventListener('mouseup', () => {
    dot.classList.remove('active');
  });
}

/**
 * Intersection Observer for scroll animations
 */
export function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.2 }
  );

  // Observe all animated elements
  document.querySelectorAll('[data-animate]').forEach((el) => {
    observer.observe(el);
  });
}

/**
 * Count-up animation for stats
 */
export function animateCounter(element, target, duration = 1200) {
  if (!element) return;

  const start = 0;
  const startTime = Date.now();

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function update() {
    const now = Date.now();
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = easeOutExpo(progress);
    const current = Math.floor(easeProgress * target);

    element.textContent = current.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  update();
}

/**
 * Ripple effect on button click
 */
export function addRippleEffect(button) {
  button.addEventListener('click', function (e) {
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');

    this.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  });
}

/**
 * Initialize floating particles
 */
export function initFloatingParticles(container, count = 12) {
  if (!container) return;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.classList.add('floating-particle');

    const size = Math.random() * 4 + 2;
    const left = Math.random() * 100;
    const delay = Math.random() * 2;
    const duration = Math.random() * 3 + 3;
    const tx = (Math.random() - 0.5) * 30;

    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left = left + '%';
    particle.style.bottom = '-10px';
    particle.style.borderRadius = '50%';
    particle.style.setProperty('--tx', tx + 'px');
    particle.style.animation = `float-up ${duration}s ease-in infinite`;
    particle.style.animationDelay = delay + 's';

    container.appendChild(particle);
  }
}

/**
 * Show toast notification
 */
export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.classList.add('toast');
  toast.textContent = message;

  // Add type-specific border color
  const borderColors = {
    success: 'rgb(16, 185, 129)',
    danger: 'rgb(244, 63, 94)',
    warning: 'rgb(245, 158, 11)',
    info: 'rgb(59, 130, 246)',
  };

  toast.style.borderLeftColor = borderColors[type] || borderColors.info;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fade-out 300ms ease-out forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Animate checkbox
 */
export function setupCheckboxAnimation(checkbox) {
  checkbox.addEventListener('change', function () {
    this.classList.toggle('checked');
  });
}

export default {
  initCursor,
  initScrollAnimations,
  animateCounter,
  addRippleEffect,
  initFloatingParticles,
  showToast,
  setupCheckboxAnimation,
};
