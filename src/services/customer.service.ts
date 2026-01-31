import { apiClient } from './api-client';
import { CustomerDetails, UpdateCustomerRequest, CustomerAddress } from '@/lib/api-types';

const CACHE_KEY = 'customer_details_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 60 minutes

export const customerService = {
    async getCustomerDetails(forceRefresh = false) {
        let customerId = '';
        if (typeof window !== 'undefined') {
            customerId = localStorage.getItem('customerId') || '';
        }

        if (!customerId) return null;

        if (!forceRefresh) {
            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const { timestamp, data, id } = JSON.parse(cached);
                    const isValid = (Date.now() - timestamp < CACHE_DURATION) && (id === customerId);
                    if (isValid) {
                        console.log('[CACHE HIT] Serving customer details from cache');
                        return data;
                    }
                }
            } catch (e) {
                console.warn('Failed to parse customer cache', e);
            }
        }

        console.log('[CACHE MISS] Fetching fresh customer details');
        const data = await apiClient<CustomerDetails>('/customer/get-customer-and-address', {
            params: { customerId }
        });

        if (typeof window !== 'undefined' && data) {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data,
                id: customerId
            }));
        }
        return data;
    },

    async updateCustomer(data: UpdateCustomerRequest) {
        const response = await apiClient<CustomerDetails>('/customer/update', {
            method: 'PUT',
            body: JSON.stringify(data),
        });

        if (response && typeof window !== 'undefined') {
            const customerId = localStorage.getItem('customerId') || '';
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: response,
                id: customerId
            }));
        }

        return response;
    },

    async createAddress(data: Partial<CustomerAddress>) {
        return apiClient<CustomerAddress>('/customer/address/create', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateAddress(data: CustomerAddress) {
        return apiClient<CustomerAddress>('/customer/address/update', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
};
