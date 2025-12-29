import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiProps {
    isActive: boolean;
    onComplete?: () => void;
}

const COLORS = ['#FFC700', '#FF0000', '#2E3192', '#41BBC7', '#7F3F98', '#FFFFFF', '#00FF00'];

export const Confetti: React.FC<ConfettiProps> = ({ isActive, onComplete }) => {
    const [particles, setParticles] = useState<number[]>([]);

    useEffect(() => {
        if (isActive) {
            // Create 100 particles
            setParticles(Array.from({ length: 100 }).map((_, i) => i));

            // Auto-hide after 3 seconds
            const timer = setTimeout(() => {
                if (onComplete) onComplete();
            }, 5000); // Allow animation to finish
            return () => clearTimeout(timer);
        } else {
            setParticles([]);
        }
    }, [isActive, onComplete]);

    return (
        <AnimatePresence>
            {isActive && (
                <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden flex justify-center">
                    {particles.map((i) => (
                        <ConfettiParticle key={i} index={i} />
                    ))}
                </div>
            )}
        </AnimatePresence>
    );
};

const ConfettiParticle: React.FC<{ index: number }> = ({ index }) => {
    const randomX = Math.random() * 100 - 50; // -50% to 50%
    const randomDelay = Math.random() * 0.5;
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const randomRotation = Math.random() * 360;

    return (
        <motion.div
            initial={{
                y: -100,
                x: `${randomX}vw`,
                rotate: 0,
                opacity: 1
            }}
            animate={{
                y: '110vh',
                x: `${randomX + (Math.random() * 20 - 10)}vw`, // Drift
                rotate: randomRotation + 720,
                opacity: 0
            }}
            transition={{
                duration: 3 + Math.random() * 2,
                delay: randomDelay,
                ease: "easeOut"
            }}
            style={{
                width: '10px',
                height: '10px',
                backgroundColor: randomColor,
                position: 'absolute',
                top: 0
            }}
        />
    );
};
