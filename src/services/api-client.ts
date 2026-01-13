export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1/rurify-services';

interface ApiRequestOptions extends RequestInit {
    params?: Record<string, string | number | boolean>;
    _retry?: boolean;
}

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

/**
 * Centralized API client wrapper for fetch.
 * Handles base URL, default headers, and standard error logging.
 * Includes:
 * 1. Robust Token Refresh (401 interception)
 */
export async function apiClient<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
): Promise<T> {
    const { params, _retry, ...fetchOptions } = options;

    const url = new URL(`${API_BASE_URL}${endpoint}`);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value));
            }
        });
    }

    // DEBUG: Check Next.js Cache Config
    if (fetchOptions.next?.revalidate) {
        console.log(`[FETCH CONFIG] Caching is ON for ${endpoint} (Revalidate: ${fetchOptions.next.revalidate}s)`);
    } else {
        console.log(`[FETCH CONFIG] Caching is OFF for ${endpoint} (Fresh Data)`);
    }


    // TOKEN HANDLING:
    // Get token from localStorage if on client
    let token = '';
    // Skip token for auth endpoints explicitly
    const isAuthEndpoint = endpoint.startsWith('/auth/');

    if (!isAuthEndpoint && typeof window !== 'undefined') {
        token = localStorage.getItem('accessToken') || '';
        console.log(`[API] token from local storage ${token}`);
        if (!token) console.warn(`[API] No token found in localStorage for ${endpoint}`);
    }

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
    };

    if (token) {
        (headers as any)['Authorization'] = `Bearer ${token}`;
    }

    const startTime = performance.now();
    let res: Response;
    try {
        res = await fetch(url.toString(), {
            // credentials: "include", // 🔥 REMOVED: Using Bearer Token
            ...fetchOptions,
            headers,
        });
    } catch (error: any) {
        console.error(`[API FATAL] Network Error at ${endpoint}:`, error?.cause || error);
        throw error;
    }
    const duration = performance.now() - startTime;
    console.log(`[API LATENCY] ${endpoint}: ${duration.toFixed(2)}ms`);

    // ✅ 401 Handling (Simple Logout)
    if (res.status === 401 && !_retry) {
        // Clear token and redirect
        if (typeof window !== 'undefined') {
            console.warn('[Auth] Session expired, clearing token.');
            localStorage.removeItem('accessToken');
            window.location.href = "/login";
        }
        throw new Error("Session expired");
    }

    if (!res.ok) {
        console.error(`API Error: ${res.status} ${res.statusText} at ${endpoint}`);
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }

    const text = await res.text();
    try {
        // Handle empty or text responses gracefully
        return text ? (JSON.parse(text) as T) : ({} as T);
    } catch {
        // If allow text, return text, else warning
        console.warn(`[API Client] Failed to parse JSON, returning text.`);
        return text as unknown as T;
    }
}
