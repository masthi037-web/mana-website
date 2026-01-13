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


    const startTime = performance.now();
    let res: Response;
    try {
        res = await fetch(url.toString(), {
            credentials: "include", // 🔥 REQUIRED for cookies
            // cache: fetchOptions.next?.revalidate ? "force-cache" : "no-store", // Let Next.js decide based on 'next' prop
            ...fetchOptions,
            headers: {
                "Content-Type": "application/json",
                ...fetchOptions.headers,
            },
        });
    } catch (error: any) {
        console.error(`[API FATAL] Network Error at ${endpoint}:`, error?.cause || error);
        throw error;
    }
    const duration = performance.now() - startTime;
    console.log(`[API LATENCY] ${endpoint}: ${duration.toFixed(2)}ms`);

    // ✅ 401 interception (Token Refresh)
    if (res.status === 401 && !_retry) {
        if (!isRefreshing) {
            isRefreshing = true;
            // Corrected URL: Use API_BASE_URL + /auth/refresh
            // API_BASE_URL already contains /rurify-services, so we just append /auth/refresh
            refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
                method: "POST",
                credentials: "include",
            }).then((refreshRes) => {
                if (!refreshRes.ok) {
                    throw new Error("Refresh failed");
                }
            }).finally(() => {
                isRefreshing = false;
                refreshPromise = null;
            });
        }

        try {
            await refreshPromise;
            return apiClient<T>(endpoint, { ...options, _retry: true });
        } catch {
            // Refresh failed → force logout
            if (typeof window !== 'undefined') {
                window.location.href = "/login";
            }
            throw new Error("Session expired");
        }
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
