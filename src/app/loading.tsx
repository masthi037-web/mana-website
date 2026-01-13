export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl transition-all">
            {/* Abstract Logo / Icon */}
            <div className="relative mb-8">
                <div className="h-16 w-16 rounded-2xl bg-primary/20 animate-pulse flex items-center justify-center">
                    {/* Inner Icon */}
                    <div className="h-8 w-8 rounded-lg bg-primary animate-bounce shadow-lg shadow-primary/50" />
                </div>
                {/* Ripple Effect */}
                <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 animate-ping opacity-20" />
            </div>

            {/* Text */}
            <div className="flex flex-col items-center gap-2">
                <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground">
                    ShopSphere
                </h1>
                <p className="text-sm font-medium text-muted-foreground animate-pulse">
                    Curating your experience...
                </p>
            </div>

            {/* Progress Line */}
            <div className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-full bg-primary origin-left animate-[progress_1.5s_ease-in-out_infinite]" />
            </div>
        </div>
    );
}
