import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { User } from "lucide-react";

interface ChildSelectorProps {
  selectedChildId: string;
  onChildChange: (childId: string) => void;
  className?: string;
}

export function ChildSelector({ selectedChildId, onChildChange, className }: ChildSelectorProps) {
  const { data: linkedPlayers, isLoading } = trpc.parentRelations.getLinkedPlayers.useQuery();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading children...</span>
      </div>
    );
  }

  if (!linkedPlayers || linkedPlayers.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No linked children</span>
      </div>
    );
  }

  // If only one child, show their name without dropdown
  if (linkedPlayers.length === 1) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <User className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          {linkedPlayers[0].firstName} {linkedPlayers[0].lastName}
        </span>
      </div>
    );
  }

  // Multiple children - show dropdown
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <User className="h-4 w-4 text-primary" />
      <Select value={selectedChildId} onValueChange={onChildChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select child" />
        </SelectTrigger>
        <SelectContent>
          {linkedPlayers.map((player: any) => (
            <SelectItem key={player.id} value={player.id.toString()}>
              {player.firstName} {player.lastName}
              {player.jerseyNumber && ` (#${player.jerseyNumber})`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
