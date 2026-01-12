import { apiClient } from './api-client';

export interface LoginResponse {
    message: string;
    role: string;
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

    async login(phone: string, otp: string): Promise<LoginResponse> {
        return await apiClient<LoginResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ phone, otp })
        });
    },

    async logout(): Promise<string> {
        return await apiClient<string>('/auth/logout', {
            method: 'POST'
        });
    }
};
