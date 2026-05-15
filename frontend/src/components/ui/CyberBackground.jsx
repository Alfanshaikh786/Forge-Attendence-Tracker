import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * CyberBackground - Three.js particle effect background for dashboard
 * Creates a subtle, performant particle grid with mouse interaction
 * 
 * @param {Object} props
 * @param {boolean} props.interactive - Enable mouse interaction
 * @param {number} props.particleCount - Number of particles (default: 500)
 * @returns {JSX.Element}
 */
export const CyberBackground = ({
  interactive = true,
  particleCount = 500,
}) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const particlesRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationIdRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 50;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setClearColor(0x0a0a0a, 0.1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Particle geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

      velocities[i * 3] = (Math.random() - 0.5) * 0.1;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle material
    const material = new THREE.PointsMaterial({
      color: 0x00ff41,
      size: 0.5,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.6,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = {
      mesh: particles,
      velocities,
      originalPositions: positions.slice(),
    };

    // Mouse tracking
    const handleMouseMove = (e) => {
      if (!interactive) return;
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // Handle resize
    const handleResize = () => {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (particlesRef.current) {
        const { mesh, velocities, originalPositions } = particlesRef.current;
        const positions = mesh.geometry.attributes.position.array;

        for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;

          // Update position
          positions[idx] += velocities[idx];
          positions[idx + 1] += velocities[idx + 1];
          positions[idx + 2] += velocities[idx + 2];

          // Boundary wrapping
          if (Math.abs(positions[idx]) > 50) velocities[idx] *= -1;
          if (Math.abs(positions[idx + 1]) > 50) velocities[idx + 1] *= -1;
          if (Math.abs(positions[idx + 2]) > 50) velocities[idx + 2] *= -1;

          // Mouse interaction (optional)
          if (interactive) {
            const dx = mouseRef.current.x * 50 - positions[idx];
            const dy = mouseRef.current.y * 50 - positions[idx + 1];
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 15) {
              const force = (15 - distance) / 15;
              velocities[idx] += (dx / distance) * force * 0.05;
              velocities[idx + 1] += (dy / distance) * force * 0.05;
            }
          }

          // Damping
          velocities[idx] *= 0.99;
          velocities[idx + 1] *= 0.99;
          velocities[idx + 2] *= 0.99;
        }

        mesh.geometry.attributes.position.needsUpdate = true;
      }

      // Slow rotation for visual interest
      if (particles) {
        particles.rotation.x += 0.00001;
        particles.rotation.y += 0.00002;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [interactive, particleCount]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 opacity-40 pointer-events-none"
      style={{
        background: 'radial-gradient(ellipse 600px 300px at 50% -60px, rgba(0, 255, 65, 0.1), transparent 70%)',
      }}
    />
  );
};

export default CyberBackground;
