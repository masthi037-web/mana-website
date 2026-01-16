import { apiClient } from './api-client';
import { PaymentInitializationRequest, PaymentInitializationResponse } from '@/lib/api-types';

export const orderService = {
    initializePayment: async (data: PaymentInitializationRequest) => {
        return apiClient<PaymentInitializationResponse>('/order/payment-initialise', {
            method: 'POST',
            body: JSON.stringify(data),
            // No cache for payment initialization
            next: { revalidate: 0 }
        });
    }
};
