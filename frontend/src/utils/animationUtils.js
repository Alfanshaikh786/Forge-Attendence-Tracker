import gsap from 'gsap';

/**
 * Collection of reusable GSAP animation utilities for the cyber ops interface
 */

/**
 * Fade in animation
 */
export const animateFadeIn = (element, delay = 0, duration = 0.6) => {
  if (!element) return;
  return gsap.fromTo(
    element,
    { opacity: 0 },
    { opacity: 1, duration, delay, ease: 'power2.out' }
  );
};

/**
 * Slide up animation
 */
export const animateSlideUp = (element, delay = 0, duration = 0.6) => {
  if (!element) return;
  return gsap.fromTo(
    element,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration, delay, ease: 'power2.out' }
  );
};

/**
 * Neon glow pulse effect
 */
export const animateNeonGlow = (element, duration = 2) => {
  if (!element) return;
  return gsap.to(element, {
    boxShadow: [
      '0 0 5px rgba(0, 255, 65, 0.4)',
      '0 0 20px rgba(0, 255, 65, 0.6)',
      '0 0 5px rgba(0, 255, 65, 0.4)',
    ],
    duration,
    repeat: -1,
    ease: 'sine.inOut',
  });
};

/**
 * Card entrance animation with stagger
 */
export const animateCardStagger = (elements, delay = 0, staggerAmount = 0.1) => {
  if (!elements?.length) return;
  return gsap.fromTo(
    elements,
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      delay,
      stagger: staggerAmount,
      ease: 'power2.out',
    }
  );
};

/**
 * Number counting animation
 */
export const animateCountUp = (element, targetValue, duration = 1.2) => {
  if (!element) return;
  
  const startValue = 0;
  const endValue = typeof targetValue === 'number' ? targetValue : parseInt(targetValue);

  return gsap.to(
    { count: startValue },
    {
      count: endValue,
      duration,
      ease: 'power2.out',
      onUpdate: function () {
        element.textContent = Math.round(this.targets()[0].count).toLocaleString('en-US');
      },
    }
  );
};

/**
 * Scale on hover animation
 */
export const attachScaleHover = (element, scale = 1.05, duration = 0.3) => {
  if (!element) return;

  const handleMouseEnter = () => {
    gsap.to(element, { scale, duration, ease: 'power2.out' });
  };

  const handleMouseLeave = () => {
    gsap.to(element, { scale: 1, duration, ease: 'power2.out' });
  };

  element.addEventListener('mouseenter', handleMouseEnter);
  element.addEventListener('mouseleave', handleMouseLeave);

  return () => {
    element.removeEventListener('mouseenter', handleMouseEnter);
    element.removeEventListener('mouseleave', handleMouseLeave);
  };
};

/**
 * Glow border on hover
 */
export const attachGlowHover = (element, duration = 0.3) => {
  if (!element) return;

  const handleMouseEnter = () => {
    gsap.to(element, {
      borderColor: 'rgba(0, 255, 65, 0.6)',
      boxShadow: '0 0 30px rgba(0, 255, 65, 0.4), inset 0 0 20px rgba(0, 255, 65, 0.1)',
      duration,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = () => {
    gsap.to(element, {
      borderColor: 'rgba(0, 255, 65, 0.15)',
      boxShadow: 'none',
      duration,
      ease: 'power2.out',
    });
  };

  element.addEventListener('mouseenter', handleMouseEnter);
  element.addEventListener('mouseleave', handleMouseLeave);

  return () => {
    element.removeEventListener('mouseenter', handleMouseEnter);
    element.removeEventListener('mouseleave', handleMouseLeave);
  };
};

/**
 * Page transition animation
 */
export const animatePageTransition = (element, direction = 'in', duration = 0.4) => {
  if (!element) return;

  if (direction === 'in') {
    return gsap.fromTo(
      element,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration, ease: 'power2.out' }
    );
  } else {
    return gsap.to(
      element,
      { opacity: 0, y: -20, duration, ease: 'power2.in' }
    );
  }
};

/**
 * Typewriter effect
 */
export const animateTypewriter = (element, text, speed = 50) => {
  return new Promise((resolve) => {
    let index = 0;
    const chars = text.split('');

    const type = () => {
      if (index < chars.length) {
        element.textContent += chars[index];
        index++;
        setTimeout(type, speed);
      } else {
        resolve();
      }
    };

    type();
  });
};

/**
 * Slide in panel animation
 */
export const animatePanelSlideIn = (element, side = 'right', duration = 0.4) => {
  if (!element) return;

  const fromX = side === 'right' ? 300 : -300;
  return gsap.fromTo(
    element,
    { opacity: 0, x: fromX },
    { opacity: 1, x: 0, duration, ease: 'power2.out' }
  );
};

/**
 * Slide out panel animation
 */
export const animatePanelSlideOut = (element, side = 'right', duration = 0.4) => {
  if (!element) return;

  const toX = side === 'right' ? 300 : -300;
  return gsap.to(
    element,
    { opacity: 0, x: toX, duration, ease: 'power2.in' }
  );
};

/**
 * Create a timeline for complex animations
 */
export const createAnimationTimeline = () => {
  return gsap.timeline();
};

/**
 * Stagger children animation
 */
export const staggerChildren = (parentElement, delay = 0.1) => {
  const children = parentElement.children;
  return gsap.fromTo(
    children,
    { opacity: 0, y: 10 },
    {
      opacity: 1,
      y: 0,
      duration: 0.4,
      stagger: delay,
      ease: 'power2.out',
    }
  );
};

export default {
  animateFadeIn,
  animateSlideUp,
  animateNeonGlow,
  animateCardStagger,
  animateCountUp,
  attachScaleHover,
  attachGlowHover,
  animatePageTransition,
  animateTypewriter,
  animatePanelSlideIn,
  animatePanelSlideOut,
  createAnimationTimeline,
  staggerChildren,
};
