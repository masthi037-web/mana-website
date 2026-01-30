import { apiClient } from './api-client';
import { PaymentInitializationRequest, PaymentInitializationResponse, SaveOrderResponse } from '@/lib/api-types';

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
        return apiClient<SaveOrderResponse>('/order/create', {
            method: 'POST',
            body: JSON.stringify(data),
            next: { revalidate: 0 }
        });
    },

    getCustomerOrders: async (customerId: string, forceRefresh: boolean = false) => {
        const CACHE_KEY = `orders_cache_${customerId}`;
        const TIMESTAMP_KEY = `orders_timestamp_${customerId}`;
        const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours

        // 1. Try Cache (if not forced)
        if (!forceRefresh && typeof window !== 'undefined') {
            try {
                const cachedData = localStorage.getItem(CACHE_KEY);
                const cachedTime = localStorage.getItem(TIMESTAMP_KEY);

                if (cachedData && cachedTime) {
                    const age = Date.now() - parseInt(cachedTime, 10);
                    if (age < CACHE_DURATION) {
                        return JSON.parse(cachedData) as SaveOrderResponse[];
                    }
                }
            } catch (e) {
                console.error("Cache parse error", e);
            }
        }

        // 2. Fetch Fresh Data (still keeping the revalidate tag for server-side correctness just in case)
        const data = await apiClient<SaveOrderResponse[]>('/order/customer/get', {
            params: { customerId },
            next: { revalidate: 10800, tags: ['orders'] }
        });

        // 3. Save to Cache
        if (typeof window !== 'undefined' && data) {
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
        }

        return data;
    }
};
