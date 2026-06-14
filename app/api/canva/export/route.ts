import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Trigger an export job
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("canva_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not connected to Canva" }, { status: 401 });
  }

  try {
    const { designId } = await request.json();

    if (!designId) {
      return NextResponse.json({ error: "Design ID is required" }, { status: 400 });
    }

    const response = await fetch("https://api.canva.com/rest/v1/exports", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        design_id: designId,
        format: {
          type: "png",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Failed to start export" }, { status: response.status });
    }

    return NextResponse.json({ jobId: data.job.id });
  } catch (error) {
    console.error("Error starting export:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Check status of an export job
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("canva_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not connected to Canva" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.canva.com/rest/v1/exports/${jobId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Failed to fetch export status" }, { status: response.status });
    }

    return NextResponse.json({ job: data.job });
  } catch (error) {
    console.error("Error fetching export status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
