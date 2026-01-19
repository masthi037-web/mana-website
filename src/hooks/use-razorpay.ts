import { useState, useEffect } from "react";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

export const useRazorpay = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Just check status on mount, don't inject
        if (typeof window !== 'undefined' && (window as any).Razorpay) {
            setIsLoaded(true);
        }
    }, []);

    const loadRazorpay = (): Promise<boolean> => {
        return new Promise((resolve) => {
            // Check if already loaded
            if (typeof window !== 'undefined' && (window as any).Razorpay) {
                setIsLoaded(true);
                resolve(true);
                return;
            }

            // Check if script exists
            if (document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`)) {
                // If it exists but window.Razorpay isn't ready, we might need to wait or it's loading.
                // For simplicity, we assume if script tag is there, it's handling itself, 
                // but we can add an onload listener to the existing script if needed.
                // However, usually we can just append a new listener or poll. 
                // Let's just create it if not present to be safe, or just resolve true if we think it's done.
                // Better safety:
                const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`) as HTMLScriptElement;
                if (existingScript) {
                    existingScript.addEventListener('load', () => {
                        setIsLoaded(true);
                        resolve(true);
                    });
                    return;
                }
            }

            const script = document.createElement("script");
            script.src = RAZORPAY_SCRIPT_URL;
            script.async = true;
            script.onload = () => {
                setIsLoaded(true);
                resolve(true);
            };
            script.onerror = () => {
                setIsLoaded(false);
                resolve(false);
            };

            document.body.appendChild(script);
        });
    };

    return { isLoaded, loadRazorpay };
};
