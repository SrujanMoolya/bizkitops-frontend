import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export function ModuleStub({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
      </div>
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary-soft text-primary flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="font-medium">{title} is being built</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
