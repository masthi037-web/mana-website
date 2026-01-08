import { ShieldCheck, Truck, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureItem {
    id: number;
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    iconColor: string;
}

const features: FeatureItem[] = [
    {
        id: 1,
        title: "100% Authentic",
        description: "Original recipes & ingredients",
        icon: ShieldCheck,
        color: "text-teal-600",
        bgColor: "bg-teal-50",
        iconColor: "text-teal-600"
    },
    {
        id: 2,
        title: "Fast Delivery",
        description: "Fresh to your door.",
        icon: Truck,
        color: "text-green-600",
        bgColor: "bg-green-50",
        iconColor: "text-green-600"
    },
    {
        id: 3,
        title: "Premium Quality",
        description: "Hand-picked by experts",
        icon: Star,
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        iconColor: "text-amber-600"
    }
];

export function FeaturesCarousel() {
    // Duplicate the items to create a seamless loop
    const carouselItems = [...features, ...features, ...features, ...features];

    return (
        <div className="w-full overflow-hidden bg-background py-8 border-b border-border/40">
            <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
                <div className="animate-marquee flex items-center justify-center md:justify-start [&_li]:mx-4 [&_img]:max-w-none">
                    {carouselItems.map((item, index) => (
                        <div
                            key={`${item.id}-${index}`}
                            className="flex items-center gap-4 bg-card border border-border/50 rounded-2xl p-4 min-w-[280px] shadow-sm mx-3"
                        >
                            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", item.bgColor)}>
                                <item.icon className={cn("w-6 h-6", item.iconColor)} />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground leading-tight">{item.title}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
