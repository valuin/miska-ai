import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import type { UserIntegrationResponse } from "@/app/(chat)/api/integrations/route";

const fetchIntegrations = async (): Promise<
  UserIntegrationResponse["integrations"]
> => {
  const response = await fetch("/api/integrations");
  if (!response.ok) {
    const errorData = await response.json();
    console.error(errorData);
    return [];
  }
  const { integrations } = await response.json();
  return integrations;
};

const toggleIntegration = async (id: string, enabled: boolean) => {
  await fetch(`/api/integrations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  });
};

export default function Integrations() {
  const {
    data: integrations,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["integrations"],
    queryFn: fetchIntegrations,
  });

  return (
    <div className="flex flex-col gap-1 shadow-inner shadow-black/90 m-4 py-3 px-2 rounded-lg">
      <p className="text-sm font-semibold px-2">Integrations</p>
      {isLoading && (
        <p className="text-xs text-muted-foreground px-2">Loading...</p>
      )}
      {integrations?.map((integration) => (
        <button
          key={integration.id}
          type="button"
          className="w-full flex items-center gap-2 hover:bg-muted/50 rounded-md px-2 py-1 hover:scale-[102%] transition-all duration-100"
          onClick={async () => {
            if (integration.requires_auth && !integration.authenticated) {
              // TODO: Open auth modal
            } else {
              const toggle = !integration.enabled;
              await toggleIntegration(integration.id, toggle);
              refetch().then(() => {
                toast.success(`${toggle ? "Enabled" : "Disabled"} integration`);
              });
            }
          }}
        >
          <Image
            src={`/integrations/${integration.icon}`}
            className="size-3"
            alt={integration.name}
            width={20}
            height={20}
          />
          <div className="text-left">
            <p className="text-xs">{integration.name}</p>
            {integration.requires_auth && !integration.authenticated && (
              <p className="text-[8px] text-muted-foreground">
                Authenticate now!
              </p>
            )}
          </div>
          {integration.enabled ? (
            <div className="ml-auto bg-green-500 rounded-full size-2 animate-pulse border border-green-500/50" />
          ) : (
            <div className="ml-auto bg-red-500 rounded-full size-2 animate-pulse border border-red-500/50" />
          )}
        </button>
      ))}
    </div>
  );
}
