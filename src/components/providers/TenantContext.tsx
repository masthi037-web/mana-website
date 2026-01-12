"use client";

import React, { createContext, useContext } from 'react';
import { TenantConfig, DEFAULT_CONFIG } from '@/config/tenant-config';

const TenantContext = createContext<TenantConfig>(DEFAULT_CONFIG);

export const TenantProvider = ({ config, children }: { config: TenantConfig; children: React.ReactNode }) => {
    return (
        <TenantContext.Provider value={config}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};
