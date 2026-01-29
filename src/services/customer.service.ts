import { apiClient } from './api-client';
import { CustomerDetails, UpdateCustomerRequest, CustomerAddress } from '@/lib/api-types';

const CACHE_KEY = 'customer_details_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const getCustomerDetails = async (forceRefresh = false) => {
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
};

const updateCustomer = async (data: UpdateCustomerRequest) => {
    const response = await apiClient<CustomerDetails>('/customer/update', {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    // Re-fetch to update cache
    await getCustomerDetails(true);
    return response;
};

const createAddress = async (data: Partial<CustomerAddress>) => {
    return apiClient<CustomerAddress>('/customer/address/create', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

const updateAddress = async (data: CustomerAddress) => {
    return apiClient<CustomerAddress>('/customer/address/update', {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

export const customerService = {
    getCustomerDetails,
    updateCustomer,
    createAddress,
    updateAddress
};
