'use server';

import { Category as AppCategory } from '@/lib/types';
import { fetchProductsByCategory } from '@/services/product.service';

export async function fetchProductsByCategoryAction(categoryId: string, deliveryTime?: string): Promise<AppCategory | null> {
    const catIdStr = String(categoryId);
    // Defensive check
    if (!catIdStr || catIdStr === 'undefined' || catIdStr === 'null') return null;

    console.log(`[ProductAction] Server Action Delegating to ProductService for category (${catIdStr})`);

    try {
        return await fetchProductsByCategory(catIdStr, deliveryTime, true);
    } catch (e) {
        console.error(`[ProductAction] Failed to fetch category ${catIdStr}`, e);
        return null;
    }
}
