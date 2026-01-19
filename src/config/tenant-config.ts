

export interface TenantMotion {
    cardHover: string; // e.g., "translateY(-4px) scale(1.01)"
    buttonTap: string; // "scale(0.96)"
    pageEnter: string; // "fade-up"
    duration: string; // "300ms"
    easing: string; // "cubic-bezier(0.4, 0, 0.2, 1)"
}

export interface TenantTypography {
    heading: {
        weight: string; // "700"
        letterSpacing: string; // "-0.02em"
        transform: string; // "none" | "uppercase"
    };
    productName: {
        weight: string; // "500"
        letterSpacing: string; // "-0.01em"
    };
    price: {
        weight: string; // "600"
        tracking: string; // "tight"
    };
    button: {
        uppercase: boolean;
        weight: string; // "600"
    };
}

export interface TenantLayout {
    density: "comfortable" | "compact" | "luxury";
    maxWidth: string; // "1280px"
    gridGap: string; // "1.5rem"
    sectionSpacing: string; // "4rem"
}

export interface TenantSurface {
    header: "solid" | "glass" | "gradient";
    footer: "dark" | "minimal" | "branded";
    productCardStyle: "flat" | "elevated" | "outlined" | "glass";
}

export interface TenantBrandTone {
    mood: "calm" | "energetic" | "playful" | "serious" | "premium";
    cornerStyle: "sharp" | "soft" | "mixed";
    animationSpeed: "slow" | "normal" | "fast";
}

export interface TenantConfig {
    id: string;
    domain?: string; // Tenant Domain (e.g. localhost, example.com)
    companyId?: string; // Dynamic DB Company ID
    name: string;
    theme: {
        colors: {
            primary: string;
            primaryForeground: string;
            secondary: string;
            background: string;
        };
        radius: string;
        fontFamily: string;
        productCard?: {
            backgroundColor: string;
            radius: string;
            shadow: string;
            border: string;
        };
    };
    // New Advanced Configs
    motion?: TenantMotion;
    typography?: TenantTypography;
    layout?: TenantLayout;
    surface?: TenantSurface;
    brandTone?: TenantBrandTone;

    features: {
        enableWishlist: boolean;
        enableratings: boolean;
        showStockCount: boolean;
    };
    text: {
        checkoutButton: string;
        emptyCartParams: string;
        quickAddButton?: string;
        searchPlaceholder?: string;
        startsFrom?: string;
    };
}

export const DEFAULT_CONFIG: TenantConfig = {
    id: "default",
    domain: "babaihomefoods",
    name: "Digi Turu",
    theme: {
        colors: {
            primary: "180 80% 35%",
            primaryForeground: "210 40% 98%",
            secondary: "210 20% 94%",
            background: "210 20% 98%",
        },
        radius: "0.5rem",
        fontFamily: "var(--font-poppins)",
        productCard: {
            backgroundColor: "hsl(var(--card))",
            radius: "1.5rem",
            shadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            border: "1px solid hsl(var(--border) / 0.5)",
        }
    },
    // Default Advanced Configs
    motion: {
        cardHover: "translateY(-4px) scale(1.01)",
        buttonTap: "scale(0.96)",
        pageEnter: "fade-up",
        duration: "300ms",
        easing: "cubic-bezier(0.4, 0, 0.2, 1)"
    },
    typography: {
        heading: { weight: "700", letterSpacing: "-0.02em", transform: "none" },
        productName: { weight: "500", letterSpacing: "-0.01em" },
        price: { weight: "600", tracking: "tight" },
        button: { uppercase: false, weight: "600" }
    },
    layout: {
        density: "comfortable",
        maxWidth: "1280px",
        gridGap: "1.5rem",
        sectionSpacing: "4rem"
    },
    surface: {
        header: "glass",
        footer: "minimal",
        productCardStyle: "elevated"
    },
    brandTone: {
        mood: "calm",
        cornerStyle: "soft",
        animationSpeed: "normal"
    },
    features: {
        enableWishlist: true,
        enableratings: true,
        showStockCount: true,
    },
    text: {
        checkoutButton: "Checkout securely",
        emptyCartParams: "Discover our best sellers!",
        quickAddButton: "Quick Add",
        searchPlaceholder: "Search products, brands, and more...",
        startsFrom: "Starts from",
    },
};

const TENANT_MAP: Record<string, Partial<TenantConfig>> = {
    // 1. Organic Greens (Fresh, Friendly)
    "mashallah": {
        id: "organic-greens",
        name: "Home Foods",
        theme: {
            colors: {
                primary: "142 76% 36%",
                primaryForeground: "0 0% 100%",
                secondary: "142 70% 95%",
                background: "142 20% 97%",
            },
            radius: "1rem",
            fontFamily: "var(--font-inter)",
            productCard: {
                backgroundColor: "white",
                radius: "1rem",
                shadow: "0 4px 6px -1px rgb(22 163 74 / 0.1)",
                border: "1px solid rgb(22 163 74 / 0.2)",
            }
        },
        brandTone: { mood: "energetic", cornerStyle: "mixed", animationSpeed: "normal" },
        surface: { header: "glass", footer: "branded", productCardStyle: "elevated" },
        text: {
            checkoutButton: "Order Fresh",
            emptyCartParams: "Your basket needs some greens!",
            quickAddButton: "Add Fresh",
            searchPlaceholder: "Search fresh vegetables...",
            startsFrom: "From",
        }
    },
    // 2. Midnight Tech (Dark, Cyberpunk)
    "midnighttech.store": {
        id: "midnight-tech",
        name: "Midnight Tech",
        theme: {
            colors: {
                primary: "262 80% 50%",
                primaryForeground: "0 0% 100%",
                secondary: "240 10% 15%",
                background: "220 30% 12%",
            },
            radius: "2px",
            fontFamily: "var(--font-inter)",
            productCard: {
                backgroundColor: "hsl(220 30% 16%)",
                radius: "4px",
                shadow: "0 0 15px rgb(124 58 237 / 0.2)",
                border: "1px solid rgb(124 58 237 / 0.3)",
            }
        },
        motion: { // Cyberpunk needs fast, glitch-like usage
            cardHover: "translateY(-2px) scale(1.02)",
            buttonTap: "scale(0.98)",
            pageEnter: "fade-in",
            duration: "150ms",
            easing: "steps(4)"
        },
        typography: {
            heading: { weight: "800", letterSpacing: "0.05em", transform: "uppercase" },
            productName: { weight: "600", letterSpacing: "0.02em" },
            price: { weight: "700", tracking: "widest" },
            button: { uppercase: true, weight: "700" }
        },
        surface: { header: "solid", footer: "dark", productCardStyle: "outlined" },
        text: {
            checkoutButton: "Secure Hardware",
            emptyCartParams: "System integrity: Empty.",
            quickAddButton: "Initialize",
            searchPlaceholder: "Command: Search...",
            startsFrom: "Base Model:",
        }
    },
    // 3. Sweet Treats (Pink, Playful)
    "sweettreats.shop": {
        id: "sweet-treats",
        name: "Sweet Treats",
        theme: {
            colors: {
                primary: "330 85% 60%",
                primaryForeground: "0 0% 100%",
                secondary: "330 100% 96%",
                background: "330 30% 98%",
            },
            radius: "1.5rem",
            fontFamily: "var(--font-poppins)",
            productCard: {
                backgroundColor: "white",
                radius: "2rem",
                shadow: "0 10px 15px -3px rgb(236 72 153 / 0.2)",
                border: "2px dashed rgb(236 72 153 / 0.3)",
            }
        },
        motion: { // Bouncy and fun
            cardHover: "translateY(-8px) rotate(1deg)",
            buttonTap: "scale(0.9)",
            pageEnter: "fade-up",
            duration: "400ms",
            easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)" // Bouncy
        },
        layout: { density: "comfortable", maxWidth: "1200px", gridGap: "2rem", sectionSpacing: "5rem" },
        text: {
            checkoutButton: "Get My Goodies",
            emptyCartParams: "No treats yet? 🍬",
            quickAddButton: "Grab it!",
            searchPlaceholder: "Find your cravings...",
            startsFrom: "Treats from",
        }
    },
    // 4. Urban Sneakers (Monochrome, Streetwear)
    "urbansneakers.com": {
        id: "urban-sneakers",
        name: "Urban Sneakers",
        theme: {
            colors: {
                primary: "0 0% 0%",
                primaryForeground: "0 0% 100%",
                secondary: "0 0% 93%",
                background: "0 0% 95%",
            },
            radius: "0px",
            fontFamily: "var(--font-inter)",
            productCard: {
                backgroundColor: "white",
                radius: "0px",
                shadow: "none",
                border: "1px solid black",
            }
        },
        layout: { density: "compact", maxWidth: "1600px", gridGap: "1rem", sectionSpacing: "2rem" },
        surface: { header: "solid", footer: "dark", productCardStyle: "flat" },
        text: {
            checkoutButton: "COP NOW",
            emptyCartParams: "Cart is empty.",
            quickAddButton: "ADD +",
            searchPlaceholder: "SEARCH DROPS",
            startsFrom: "MIN:",
        }
    },
    // 5. Royal Gold (Luxury, Serif)
    "royalgold.jewelry": {
        id: "royal-gold",
        name: "Royal Gold",
        theme: {
            colors: {
                primary: "45 90% 45%",
                primaryForeground: "0 0% 100%",
                secondary: "45 20% 90%",
                background: "40 20% 97%",
            },
            radius: "2px",
            fontFamily: "var(--font-playfair)",
            productCard: {
                backgroundColor: "white",
                radius: "2px",
                shadow: "0 20px 25px -5px rgb(0 0 0 / 0.05)",
                border: "none",
            }
        },
        layout: { density: "luxury", maxWidth: "1100px", gridGap: "3rem", sectionSpacing: "6rem" },
        motion: { duration: "600ms", easing: "ease-out", cardHover: "translateY(-2px)", buttonTap: "scale(0.99)", pageEnter: "fade-in" },
        features: { enableWishlist: true, enableratings: false, showStockCount: false },
        text: {
            checkoutButton: "Request Consultation",
            emptyCartParams: "Your selection is empty.",
            quickAddButton: "Select",
            searchPlaceholder: "Search collection...",
            startsFrom: "Beginning at",
        }
    },
    // 6. Spicy Bites (Red, Food)
    "spicybites.food": {
        id: "spicy-bites",
        name: "Spicy Bites",
        theme: {
            colors: {
                primary: "10 80% 50%",
                primaryForeground: "0 0% 100%",
                secondary: "20 50% 96%",
                background: "15 30% 98%",
            },
            radius: "0.75rem",
            fontFamily: "var(--font-poppins)",
            productCard: {
                backgroundColor: "white",
                radius: "1rem",
                shadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                border: "none",
            }
        },
        text: {
            checkoutButton: "Order Now",
            emptyCartParams: "Hungry? Add something tasty!",
            quickAddButton: "Add +",
            searchPlaceholder: "Search menu...",
            startsFrom: "From",
        }
    },
    // 7. Ocean Blue (Calm, Water)
    "oceanblue.water": {
        id: "ocean-blue",
        name: "Ocean Blue",
        theme: {
            colors: {
                primary: "200 90% 40%",
                primaryForeground: "0 0% 100%",
                secondary: "200 50% 96%",
                background: "200 30% 96%",
            },
            radius: "1.2rem",
            fontFamily: "var(--font-poppins)",
            productCard: {
                backgroundColor: "white",
                radius: "1.2rem",
                shadow: "0 4px 6px -1px rgb(56 189 248 / 0.2)",
                border: "1px solid rgb(56 189 248 / 0.2)",
            }
        },
        text: {
            checkoutButton: "Get Hydrated",
            emptyCartParams: "Please add items.",
            quickAddButton: "Add",
            searchPlaceholder: "Search catalog...",
            startsFrom: "From",
        }
    },
    // 8. Minimalist Home (Gray, Clean)
    "minimalhome.decor": {
        id: "minimal-home",
        name: "Minimal Home",
        theme: {
            colors: {
                primary: "0 0% 40%",
                primaryForeground: "0 0% 100%",
                secondary: "0 0% 95%",
                background: "0 0% 98%",
            },
            radius: "4px",
            fontFamily: "var(--font-inter)",
            productCard: {
                backgroundColor: "#ffffff",
                radius: "4px",
                shadow: "none",
                border: "none",
            }
        },
        layout: { density: "luxury", maxWidth: "1400px", gridGap: "4rem", sectionSpacing: "4rem" },
        text: {
            checkoutButton: "Purchase",
            emptyCartParams: "Space available.",
            quickAddButton: "Add",
            searchPlaceholder: "Search...",
            startsFrom: "Start:",
        }
    },
    // 9. Kids Zone (Purple/Yellow, Fun)
    "kidzone.toys": {
        id: "kid-zone",
        name: "Kid Zone",
        theme: {
            colors: {
                primary: "270 90% 60%",
                primaryForeground: "0 0% 100%",
                secondary: "50 90% 60%",
                background: "50 100% 96%",
            },
            radius: "1.5rem",
            fontFamily: "var(--font-poppins)",
            productCard: {
                backgroundColor: "white",
                radius: "2rem",
                shadow: "4px 4px 0px 0px #FCD34D",
                border: "2px solid #FCD34D",
            }
        },
        motion: { // Playful
            cardHover: "rotate(2deg) scale(1.05)",
            buttonTap: "scale(0.9) rotate(-2deg)",
            duration: "300ms",
            easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", // Springy
            pageEnter: "zoom-in"
        },
        text: {
            checkoutButton: "Let's Play!",
            emptyCartParams: "Toy box is empty!",
            quickAddButton: "I want this!",
            searchPlaceholder: "Search for toys...",
            startsFrom: "Just",
        }
    },
    // 10. Classic Books (Brown, Serif)
    "classicbooks.read": {
        id: "classic-books",
        name: "Classic Books",
        theme: {
            colors: {
                primary: "25 30% 30%",
                primaryForeground: "0 0% 100%",
                secondary: "35 30% 90%",
                background: "35 25% 94%",
            },
            radius: "4px",
            fontFamily: "var(--font-playfair)",
            productCard: {
                backgroundColor: "#fffdf5",
                radius: "2px",
                shadow: "0 2px 4px rgb(0 0 0 / 0.1)",
                border: "1px solid #e5e5e5",
            }
        },
        typography: {
            heading: { weight: "600", letterSpacing: "0", transform: "none" },
            productName: { weight: "700", letterSpacing: "0" }, // Bold titles
            price: { weight: "400", tracking: "normal" }, // Subtle price
            button: { uppercase: true, weight: "500" }
        },
        text: {
            checkoutButton: "Checkout",
            emptyCartParams: "Your reading list is empty.",
            quickAddButton: "Add to Shelf",
            searchPlaceholder: "Search titles...",
            startsFrom: "Price:",
        }
    },

    // Existing Clients
    "sandhyacollections": {
        id: "sandhyacollections",
        name: "Sandhya Collections",
        theme: {
            colors: {
                primary: "180 80% 35%",
                primaryForeground: "210 40% 98%",
                secondary: "210 20% 94%",
                background: "210 20% 98%",
            },
            radius: "0.5rem",
            fontFamily: "var(--font-poppins)",
            productCard: {
                backgroundColor: "hsl(var(--card))",
                radius: "1.5rem",
                shadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                border: "1px solid hsl(var(--border) / 0.5)",
            }
        },
        text: {
            checkoutButton: "Checkout securely",
            emptyCartParams: "Discover our best sellers!",
            quickAddButton: "Quick Add",
            searchPlaceholder: "Search products, brands, and more...",
            startsFrom: "Starts from",
        }
    },
    // 12. Localhost
    "localhost:3000": {
    },
};

export function resolveTenantConfig(domain: string): TenantConfig {
    const specificConfig = TENANT_MAP[domain] || {};

    const baseTheme = {
        ...DEFAULT_CONFIG.theme,
        ...(specificConfig.theme || {}),
        colors: {
            ...DEFAULT_CONFIG.theme.colors,
            ...(specificConfig.theme?.colors || {}),
        },
        productCard: {
            ...DEFAULT_CONFIG.theme.productCard!,
            ...(specificConfig.theme?.productCard || {}),
        }
    };

    // Recursive merge for deep objects (simplified for now, assuming 1-level deep overrides or replace)
    // For advanced properties, spreading is usually safer for granular overrides if implemented deeply.
    // For now, simple spread works if tenants provide full objects or we accept replacing the whole block.
    // To allow partial overrides, we should do:

    const resolveMotion = { ...DEFAULT_CONFIG.motion, ...(specificConfig.motion || {}) } as TenantMotion;
    const resolveTypography = {
        ...DEFAULT_CONFIG.typography, ...specificConfig.typography,
        heading: { ...DEFAULT_CONFIG.typography?.heading, ...specificConfig.typography?.heading },
        productName: { ...DEFAULT_CONFIG.typography?.productName, ...specificConfig.typography?.productName },
        price: { ...DEFAULT_CONFIG.typography?.price, ...specificConfig.typography?.price },
        button: { ...DEFAULT_CONFIG.typography?.button, ...specificConfig.typography?.button },
    } as TenantTypography;

    const resolveLayout = { ...DEFAULT_CONFIG.layout, ...(specificConfig.layout || {}) } as TenantLayout;
    const resolveSurface = { ...DEFAULT_CONFIG.surface, ...(specificConfig.surface || {}) } as TenantSurface;
    const resolveBrandTone = { ...DEFAULT_CONFIG.brandTone, ...(specificConfig.brandTone || {}) } as TenantBrandTone;


    return {
        ...DEFAULT_CONFIG,
        ...specificConfig,
        domain, // Inject the resolved domain
        theme: baseTheme,
        motion: resolveMotion,
        typography: resolveTypography,
        layout: resolveLayout,
        surface: resolveSurface,
        brandTone: resolveBrandTone,

        features: {
            ...DEFAULT_CONFIG.features,
            ...(specificConfig.features || {}),
        },
        text: {
            ...DEFAULT_CONFIG.text,
            ...(specificConfig.text || {}),
        }
    };
}
