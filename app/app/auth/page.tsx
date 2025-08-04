import { redirect } from "next/navigation";

export default function AuthPage() {
  // Redirect to login page as this is the main auth entry point
  redirect("/auth/login");
}