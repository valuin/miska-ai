import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";

export const NodeHeaderStatus = ({
	status,
}: {
	status?: "idle" | "running" | "completed" | "error";
}) => {
	const statusColors = {
		idle: "bg-muted text-muted-foreground",
		running: "bg-orange-500 text-white",
		completed: "bg-green-500 text-white",
		error: "bg-red-500 text-white",
	};
	return (
		<Badge
			variant="secondary"
			className={cn("mr-2 font-normal", status && statusColors[status])}
		>
			{status ? status : "idle"}
		</Badge>
	);
};

NodeHeaderStatus.displayName = "NodeHeaderStatus";
