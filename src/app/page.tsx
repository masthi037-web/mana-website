import { headers } from 'next/headers';
import HomeClient from '@/components/home/HomeClient';

export default async function Home() {
  const headersList = await headers();
  // Middleware handles extraction and localhost fallback
  const headerDomain = headersList.get("x-company-domain");
  // FORCE HARDCODED FOR DEBUGGING IF NEEDED
  const companyDomain = (headerDomain && headerDomain !== 'localhost') ? headerDomain : 'babaihomefoods';

  // Client Component handles fetching to support Role-Based blocking
  return (
    <HomeClient companyDomain={companyDomain} />
  );
}
