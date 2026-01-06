import { cache } from 'react';
import { apiClient } from './api-client';
import { CompanyDetails } from '@/lib/api-types';

export const fetchCompanyDetails = cache(async (companyDomain: string): Promise<CompanyDetails | null> => {
    try {
        const data = await apiClient<CompanyDetails>('/company/get', {
            params: { companyDomain }
        });
        return data;
    } catch (error) {
        console.error('Error fetching company details:', error);
        return null;
    }
});
