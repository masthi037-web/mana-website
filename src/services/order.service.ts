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
    },

    verifyPayment: async (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) => {
        return apiClient<{ status: string; orderId?: string; message?: string }>('/payments/verify', {
            method: 'POST',
            body: JSON.stringify(data),
            next: { revalidate: 0 }
        });
    },

    saveOrder: async (data: any) => {
        return apiClient('/product/order/create', {
            method: 'POST',
            body: JSON.stringify(data),
            next: { revalidate: 0 }
        });
    }
};
