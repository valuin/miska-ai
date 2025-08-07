import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./(auth)/auth";
import { ProfileSetup } from "@/components/profile-setup/profile-setup";

export default async function RootPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }

  // Check if user has completed profile setup
  const cookieStore = await cookies();
  const hasCompletedSetup = cookieStore.get("profile-setup-completed");

  if (hasCompletedSetup?.value === "true") {
    redirect("/chat");
  }

  return <ProfileSetup session={session} />;
}
