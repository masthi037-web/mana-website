import { cache } from 'react';
import { apiClient } from './api-client';
import { CompanyDetails } from '@/lib/api-types';

export const fetchCompanyDetails = cache(async (companyDomain: string): Promise<CompanyDetails | null> => {
    try {
        const data = await apiClient<CompanyDetails>('/company/public/get', {
            params: { companyDomain },
            next: { revalidate: 300, tags: ['company'] } // 15 minutes cache
        });
        console.log(data.freeDeliveryCost + " cost");
        return data;
    } catch (error) {
        console.error('Error fetching company details:', error);
        return null;
    }
});
