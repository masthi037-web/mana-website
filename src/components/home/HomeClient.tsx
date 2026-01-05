"use client";

import { useState } from 'react';
import Recommendations from '@/components/products/Recommendations';
import type { Catalog, ProductWithImage, Category } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import CatalogGrid from '@/components/products/CatalogGrid';
import { ProductGrid } from '@/components/products/ProductGrid';

interface HomeClientProps {
    initialCategories: Category[];
}

export default function HomeClient({ initialCategories }: HomeClientProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>(
        initialCategories.length > 0 ? initialCategories[0].id : ""
    );

    // Initialize catalog ID based on the verified categories prop
    const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(
        initialCategories.length > 0 && initialCategories[0].catalogs.length > 0
            ? initialCategories[0].catalogs[0].id
            : null
    );

    const activeCategory = initialCategories.find(c => c.id === selectedCategory);
    const catalogs: Catalog[] = activeCategory ? activeCategory.catalogs : [];

    const handleSelectCatalog = (catalogId: string) => {
        setSelectedCatalogId(catalogId);
    };

    const selectedCatalog = catalogs.find(c => c.id === selectedCatalogId);
    const imageMap = new Map(PlaceHolderImages.map(img => [img.id, img]));

    const products: ProductWithImage[] = selectedCatalog
        ? selectedCatalog.products.map(p => {
            // Since the API provides an ID (e.g. "1001") as imageId, we generate a placeholder URL.
            const image = imageMap.get(p.imageId);
            return {
                ...p,
                imageHint: image?.imageHint || 'product image',
                imageUrl: `https://picsum.photos/seed/${p.id}/300/300`
            }
        })
        : [];

    return (
        <div className="container mx-auto px-4 py-8">
            <section className="mb-12">
                {initialCategories.length > 0 ? (
                    <>
                        <div className="flex items-center justify-center mb-8 overflow-x-auto pb-2 -mx-4 px-4">
                            <div className="flex space-x-2 sm:space-x-4">
                                {initialCategories.map(category => (
                                    <Button
                                        key={category.id}
                                        variant="ghost"
                                        onClick={() => {
                                            setSelectedCategory(category.id);
                                            setSelectedCatalogId(initialCategories.find(c => c.id === category.id)?.catalogs[0]?.id || null);
                                        }}
                                        className={cn(
                                            "rounded-full px-4 py-2 text-sm sm:text-base font-medium transition-colors shrink-0",
                                            selectedCategory === category.id
                                                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                        )}
                                    >
                                        {category.name}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="font-headline text-2xl md:text-3xl font-bold text-foreground">
                                    {activeCategory?.name} Catalogs
                                </h2>
                                {catalogs.length > 5 && (
                                    <Button variant="link" className="text-primary hidden sm:inline-flex">See All</Button>
                                )}
                            </div>
                            <CatalogGrid
                                catalogs={catalogs}
                                selectedCatalogId={selectedCatalogId}
                                onSelectCatalog={handleSelectCatalog}
                            />
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20 text-muted-foreground">
                        No categories found.
                    </div>
                )}

                {selectedCatalog && (
                    <div className="mt-12">
                        <h3 className="font-headline text-2xl md:text-3xl font-bold text-foreground mb-6">
                            {selectedCatalog.name}
                        </h3>
                        <ProductGrid products={products} />
                    </div>
                )}
            </section>

            <section>
                <h2 className="font-headline text-3xl md:text-4xl font-bold mb-6 text-center text-foreground">
                    Recommended For You
                </h2>
                <Recommendations />
            </section>
        </div>
    );
}
