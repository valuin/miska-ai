import { auth } from "@/app/(auth)/auth";
import { ProfileSetup } from "@/components/profile-setup/profile-setup";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (!session) {
    redirect("/api/auth/guest");
  }

  return <ProfileSetup session={session} />;
}
