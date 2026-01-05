import { History } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center gap-4 text-center mt-16">
        <History className="h-20 w-20 text-muted-foreground/50" />
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-foreground">
          Order History
        </h1>
        <p className="text-muted-foreground">This is where your order history will be.</p>
      </div>
    </div>
  );
}
