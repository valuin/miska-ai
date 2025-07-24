import type { NextRequest } from 'next/server';
import { GOOGLE_SLUGS } from '@/lib/db/queries/db';

const scopeMap = {
  [GOOGLE_SLUGS.gmail]: 'https://mail.google.com/',
  [GOOGLE_SLUGS.drive]: 'https://www.googleapis.com/auth/drive',
  [GOOGLE_SLUGS.sheets]: 'https://www.googleapis.com/auth/spreadsheets',
  [GOOGLE_SLUGS.docs]: 'https://www.googleapis.com/auth/documents',
  [GOOGLE_SLUGS.slides]: 'https://www.googleapis.com/auth/presentations',
  [GOOGLE_SLUGS.calendar]: 'https://www.googleapis.com/auth/calendar',
};

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const callback_scope = searchParams.get('scope');

  const redirect_uri = process.env.GOOGLE_INTEGRATION_REDIRECT_URI;
  const client_id = process.env.GOOGLE_INTEGRATION_CLIENT_ID;

  if (!redirect_uri || !client_id) {
    return Response.json(
      { error: 'Missing environment variables' },
      { status: 500 },
    );
  }

  const auth_scope = callback_scope
    ? scopeMap[callback_scope as keyof typeof scopeMap]
    : '';

  if (!auth_scope) {
    return Response.json({ error: 'Invalid scope' }, { status: 400 });
  }

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  const redirect_uri_with_scope = `${redirect_uri}?q=${callback_scope}`;

  url.searchParams.set('client_id', client_id);
  url.searchParams.set('redirect_uri', redirect_uri_with_scope);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('scope', auth_scope);
  url.searchParams.set('prompt', 'consent');

  return Response.redirect(url.toString());
}
