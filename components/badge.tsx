import { cn } from '@/lib/utils';

export default function Badge({
  icon: Icon,
  text,
}: {
  icon: (...props: any) => React.ReactNode;
  text: string | React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'w-fit rounded-full bg-white border border-[#054135] hover:bg-muted-foreground/20',
        'flex flex-row items-center justify-center gap-2 py-2 px-[9px] cursor-pointer whitespace-nowrap',
      )}
    >
      <Icon className="size-4" />
      <span className="text-xs text-muted-foreground">{text}</span>
    </div>
  );
}
