"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function ShopNowButton() {
    const scrollToShop = (e: React.MouseEvent) => {
        e.preventDefault();
        const element = document.getElementById('shop-now');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <Button
            size="lg"
            className="rounded-full h-12 px-8 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
            onClick={scrollToShop}
        >
            Shop Now <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
    );
}
