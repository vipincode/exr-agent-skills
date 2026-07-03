import { env } from "@/lib/env";
// BFF proxy — the browser only ever calls same-origin /api/*; this forwards to the backend.
async function handler(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = `${env.BACKEND_URL}/${path.join("/")}`;
  const res = await fetch(url, { method: req.method, headers: req.headers, body: req.body });
  return new Response(res.body, { status: res.status });
}
export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
