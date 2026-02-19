import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Bypass se proteção não estiver ativada
  if (process.env.SITE_PROTECTION_ENABLED !== 'true') {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Rotas excluídas da proteção
  if (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname === '/api/agent/scrape'
  ) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ');
    if (scheme === 'Basic' && encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
      const [user, ...passParts] = decoded.split(':');
      const pass = passParts.join(':'); // senha pode conter ':'

      const expectedUser = process.env.SITE_PROTECTION_USER ?? '';
      const expectedPass = process.env.SITE_PROTECTION_PASSWORD ?? '';

      if (user === expectedUser && pass === expectedPass) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse('Acesso Restrito', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Acesso Restrito"',
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
