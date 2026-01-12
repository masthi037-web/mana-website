"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
            <h2 className="text-2xl font-bold font-headline">Something went wrong!</h2>
            <p className="text-muted-foreground">
                We apologize for the inconvenience. Please try again later.
            </p>
            <Button onClick={() => reset()}>Try again</Button>
        </div>
    );
}
