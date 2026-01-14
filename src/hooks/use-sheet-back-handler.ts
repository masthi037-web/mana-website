"use client";

import { useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Hook to handle browser back button on mobile when a sheet/modal is open.
 * Only activates on mobile devices.
 * 
 * @param isOpen - Boolean state indicating if the sheet is open
 * @param onOpenChange - Function to update the open state (usually setOpen)
 */
export function useSheetBackHandler(
    isOpen: boolean,
    onOpenChange: (open: boolean) => void
) {
    const isMobile = useIsMobile();

    useEffect(() => {
        // Only run on mobile
        if (!isMobile) return;

        if (isOpen) {
            // When sheet opens, push a new state to history
            // This allows the back button to "close" the sheet by popping this state
            window.history.pushState({ sheetOpen: true }, "", window.location.href);

            const handlePopState = (event: PopStateEvent) => {
                // When back button is pressed (popstate), close the sheet
                onOpenChange(false);
            };

            window.addEventListener("popstate", handlePopState);

            return () => {
                window.removeEventListener("popstate", handlePopState);
                // If the component unmounts or closes normally, we might need to cleanup the history state
                // But simply removing the listener is the main part. 
                // Note: If user closes via X button, we might be left with an extra history entry, 
                // but trying to go back programmatically here can be flaky. 
                // The standard pattern is usually sufficient: User presses back -> popstate -> close.
                // If User presses X -> normal close. History remains "forward-able" but that's okay web behavior.
                // A more aggressive cleanup would be: if (isOpen) router.back() -- but that causes loops.
            };
        }
    }, [isOpen, isMobile, onOpenChange]);
}
