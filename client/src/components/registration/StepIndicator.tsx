import { cn } from "@/lib/utils";

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn("w-full", className)} data-testid="step-indicator">
      <nav aria-label="Registration progress">
        <ol className="flex items-center justify-between">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const isUpcoming = stepNumber > currentStep;

            return (
              <li
                key={step.id}
                className={cn(
                  "flex items-center",
                  index < steps.length - 1 && "flex-1"
                )}
                data-testid={`step-${step.id}`}
              >
                <div className="flex items-center group">
                  {/* Step Circle */}
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                      isCompleted && "bg-primary text-primary-foreground",
                      isCurrent && "bg-primary/20 text-primary border-2 border-primary",
                      isUpcoming && "bg-muted text-muted-foreground border border-border"
                    )}
                    data-testid={`step-circle-${step.id}`}
                  >
                    {isCompleted ? (
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        data-testid={`step-check-${step.id}`}
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <span data-testid={`step-number-${step.id}`}>{stepNumber}</span>
                    )}
                  </div>

                  {/* Step Text */}
                  <div className="ml-3 hidden sm:block">
                    <div
                      className={cn(
                        "text-sm font-medium",
                        isCurrent && "text-primary",
                        isCompleted && "text-foreground",
                        isUpcoming && "text-muted-foreground"
                      )}
                      data-testid={`step-title-${step.id}`}
                    >
                      {step.title}
                    </div>
                    {step.description && (
                      <div
                        className="text-xs text-muted-foreground"
                        data-testid={`step-description-${step.id}`}
                      >
                        {step.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "ml-4 flex-1 border-t-2",
                      isCompleted && "border-primary",
                      !isCompleted && "border-border"
                    )}
                    data-testid={`step-connector-${step.id}`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}