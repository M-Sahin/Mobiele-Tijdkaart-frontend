import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Haal token op uit cookies of check voor auth_token in localStorage wordt gecheckt client-side
  const token = request.cookies.get('auth_token')?.value;
  
  const { pathname } = request.nextUrl;
  
  // Public routes die zonder login toegankelijk zijn
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // Als gebruiker is ingelogd en probeert naar /login of /register te gaan, redirect naar home
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Als gebruiker niet is ingelogd en probeert naar een beveiligde route te gaan
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    // Voeg de originele URL toe als redirect parameter
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

// Configure which routes should be checked
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg).*)',
  ],
};
