import { headers } from 'next/headers';
import Image from 'next/image';
import { fetchCategories } from '@/services/product.service';
import HomeClient from '@/components/home/HomeClient';

export default async function Home() {
  const headersList = await headers();
  const host = headersList.get("host");
  let companyName = host?.split(".")[0];

  // Optional: Fallback for localhost testing if not set or is 'localhost'
  if (!companyName || companyName === 'localhost') {
    companyName = 'babaihomefoods';
  }

  const categories = await fetchCategories(companyName);

  return (
    <div>
      <section className="relative h-64 md:h-80 w-full">
        <Image
          src="https://picsum.photos/seed/homepage-banner/1280/400"
          alt="Promotional banner"
          fill
          className="object-cover"
          data-ai-hint="vibrant spices"
          priority
        />
        <div className="absolute inset-0 bg-black/30 flex flex-col justify-center items-center text-white text-center p-4">
          <h1 className="text-4xl md:text-6xl font-bold font-headline">Artisanal Goods</h1>
          <p className="mt-2 text-lg md:text-xl">Handcrafted with passion and tradition</p>
        </div>
      </section>

      <HomeClient initialCategories={categories} />
    </div>
  );
}
