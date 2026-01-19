import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const hostHeader = request.headers.get('host') || '';
    console.log("HOST :- " + hostHeader);

    // Remove port if present (e.g. localhost:3000 -> localhost)
    const hostname = hostHeader.split(':')[0];
    console.log("HOSTNAME :- " + hostname);

    // Extract subdomain (tenant)
    // Example: babaihomefoods.mana.com -> babaihomefoods
    // Example: localhost -> localhost
    let companyDomain = hostname.split('.')[0];
    console.log("COMPANY DOMAIN :- " + companyDomain);

    // Localhost fallback for development
    if (companyDomain === 'localhost' || companyDomain.match('mashallah')) {
        companyDomain = 'babaihomefoods';
    }
    else if (companyDomain.match('mana-website-toone')) {
        companyDomain = 'bavahomefoods';
    }
    // Clone the request headers and set the company domain
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-company-domain', companyDomain);

    // Return response with modified headers
    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
