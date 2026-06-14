import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("canva_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not connected to Canva" }, { status: 401 });
  }

  try {
    const response = await fetch("https://api.canva.com/rest/v1/designs", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json({ error: "Token expired" }, { status: 401 });
      }
      return NextResponse.json({ error: data.message || "Failed to fetch designs" }, { status: response.status });
    }

    return NextResponse.json({ designs: data.items });
  } catch (error) {
    console.error("Error fetching Canva designs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
