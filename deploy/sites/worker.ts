import handler from 'vinext/server/fetch-handler';
import { handleSearchApi, type SearchEnvironment } from '../src/argument-search/site-api';

export default {
  async fetch(request: Request, env: Cloudflare.Env & SearchEnvironment, ctx: ExecutionContext) {
    const path = new URL(request.url).pathname;
    if (path === '/' && request.method === 'GET') {
      return Response.redirect(new URL('/arguments', request.url));
    }
    if (path === '/api/arguments/search' || path === '/api/internal/evidence-snapshot') {
      try {
        return await handleSearchApi(request, env);
      } catch {
        return Response.json({ error: 'Index unavailable' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
      }
    }
    return handler.fetch(request, env, ctx);
  },
};
