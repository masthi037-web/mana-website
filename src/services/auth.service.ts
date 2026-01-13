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
        }

        return response;
    },

    async logout(): Promise<string> {
        // Clear Token
        if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
        }

        return await apiClient<string>('/auth/logout', {
            method: 'POST'
        });
    }
};
