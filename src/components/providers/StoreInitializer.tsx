"use client";

import { useCart } from "@/hooks/use-cart";
import { CompanyDetails } from "@/lib/api-types";
import { useRef } from "react";

export function StoreInitializer({ companyDetails }: { companyDetails: CompanyDetails }) {
    const initialized = useRef(false);

    if (!initialized.current) {
        useCart.setState({ companyDetails });
        initialized.current = true;
    }

    return null;
}
