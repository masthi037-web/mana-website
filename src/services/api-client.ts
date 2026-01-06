export const API_BASE_URL = 'http://localhost:8080/api/v1/rurify-services';

interface ApiRequestOptions extends RequestInit {
    params?: Record<string, string>;
}

/**
 * Centralized API client wrapper for fetch.
 * Handles base URL, default headers, and standard error logging.
 */
export async function apiClient<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;

    // improved url construction
    const url = new URL(`${API_BASE_URL}${endpoint}`);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value) url.searchParams.append(key, value);
        });
    }

    console.log(`[API Client] Fetching: ${url.toString()}`);

    try {
        const res = await fetch(url.toString(), {
            // Default info, can be overridden by options
            cache: 'no-store',
            ...fetchOptions,
            headers: {
                'Content-Type': 'application/json',
                ...fetchOptions.headers,
            },
        });

        if (!res.ok) {
            // We can throw a custom error here with status code etc.
            // For now, logging and returning/throwing regular error.
            console.error(`API Error: ${res.status} ${res.statusText} at ${endpoint}`);
            throw new Error(`API Error: ${res.status} ${res.statusText}`);
        }

        // Attempt to parse JSON
        // If response is empty or not JSON, this might fail, so handling parsing errors is good practice
        // but simplified here for the current known JSON APIs.
        return (await res.json()) as T;
    } catch (error) {
        console.error(`Network or Parsing Error at ${endpoint}:`, error);
        throw error;
    }
}
