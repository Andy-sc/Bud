"use server";

import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  status: "idle" | "error";
  message?: string;
}

export async function pinLogin(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const pin = String(formData.get("pin") ?? "");

  if (!email || !pin) {
    return { status: "error", message: "Enter your PIN." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: pin });

  if (error) {
    return { status: "error", message: "Wrong PIN. Try again." };
  }

  redirect("/dashboard");
}

export async function createProfile(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const name = String(formData.get("name") ?? "").trim();
  const pin = String(formData.get("pin") ?? "");

  if (!name) {
    return { status: "error", message: "Enter a name." };
  }
  if (!pin) {
    return { status: "error", message: "Choose a PIN." };
  }

  // Internal, never-emailed address — just a unique identifier for the
  // underlying Supabase Auth account. The PIN is that account's password.
  const email = `${randomUUID()}@bud.internal`;

  const supabase = await createClient();

  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password: pin,
  });

  if (signUpError || !data.user) {
    return {
      status: "error",
      message: signUpError?.message ?? "Something went wrong. Try again.",
    };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .insert({ id: data.user.id, name, email });

  if (profileError) {
    return { status: "error", message: profileError.message };
  }

  redirect("/dashboard");
}
