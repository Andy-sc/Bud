"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileById } from "@/lib/profiles";

export interface LoginState {
  status: "idle" | "error";
  message?: string;
}

export async function pinLogin(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const profileId = String(formData.get("profile") ?? "");
  const pin = String(formData.get("pin") ?? "");

  const profile = profileById(profileId);
  if (!profile) {
    return { status: "error", message: "Choose a profile first." };
  }
  if (!pin) {
    return { status: "error", message: "Enter your PIN." };
  }

  const supabase = await createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: pin,
  });

  if (!signInError) {
    redirect("/dashboard");
  }

  // No account yet for this profile — treat this PIN entry as first-time
  // setup and create it. If the account already exists, signUp fails and
  // the original "wrong PIN" error below is what the user sees.
  const { error: signUpError } = await supabase.auth.signUp({
    email: profile.email,
    password: pin,
  });

  if (!signUpError) {
    redirect("/dashboard");
  }

  // Only "this account already exists" really means "wrong PIN" (someone
  // typed the wrong one for an account that was already set up). Anything
  // else is a real configuration problem — surface it instead of hiding
  // it behind a generic message.
  const alreadyExists = /already registered|already exists/i.test(signUpError.message);
  if (!alreadyExists) {
    return { status: "error", message: signUpError.message };
  }

  return { status: "error", message: "Wrong PIN. Try again." };
}
