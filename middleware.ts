import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Rotas públicas que NÃO precisam de autenticação Clerk
const isPublicRoute = createRouteMatcher([
    '/',                          // Landing page
    '/api/webhooks/(.*)',         // Webhooks do Asaas
    '/api/admin/users',          // Admin API usa seu próprio sistema de auth (x-admin-email header)
    '/api/coupon',               // Cupons são validados via email no body
    '/driver/(.*)',              // App do motorista
    '/motoristas/(.*)',          // App do motorista
]);

export default clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Roda em todas as rotas exceto arquivos estáticos e _next
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
