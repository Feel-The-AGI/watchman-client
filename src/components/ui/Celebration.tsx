'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  velocity: { x: number; y: number };
  rotation: number;
  rotationSpeed: number;
  type: 'confetti' | 'spark';
}

interface CelebrationProps {
  isActive: boolean;
  onComplete?: () => void;
}

const COLORS = [
  '#8B5CF6', // Purple (watchman-accent)
  '#A78BFA', // Light purple
  '#C4B5FD', // Lighter purple
  '#10B981', // Emerald
  '#34D399', // Light emerald
  '#F59E0B', // Amber
  '#FBBF24', // Light amber
  '#EC4899', // Pink
  '#F472B6', // Light pink
  '#FFFFFF', // White
];

export function Celebration({ isActive, onComplete }: CelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showBanner, setShowBanner] = useState(false);

  const createParticles = useCallback(() => {
    const newParticles: Particle[] = [];

    // Create confetti from multiple points
    const sources = [
      { x: 20, y: 100 },
      { x: 80, y: 100 },
      { x: 50, y: 110 },
    ];

    sources.forEach((source, sourceIndex) => {
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: sourceIndex * 100 + i,
          x: source.x,
          y: source.y,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: Math.random() * 10 + 5,
          velocity: {
            x: (Math.random() - 0.5) * 15,
            y: -Math.random() * 20 - 10,
          },
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 20,
          type: 'confetti',
        });
      }
    });

    // Add sparkles/firework particles
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      newParticles.push({
        id: 500 + i,
        x: 50,
        y: 40,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 4,
        velocity: {
          x: Math.cos(angle) * (Math.random() * 8 + 4),
          y: Math.sin(angle) * (Math.random() * 8 + 4),
        },
        rotation: 0,
        rotationSpeed: 0,
        type: 'spark',
      });
    }

    return newParticles;
  }, []);

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      setShowBanner(false);
      return;
    }

    // Initial burst
    setParticles(createParticles());
    setShowBanner(true);

    // Secondary burst after 300ms
    const secondBurst = setTimeout(() => {
      setParticles(prev => [...prev, ...createParticles().map(p => ({ ...p, id: p.id + 1000 }))]);
    }, 300);

    // Third burst after 600ms
    const thirdBurst = setTimeout(() => {
      setParticles(prev => [...prev, ...createParticles().map(p => ({ ...p, id: p.id + 2000 }))]);
    }, 600);

    // Clean up after animation
    const cleanup = setTimeout(() => {
      setParticles([]);
      setShowBanner(false);
      onComplete?.();
    }, 4000);

    return () => {
      clearTimeout(secondBurst);
      clearTimeout(thirdBurst);
      clearTimeout(cleanup);
    };
  }, [isActive, createParticles, onComplete]);

  // Animate particles
  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.velocity.x * 0.1,
            y: p.y + p.velocity.y * 0.1,
            velocity: {
              x: p.velocity.x * 0.99,
              y: p.velocity.y + 0.3, // gravity
            },
            rotation: p.rotation + p.rotationSpeed,
          }))
          .filter(p => p.y < 150) // Remove particles that fall off screen
      );
    }, 16);

    return () => clearInterval(interval);
  }, [particles.length > 0]);

  if (!isActive && particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {/* Confetti particles */}
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0.8, scale: particle.type === 'spark' ? 0 : 1 }}
          transition={{ duration: particle.type === 'spark' ? 1 : 3 }}
          style={{
            position: 'absolute',
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.type === 'confetti' ? particle.size * 0.6 : particle.size,
            backgroundColor: particle.color,
            borderRadius: particle.type === 'spark' ? '50%' : '2px',
            transform: `rotate(${particle.rotation}deg)`,
            boxShadow: particle.type === 'spark'
              ? `0 0 ${particle.size * 2}px ${particle.color}`
              : 'none',
          }}
        />
      ))}

      {/* Celebration banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
            className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-auto"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-watchman-accent to-watchman-purple blur-3xl opacity-50 scale-150" />

              {/* Main banner */}
              <div className="relative px-12 py-8 rounded-3xl bg-gradient-to-br from-watchman-accent to-watchman-purple shadow-2xl shadow-watchman-accent/50 border border-white/20">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="absolute -top-6 left-1/2 -translate-x-1/2"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/50">
                    <Crown className="w-7 h-7 text-amber-900" />
                  </div>
                </motion.div>

                <div className="text-center mt-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-center gap-2 mb-2"
                  >
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span className="text-amber-300 font-medium text-sm uppercase tracking-wider">
                      Welcome to
                    </span>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="text-4xl font-bold text-white mb-2"
                  >
                    Watchman Pro
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-white/80 text-sm"
                  >
                    All features unlocked. Let&apos;s go!
                  </motion.p>
                </div>

                {/* Animated border */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 bg-gradient-conic from-transparent via-white/20 to-transparent"
                    style={{ scale: 2 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
