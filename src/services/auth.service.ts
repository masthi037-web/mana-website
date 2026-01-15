import { apiClient } from './api-client';

export interface LoginResponse {
    role: string;
    accessToken: string; // JWT Token
    refreshToken: string; // Refresh Token
}

export const authService = {
    async sendOtp(phone: string): Promise<void> {
        // The API expects phone as a query param based on the user request:
        // /auth/send-otp?phone=8877665544
        const response = await apiClient<any>('/auth/send-otp', {
            method: 'POST',
            params: { phone }
        });
        console.log("Send OTP Response:", response);
    },

    async login(phone: string, otp: string, companyDomain: string): Promise<LoginResponse> {
        // companyDomain passed from context

        const response = await apiClient<LoginResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ phone, otp, companyDomain })
        });

        // Store Token
        if (response.accessToken && typeof window !== 'undefined') {
            localStorage.setItem('accessToken', response.accessToken);
            if (response.refreshToken) {
                localStorage.setItem('refreshToken', response.refreshToken);
            }

            // Extract and store Customer ID (sub)
            try {
                const payload = JSON.parse(atob(response.accessToken.split('.')[1]));
                if (payload.sub) {
                    localStorage.setItem('customerId', payload.sub);
                }
            } catch (e) {
                console.error("Failed to decode token for customerId", e);
            }
        }

        return response;
    },

    async logout(): Promise<string> {
        let refreshToken = '';
        if (typeof window !== 'undefined') {
            refreshToken = localStorage.getItem('refreshToken') || '';
            // Clear Tokens
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('customerId');
        }

        return await apiClient<string>('/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refreshToken })
        });
    }
};
