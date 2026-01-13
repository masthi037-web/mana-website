import { apiClient } from './api-client';
import { CustomerDetails, UpdateCustomerRequest, CustomerAddress } from '@/lib/api-types';

export const customerService = {
    getCustomerDetails: async () => {
        return apiClient<CustomerDetails>('/customer/get-customer-and-address', {
            next: { revalidate: 1200 } // 20 minutes cache
        });
    },

    updateCustomer: async (data: UpdateCustomerRequest) => {
        return apiClient<CustomerDetails>('/customer/update', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    createAddress: async (data: Omit<CustomerAddress, 'customerAddressId'> & { customerAddressId?: number }) => {
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
