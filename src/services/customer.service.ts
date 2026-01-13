import { apiClient } from './api-client';
import { CustomerDetails, UpdateCustomerRequest, CustomerAddress } from '@/lib/api-types';

export const customerService = {
    getCustomerDetails: async (forceRefresh = false) => {
        let customerId = '';
        if (typeof window !== 'undefined') {
            customerId = localStorage.getItem('customerId') || '';
        }

        return apiClient<CustomerDetails>('/customer/get-customer-and-address', {
            // Cache for 10 hours (36000s) by default, unless forceRefresh is true
            ...(forceRefresh
                ? { cache: 'no-store' }
                : { next: { revalidate: 36000 } }
            ),
            params: { customerId }
        });
    },

    updateCustomer: async (data: UpdateCustomerRequest) => {
        return apiClient<CustomerDetails>('/customer/update', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    createAddress: async (data: Partial<CustomerAddress>) => {
        return apiClient<CustomerAddress>('/customer/address/create', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateAddress: async (data: CustomerAddress) => {
        return apiClient<CustomerAddress>('/customer/address/update', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
};
