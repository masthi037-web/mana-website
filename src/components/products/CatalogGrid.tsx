
'use client';

import type { Catalog } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface CatalogGridProps {
  catalogs: Catalog[];
  selectedCatalogId: string | null;
  onSelectCatalog: (catalogId: string) => void;
}

const imageMap = new Map(PlaceHolderImages.map(img => [img.id, img]));

export default function CatalogGrid({ catalogs, selectedCatalogId, onSelectCatalog }: CatalogGridProps) {
  return (
    <div className="w-full">
      {/* Mobile/Tablet Scroll View */}
      <div className="md:hidden">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-6 pb-4 px-4">
            {catalogs.map((catalog) => (
              <CatalogItem
                key={catalog.id}
                catalog={catalog}
                imageMap={imageMap}
                selectedCatalogId={selectedCatalogId}
                onSelectCatalog={onSelectCatalog}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Desktop Grid/Centered View */}
      <div className="hidden md:flex flex-wrap justify-center gap-8 pb-4">
        {catalogs.map((catalog) => (
          <CatalogItem
            key={catalog.id}
            catalog={catalog}
            imageMap={imageMap}
            selectedCatalogId={selectedCatalogId}
            onSelectCatalog={onSelectCatalog}
          />
        ))}
      </div>
    </div>
  );
}

// Extracted for reuse
function CatalogItem({ catalog, imageMap, selectedCatalogId, onSelectCatalog }: {
  catalog: Catalog;
  imageMap: Map<string, any>;
  selectedCatalogId: string | null;
  onSelectCatalog: (id: string) => void;
}) {
  const firstProductImageId = catalog.products[0]?.imageId;
  const image = firstProductImageId ? imageMap.get(firstProductImageId) : undefined;
  const isSelected = catalog.id === selectedCatalogId;

  return (
    <button
      onClick={() => onSelectCatalog(catalog.id)}
      className={cn(
        "flex flex-col items-center justify-start gap-3 text-center transition-all group focus:outline-none",
        "w-28 sm:w-32"
      )}
    >
      <div className={cn(
        "relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-lg border-4 border-white group-hover:scale-105 group-hover:shadow-xl transition-all duration-300",
        isSelected ? "border-primary" : "border-transparent"
      )}>
        <Image
          src={image?.imageUrl || `https://picsum.photos/seed/${catalog.id}/300/300`}
          alt={catalog.name}
          fill
          className="object-cover"
          data-ai-hint={image?.imageHint || 'product category'}
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
      </div>
      <span className={cn(
        "font-semibold text-foreground text-sm sm:text-base -mt-1",
        isSelected && "text-primary"
      )}>
        {catalog.name}
      </span>
    </button>
  );
}
