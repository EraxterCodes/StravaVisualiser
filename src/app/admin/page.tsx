import { isValidSharedSecret } from "@/lib/auth";
import { InvitesAdmin } from "./invites-admin";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ secret?: string }>;
}) {
  const { secret } = await searchParams;

  if (!isValidSharedSecret(secret)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm text-text-secondary">Unauthorized.</p>
      </main>
    );
  }

  return <InvitesAdmin secret={secret!} />;
}
