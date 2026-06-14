import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

function base64URLEncode(buffer: Buffer) {
  return buffer.toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export async function GET(request: Request) {
  const clientId = process.env.CANVA_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_CANVA_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Canva Client ID or Redirect URI not configured." },
      { status: 500 }
    );
  }

  // Get state and eventId from query params to pass back after oauth
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  
  // Generate PKCE code verifier and challenge
  const codeVerifier = base64URLEncode(crypto.randomBytes(32));
  const codeChallenge = base64URLEncode(
    crypto.createHash("sha256").update(codeVerifier).digest()
  );

  // Generate random state
  const state = base64URLEncode(crypto.randomBytes(16));
  
  // Store the state with the eventId so we know where to redirect back to
  const stateData = JSON.stringify({ state, eventId });

  // Store verifier and state in cookies
  const cookieStore = await cookies();
  cookieStore.set("canva_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });
  cookieStore.set("canva_oauth_state", stateData, {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  const scopes = [
    "design:content:read",
    "design:meta:read",
  ].join(" ");

  const authorizationUrl = new URL("https://www.canva.com/api/oauth/authorize");
  authorizationUrl.searchParams.set("code_challenge", codeChallenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");
  authorizationUrl.searchParams.set("scope", scopes);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("state", state);

  return NextResponse.redirect(authorizationUrl.toString());
}
