"use client";

import React, { useLayoutEffect } from 'react';
import { TenantConfig } from '@/config/tenant-config';
import { TenantProvider } from './TenantContext';

interface ThemeProviderProps {
    config: TenantConfig;
    children: React.ReactNode;
}

export function ThemeProvider({ config, children }: ThemeProviderProps) {
    useLayoutEffect(() => {
        const root = document.documentElement;
        const { colors, radius, fontFamily } = config.theme;

        // Apply Colors
        root.style.setProperty('--primary', colors.primary);
        root.style.setProperty('--primary-foreground', colors.primaryForeground);
        root.style.setProperty('--secondary', colors.secondary);
        root.style.setProperty('--background', colors.background);

        // Apply Card Specifics
        if (config.theme.productCard) {
            root.style.setProperty('--card-bg-custom', config.theme.productCard.backgroundColor);
            root.style.setProperty('--card-radius-custom', config.theme.productCard.radius);
            root.style.setProperty('--card-shadow-custom', config.theme.productCard.shadow);
            root.style.setProperty('--card-border-custom', config.theme.productCard.border);
        }

        // Apply Radius
        root.style.setProperty('--radius', radius);

        // Apply Font (Optional: Requires font class handling usually, but variable works if set in CSS)
        // root.style.setProperty('--font-body', fontFamily);

        // Apply Advanced Configs (Motion)
        if (config.motion) {
            root.style.setProperty('--motion-card-hover', config.motion.cardHover);
            root.style.setProperty('--motion-button-tap', config.motion.buttonTap);
            root.style.setProperty('--motion-duration', config.motion.duration);
            root.style.setProperty('--motion-easing', config.motion.easing);
        }

        // Apply Typography
        if (config.typography) {
            root.style.setProperty('--type-heading-weight', config.typography.heading.weight);
            root.style.setProperty('--type-heading-spacing', config.typography.heading.letterSpacing);
            root.style.setProperty('--type-heading-transform', config.typography.heading.transform);

            root.style.setProperty('--type-product-weight', config.typography.productName.weight);
            root.style.setProperty('--type-product-spacing', config.typography.productName.letterSpacing);

            root.style.setProperty('--type-price-weight', config.typography.price.weight);
            root.style.setProperty('--type-price-tracking', config.typography.price.tracking === 'tight' ? '-0.025em' : config.typography.price.tracking === 'widest' ? '0.1em' : 'normal');

            root.style.setProperty('--type-button-uppercase', config.typography.button.uppercase ? 'uppercase' : 'none');
            root.style.setProperty('--type-button-weight', config.typography.button.weight);
        }

        // Apply Layout
        if (config.layout) {
            root.style.setProperty('--layout-max-width', config.layout.maxWidth);
            root.style.setProperty('--layout-grid-gap', config.layout.gridGap);
        }

    }, [config]);

    return (
        <TenantProvider config={config}>
            {children}
        </TenantProvider>
    );
}
