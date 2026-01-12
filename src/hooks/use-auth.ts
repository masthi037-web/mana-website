import { useState, useEffect } from 'react';

export function useAuth() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    const checkAuth = () => {
        if (typeof window !== 'undefined') {
            setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
            setUserRole(localStorage.getItem('userRole'));
        }
    };

    useEffect(() => {
        checkAuth();
        window.addEventListener('storage', checkAuth);
        window.addEventListener('auth-change', checkAuth);

        return () => {
            window.removeEventListener('storage', checkAuth);
            window.removeEventListener('auth-change', checkAuth);
        };
    }, []);

    const isOwner = userRole?.includes('OWNER') || false;
    const isCustomer = userRole?.includes('CUSTOMER') || false;

    return {
        isLoggedIn,
        userRole,
        isOwner,
        isCustomer
    };
}
