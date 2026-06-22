"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const fullName = formData.get("fullName") as string;
  const username = formData.get("username") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const email = formData.get("email") as string;
  const gender = formData.get("gender") as string;
  const dobStr = formData.get("dob") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const bio = formData.get("bio") as string;
  const avatarUrl = (formData.get("avatarUrl") || formData.get("customAvatarUrl") || "") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password) {
    if (password !== confirmPassword) {
      return redirect("/setup-profile?message=Passwords do not match");
    }

    const { error: passwordError } = await supabase.auth.updateUser({
      password: password,
    });

    if (passwordError) {
      console.error("Update password error:", passwordError);
      return redirect(`/setup-profile?message=${encodeURIComponent(passwordError.message)}`);
    }
  }

  // DOB validation / formatting (or leave as null if empty)
  const dob = dobStr ? dobStr : null;

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    full_name: fullName,
    username: username || null,
    phone_number: phoneNumber || null,
    email: email || null,
    gender: gender || null,
    dob: dob,
    city: city || null,
    state: state || null,
    avatar_url: avatarUrl || null,
    bio: bio || null,
  });

  if (error) {
    console.error("Profile insert error:", error);
    let errorMessage = "Could not save profile";
    if (error.code === "23505" && error.message?.includes("username_key")) {
      errorMessage = "Username already exists. Please choose another one.";
    } else {
      errorMessage = error.message || "Could not save profile";
    }
    return redirect(`/setup-profile?message=${encodeURIComponent(errorMessage)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
