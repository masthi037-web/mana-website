"use server";

import { getPersonalizedRecommendations } from "@/ai/flows/personalized-product-recommendations";
import { categories } from "@/data/products";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { Product, ProductWithImage } from "@/lib/types";

export async function getRecommendationsAction(): Promise<ProductWithImage[]> {
  try {
    // In a real app, this would come from user data
    const browsingHistory = ["ErgoComfort Chair", "Aura Headphones", "Slate Coffee Table"];

    const result = await getPersonalizedRecommendations({ browsingHistory });

    const recommendedProductNames = result.recommendedProducts;

    const allProducts: Product[] = categories.flatMap(category => 
      category.catalogs.flatMap(catalog => catalog.products)
    );

    const imageMap = new Map(PlaceHolderImages.map(img => [img.id, img]));
    const productMap = new Map(allProducts.map(p => [p.name, p]));
    
    const recommendedProducts: ProductWithImage[] = recommendedProductNames
      .map(name => {
        const product = productMap.get(name);
        if (!product) return null;
        
        const image = imageMap.get(product.imageId);
        return {
          ...product,
          imageUrl: image?.imageUrl || '',
          imageHint: image?.imageHint || 'product image',
        };
      })
      .filter((p): p is ProductWithImage => p !== null);
      
    return recommendedProducts;

  } catch (error) {
    console.error("Error getting recommendations:", error);
    return [];
  }
}
