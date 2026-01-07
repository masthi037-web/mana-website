"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const CONFETTI_COLORS = ['#32C8B4', '#20B2AA', '#FFD700', '#FF6B6B', '#4ECDC4'];

interface ConfettiProps {
    duration?: number;
}

export const Confetti = ({ duration = 3000 }: ConfettiProps) => {
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsActive(false), duration);
        return () => clearTimeout(timer);
    }, [duration]);

    if (!isActive) return null;

    // We use a portal to ensure it's always on top of everything, even the Sheet
    if (typeof window === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
                <div
                    key={i}
                    className="absolute top-[-20px] animate-confetti-drop"
                    style={{
                        left: `${Math.random() * 100}vw`,
                        backgroundColor: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
                        width: `${Math.random() * 8 + 4}px`,
                        height: `${Math.random() * 12 + 6}px`,
                        animationDuration: `${Math.random() * 2 + 1.5}s`,
                        animationDelay: `${Math.random() * 0.5}s`,
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px', // Mix of confetti shapes
                        opacity: Math.random() * 0.5 + 0.5,
                    }}
                />
            ))}
        </div>,
        document.body
    );
};
