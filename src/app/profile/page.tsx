import { User } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center gap-4 text-center mt-16">
        <User className="h-20 w-20 text-muted-foreground/50" />
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-foreground">
          Profile
        </h1>
        <p className="text-muted-foreground">This is where the user profile page will be.</p>
      </div>
    </div>
  );
}
