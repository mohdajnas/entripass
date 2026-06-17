"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };
  const confirmPassword = formData.get("confirmPassword") as string;
  const fullName = formData.get("name") as string;

  if (data.password !== confirmPassword) {
    return redirect("/register?message=Passwords do not match");
  }

  const { data: authData, error } = await supabase.auth.signUp({
    ...data,
    options: {
      data: {
        full_name: fullName,
      }
    }
  });

  if (error) {
    console.error("Signup error:", error);
    return redirect(`/register?message=${encodeURIComponent(error.message)}`);
  }

  if (!authData.session) {
    return redirect("/login?message=Check your email to confirm your account.");
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "http";
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (data.url) {
    redirect(data.url);
  } else {
    redirect("/login?message=Could not authenticate with Google");
  }
}
