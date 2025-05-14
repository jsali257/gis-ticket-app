import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the user is trying to access a protected route
  const isProtectedRoute = 
    !pathname.startsWith('/auth') && 
    !pathname.startsWith('/api') && 
    !pathname.includes('_next') &&
    !pathname.includes('favicon.ico');
  
  // Get the session token from the request
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  // If the user is not authenticated and trying to access a protected route, redirect to login
  if (!token && isProtectedRoute) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }
  
  // Continue with the request if the user is authenticated or accessing a public route
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
