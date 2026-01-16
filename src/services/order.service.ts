import { apiClient } from './api-client';
import { PaymentInitializationRequest, PaymentInitializationResponse } from '@/lib/api-types';

export const orderService = {
    initializePayment: async (data: PaymentInitializationRequest, razorpayKeyId: string, razorpayKeySecret: string) => {
        return apiClient<PaymentInitializationResponse>('/order/payment-initialise', {
            method: 'POST',
            body: JSON.stringify(data),
            params: {
                razorpayKeyId,
                razorpayKeySecret
            },
            // No cache for payment initialization
            next: { revalidate: 0 }
        });
    }
};
