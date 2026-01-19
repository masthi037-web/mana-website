import { useState, useEffect } from "react";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

export const useRazorpay = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Check if script is already present
        if (document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`)) {
            setIsLoaded(true);
            return;
        }

        const script = document.createElement("script");
        script.src = RAZORPAY_SCRIPT_URL;
        script.async = true;
        script.onload = () => setIsLoaded(true);
        script.onerror = () => setIsLoaded(false);

        document.body.appendChild(script);

        return () => {
            // Optional cleanup - usually we want to keep it loaded
        };
    }, []);

    return isLoaded;
};
