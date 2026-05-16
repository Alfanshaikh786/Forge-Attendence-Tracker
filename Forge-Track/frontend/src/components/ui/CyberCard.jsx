import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * CyberCard - A reusable card component with neon green borders and cyber ops styling
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.animated - Enable GSAP entrance animation
 * @param {boolean} props.interactive - Enable hover glow effect
 * @param {string} props.title - Optional card title
 * @param {string} props.icon - Optional icon
 * @returns {JSX.Element}
 */
export const CyberCard = ({
  children,
  className = '',
  animated = true,
  interactive = true,
  title,
  icon,
}) => {
  const cardRef = useRef(null);
  const glowRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // Entrance animation
    if (animated) {
      gsap.fromTo(
        card,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );
    }

    // Interactive hover effects
    if (interactive) {
      const handleMouseEnter = () => {
        gsap.to(card, {
          boxShadow: '0 0 30px rgba(0, 255, 65, 0.4), inset 0 0 20px rgba(0, 255, 65, 0.1)',
          borderColor: 'rgba(0, 255, 65, 0.6)',
          duration: 0.3,
          ease: 'power2.out',
        });
        gsap.to(card, {
          y: -4,
          duration: 0.3,
          ease: 'power2.out',
        });
      };

      const handleMouseLeave = () => {
        gsap.to(card, {
          boxShadow: '0 0 0px rgba(0, 255, 65, 0.2), inset 0 0 0px rgba(0, 255, 65, 0.05)',
          borderColor: 'rgba(0, 255, 65, 0.15)',
          duration: 0.3,
          ease: 'power2.out',
        });
        gsap.to(card, {
          y: 0,
          duration: 0.3,
          ease: 'power2.out',
        });
      };

      card.addEventListener('mouseenter', handleMouseEnter);
      card.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        card.removeEventListener('mouseenter', handleMouseEnter);
        card.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [animated, interactive]);

  return (
    <div
      ref={cardRef}
      className={`
        relative rounded-lg border border-cyber-border bg-cyber-card p-6
        transition-all duration-300 overflow-hidden
        ${className}
      `}
    >
      {/* Subtle glow effect on hover */}
      <div
        ref={glowRef}
        className="absolute inset-0 opacity-0 rounded-lg pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100px 50px at 50% 0, rgba(0, 255, 65, 0.1), transparent)',
        }}
      />

      {/* Card header with title and icon */}
      {(title || icon) && (
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-cyber-border">
          {icon && <div className="text-cyber-neon text-xl">{icon}</div>}
          {title && <h3 className="text-cyber-text font-mono font-semibold tracking-wide">{title}</h3>}
        </div>
      )}

      {/* Card content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default CyberCard;
