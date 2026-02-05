import { useState, useEffect } from 'react';

export function useAuth() {
    const [auth, setAuth] = useState<{
        isLoggedIn: boolean;
        userRole: string | null;
    }>({
        isLoggedIn: false,
        userRole: null
    });

    const checkAuth = () => {
        if (typeof window !== 'undefined') {
            const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
            const role = localStorage.getItem('userRole');

            setAuth(prev => {
                if (prev.isLoggedIn === loggedIn && prev.userRole === role) return prev;
                return { isLoggedIn: loggedIn, userRole: role };
            });
        }
    };

    useEffect(() => {
        checkAuth(); // Initial check
        window.addEventListener('storage', checkAuth);
        window.addEventListener('auth-change', checkAuth);

        return () => {
            window.removeEventListener('storage', checkAuth);
            window.removeEventListener('auth-change', checkAuth);
        };
    }, []);

    const isOwner = auth.userRole?.includes('OWNER') || false;
    const isCustomer = auth.userRole?.includes('CUSTOMER') || false;

    return {
        isLoggedIn: auth.isLoggedIn,
        userRole: auth.userRole,
        isOwner,
        isCustomer
    };
}
