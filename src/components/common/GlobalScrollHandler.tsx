'use client';

import { useEffect } from 'react';

/**
 * Global handler to prevent number inputs from changing value on scroll.
 * This is a common annoyance where scrolling the page while a number input is focused
 * causes the value to change instead of the page scrolling.
 * 
 * Solution: Blur the input on wheel event.
 */
export function GlobalScrollHandler() {
    useEffect(() => {
        const handleWheel = () => {
            if (document.activeElement instanceof HTMLInputElement && document.activeElement.type === 'number') {
                document.activeElement.blur();
            }
        };

        // Passive true is fine because we are not calling preventDefault, we are just blurring
        // Actually, blurring itself stops the event from affecting the input usually.
        window.addEventListener('wheel', handleWheel, { passive: true });

        return () => {
            window.removeEventListener('wheel', handleWheel);
        };
    }, []);

    return null;
}
