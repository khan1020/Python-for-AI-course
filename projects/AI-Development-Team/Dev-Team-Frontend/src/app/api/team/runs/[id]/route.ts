import { forward, isRunId } from "@/lib/backend";

export const runtime = "nodejs";

export async function GET(_request: Request, ctx: RouteContext<"/api/team/runs/[id]">) {
  const { id } = await ctx.params;
  if (!isRunId(id)) return Response.json({ error: "A run ID looks like 1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed." }, { status: 400 });
  return forward(`api/team/runs/${id}`);
}
