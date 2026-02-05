'use client';

import { useEffect, useState } from 'react';

/**
 * A wrapper component that renders its children only on the client side.
 * This is useful for components that use hooks or browser-only APIs that causes hydration mismatches
 * or "Rendered fewer hooks" errors when effectively server-rendered.
 */
export function ClientOnly({ children, fallback = null }: { children: React.ReactNode, fallback?: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
