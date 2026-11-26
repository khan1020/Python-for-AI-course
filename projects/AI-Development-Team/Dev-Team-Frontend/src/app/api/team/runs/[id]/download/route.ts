import { forward, isRunId } from "@/lib/backend";

export const runtime = "nodejs";

// Same-origin, so a plain <a href download> works: the API key is added on the server.
export async function GET(_request: Request, ctx: RouteContext<"/api/team/runs/[id]/download">) {
  const { id } = await ctx.params;
  if (!isRunId(id)) return Response.json({ error: "Invalid run ID." }, { status: 400 });
  return forward(`api/team/runs/${id}/download`, undefined, { raw: true });
}
