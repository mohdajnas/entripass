import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    console.error("Canva OAuth error:", error);
    return NextResponse.json({ error: "Authorization failed" }, { status: 400 });
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const stateDataStr = cookieStore.get("canva_oauth_state")?.value;
  const codeVerifier = cookieStore.get("canva_code_verifier")?.value;

  if (!stateDataStr || !codeVerifier) {
    return NextResponse.json({ error: "Session expired or invalid" }, { status: 400 });
  }

  const stateData = JSON.parse(stateDataStr);
  if (stateData.state !== state) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  const clientId = process.env.CANVA_CLIENT_ID!;
  const clientSecret = process.env.CANVA_CLIENT_SECRET!;
  const redirectUri = process.env.NEXT_PUBLIC_CANVA_REDIRECT_URI!;

  // Basic auth header for token exchange
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code_verifier: codeVerifier,
    code: code,
    client_id: clientId,
    redirect_uri: redirectUri,
  });

  try {
    const response = await fetch("https://api.canva.com/rest/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Failed to exchange token:", data);
      return NextResponse.json({ error: "Token exchange failed" }, { status: response.status });
    }

    // Securely store the access token in an HttpOnly cookie
    cookieStore.set("canva_access_token", data.access_token, {
      httpOnly: true,
      secure: true,
      maxAge: data.expires_in || 3600, // Typically 1 hour
      path: "/",
    });

    // If there is a refresh token, store it as well
    if (data.refresh_token) {
      cookieStore.set("canva_refresh_token", data.refresh_token, {
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
    }

    // Clean up
    cookieStore.delete("canva_code_verifier");
    cookieStore.delete("canva_oauth_state");

    // Redirect back to the event tickets page
    const eventId = stateData.eventId;
    if (eventId) {
      return NextResponse.redirect(new URL(`/dashboard/events/${eventId}/tickets`, request.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } catch (error) {
    console.error("Token exchange network error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
