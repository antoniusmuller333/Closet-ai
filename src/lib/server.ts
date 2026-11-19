import "server-only";

export const MODEL = process.env.AI_MODEL || "google/gemini-3-flash";

/** If APP_PASSCODE is set on the server, every API call must carry it. */
export function checkPasscode(req: Request): Response | null {
  const required = process.env.APP_PASSCODE;
  if (!required) return null;
  if (req.headers.get("x-app-passcode") === required) return null;
  return Response.json({ error: "Wrong or missing passcode. Add it under Settings." }, { status: 401 });
}

export function errorResponse(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(err);
  const auth = /oidc|api key|unauthori[sz]ed|authentication/i.test(msg);
  return Response.json(
    {
      error: auth
        ? "The AI service isn't connected. Deploy on Vercel (uses AI Gateway automatically) or set AI_GATEWAY_API_KEY."
        : "The stylist hit a snag. Try again in a moment.",
      detail: msg.slice(0, 300),
    },
    { status: auth ? 503 : 500 },
  );
}
