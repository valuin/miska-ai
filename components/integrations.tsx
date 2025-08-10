import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { MoreHorizontalIcon } from "./icons";
import type { UserIntegrationResponse } from "@/app/(chat)/api/integrations/route";

const fetchIntegrations = async (): Promise<
  UserIntegrationResponse["integrations"]
> => {
  const response = await fetch("/api/integrations");
  if (!response.ok) {
    const errorData = await response.json();
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

  const router = useRouter();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          data-testid="integrations-button"
          size="sm"
          variant="ghost"
          className="border"
        >
          <MoreHorizontalIcon />
          Integrations
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-auto p-1 shadow-md shadow-[#A6E564]/30 rounded-lg"
      >
        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
          <p className="text-sm font-semibold px-2">Integrations</p>
          {isLoading && (
            <p className="text-xs text-muted-foreground px-2">Loading...</p>
          )}
          {integrations
            ?.sort((a, b) => {
              if (a.enabled && !b.enabled) return -1;
              if (!a.enabled && b.enabled) return 1;
              return a.name.localeCompare(b.name);
            })
            ?.map((integration) => (
              <button
                key={integration.id}
                type="button"
                className="w-full flex items-center gap-2 hover:bg-muted/50 rounded-md px-2 py-1 hover:scale-[102%] transition-all duration-100"
                onClick={async () => {
                  if (integration.requires_auth && !integration.authenticated) {
                    if (integration.redirect_url) {
                      router.push(integration.redirect_url);
                    }
                  } else {
                    const toggle = !integration.enabled;
                    await toggleIntegration(integration.id, toggle);
                    refetch().then(() => {
                      toast.success(
                        `${toggle ? "Enabled" : "Disabled"} integration`
                      );
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
                <div className="text-left group">
                  <p className="text-xs">{integration.name}</p>
                  {integration.requires_auth && !integration.authenticated && (
                    <p className="text-[8px] text-muted-foreground transition-opacity duration-100">
                      Authenticate to get started!
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
      </PopoverContent>
    </Popover>
  );
}
