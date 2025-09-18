import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BusinessHoursInputProps {
  prefix?: string; // For nested form paths like "operationsData.operatingHours"
}

const DAYS_OF_WEEK = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" }
];

export function BusinessHoursInput({ prefix = "operatingHours" }: BusinessHoursInputProps) {
  const form = useFormContext();
  
  const getFieldName = (day: string, field: string) => 
    prefix ? `${prefix}.${day}.${field}` : `${day}.${field}`;

  return (
    <Card data-testid="business-hours-input">
      <CardHeader>
        <CardTitle className="text-lg">Business Hours</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day.key}
            className="flex items-center gap-4 p-4 border rounded-lg"
            data-testid={`day-row-${day.key}`}
          >
            {/* Day Label */}
            <div className="w-24 font-medium" data-testid={`day-label-${day.key}`}>
              {day.label}
            </div>

            {/* Closed Toggle */}
            <FormField
              control={form.control}
              name={getFieldName(day.key, "closed")}
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch
                      checked={!field.value} // Inverted logic: switch ON means OPEN
                      onCheckedChange={(checked) => field.onChange(!checked)}
                      data-testid={`switch-${day.key}`}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal">
                    {field.value ? "Closed" : "Open"}
                  </FormLabel>
                </FormItem>
              )}
            />

            {/* Start Time */}
            <FormField
              control={form.control}
              name={getFieldName(day.key, "start")}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      type="time"
                      placeholder="09:00"
                      disabled={form.watch(getFieldName(day.key, "closed"))}
                      data-testid={`time-start-${day.key}`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Separator */}
            <span className="text-muted-foreground">to</span>

            {/* End Time */}
            <FormField
              control={form.control}
              name={getFieldName(day.key, "end")}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      type="time"
                      placeholder="17:00"
                      disabled={form.watch(getFieldName(day.key, "closed"))}
                      data-testid={`time-end-${day.key}`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ))}

        {/* Quick Set Buttons */}
        <div className="flex gap-2 pt-4 border-t" data-testid="quick-set-buttons">
          <QuickSetButton
            label="Weekdays 9-5"
            onClick={() => {
              DAYS_OF_WEEK.slice(0, 5).forEach((day) => {
                form.setValue(getFieldName(day.key, "closed"), false);
                form.setValue(getFieldName(day.key, "start"), "09:00");
                form.setValue(getFieldName(day.key, "end"), "17:00");
              });
              // Close weekends
              DAYS_OF_WEEK.slice(5).forEach((day) => {
                form.setValue(getFieldName(day.key, "closed"), true);
              });
            }}
            testId="quick-weekdays"
          />
          <QuickSetButton
            label="24/7"
            onClick={() => {
              DAYS_OF_WEEK.forEach((day) => {
                form.setValue(getFieldName(day.key, "closed"), false);
                form.setValue(getFieldName(day.key, "start"), "00:00");
                form.setValue(getFieldName(day.key, "end"), "23:59");
              });
            }}
            testId="quick-24-7"
          />
          <QuickSetButton
            label="Clear All"
            onClick={() => {
              DAYS_OF_WEEK.forEach((day) => {
                form.setValue(getFieldName(day.key, "closed"), true);
                form.setValue(getFieldName(day.key, "start"), "");
                form.setValue(getFieldName(day.key, "end"), "");
              });
            }}
            testId="quick-clear"
            variant="outline"
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickSetButtonProps {
  label: string;
  onClick: () => void;
  testId: string;
  variant?: "default" | "outline";
}

function QuickSetButton({ label, onClick, testId, variant = "default" }: QuickSetButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 text-xs rounded-md border transition-colors ${
        variant === "outline"
          ? "border-border bg-background hover:bg-muted"
          : "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
      }`}
      data-testid={testId}
    >
      {label}
    </button>
  );
}