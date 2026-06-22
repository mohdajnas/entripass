"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
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
  const avatarUrl = formData.get("avatarUrl") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password) {
    if (password !== confirmPassword) {
      return { success: false, error: "Passwords do not match." };
    }
    const { error: passwordError } = await supabase.auth.updateUser({ password });
    if (passwordError) {
      console.error("Password update error:", passwordError);
      return { success: false, error: passwordError.message };
    }
  }

  const dob = dobStr ? dobStr : null;

  const { error } = await supabase
    .from("profiles")
    .update({
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
    })
    .eq("id", user.id);

  if (error) {
    console.error("Profile update error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/profile");
  return { success: true };
}
