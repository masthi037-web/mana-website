// import { getPersonalizedRecommendations } from "@/ai/flows/personalized-product-recommendations";
import { categories } from "@/data/products";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { Product, ProductWithImage } from "@/lib/types";

export async function getRecommendationsAction(): Promise<ProductWithImage[]> {
  try {
    // Fallback: Random Shuffle (No AI Key Required)
    const allProducts: Product[] = categories.flatMap(category =>
      category.catalogs.flatMap(catalog => catalog.products)
    );

    // Shuffle array
    const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 4);

    const imageMap = new Map(PlaceHolderImages.map(img => [img.id, img]));

    const recommendedProducts: ProductWithImage[] = selected
      .map(product => {
        const image = imageMap.get(product.imageId);
        return {
          ...product,
          imageUrl: image?.imageUrl || '',
          imageHint: image?.imageHint || 'product image',
        };
      })
      .filter((p): p is ProductWithImage => !!p);

    return recommendedProducts;

  } catch (error) {
    console.error("Error getting recommendations:", error);
    return [];
  }
}
