'use server';

import { Category as AppCategory } from '@/lib/types';
import { Category as ApiCategory } from '@/lib/api-types';
import { mapApiCategoriesToAppCategories } from '@/services/mappers';
import { API_BASE_URL } from '@/services/api-client';

export async function fetchProductsByCategoryAction(categoryId: string, deliveryTime?: string): Promise<AppCategory | null> {
    const catIdStr = String(categoryId);
    // Defensive check
    if (!catIdStr || catIdStr === 'undefined' || catIdStr === 'null') return null;

    console.log(`[ProductAction] Server Action Fetching products for category (${catIdStr}) from: /company/public/get-products-by-category/get`);

    // Construct URL with params manually since we are using native fetch
    const url = new URL(`${API_BASE_URL}/company/public/get-products-by-category/get`);
    url.searchParams.append('categoryId', catIdStr);

    try {
        const res = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            next: {
                revalidate: 420,
                tags: [`category-${catIdStr}`]
            },
            cache: 'force-cache'
        });

        if (!res.ok) {
            console.error(`[ProductAction] API Error ${res.status} for category ${catIdStr}`);
            return null;
        }

        const catData = await res.json() as ApiCategory;

        console.log(`[ProductAction] Valid data received for ${catIdStr}`);

        const mappedCats = mapApiCategoriesToAppCategories(Array.isArray(catData) ? catData : [catData], deliveryTime);
        return mappedCats[0] || null;

    } catch (e) {
        console.error(`[ProductAction] Failed to fetch category ${catIdStr}`, e);
        return null;
    }
}
