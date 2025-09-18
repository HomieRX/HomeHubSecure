import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}

export function FormSection({ 
  title, 
  description, 
  children, 
  className,
  required = false 
}: FormSectionProps) {
  return (
    <Card className={cn("w-full", className)} data-testid={`form-section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" data-testid={`section-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {title}
          {required && (
            <span className="text-destructive text-sm" data-testid="required-indicator">
              *
            </span>
          )}
        </CardTitle>
        {description && (
          <CardDescription data-testid={`section-description-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent data-testid={`section-content-${title.toLowerCase().replace(/\s+/g, '-')}`}>
        {children}
      </CardContent>
    </Card>
  );
}