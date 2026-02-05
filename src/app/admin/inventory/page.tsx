import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import InventoryContent from './InventoryContent';

export default function AdminInventoryPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <InventoryContent />
        </Suspense>
    );

}
