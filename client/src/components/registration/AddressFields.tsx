import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddressFieldsProps {
  prefix?: string; // For nested form paths like "businessDetails.address"
  required?: boolean;
  className?: string;
}

// US States for the select dropdown
const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" }
];

export function AddressFields({ prefix = "", required = false }: AddressFieldsProps) {
  const form = useFormContext();
  
  const getFieldName = (field: string) => prefix ? `${prefix}.${field}` : field;

  return (
    <div className="grid grid-cols-1 gap-4" data-testid="address-fields">
      {/* Street Address */}
      <FormField
        control={form.control}
        name={getFieldName("address")}
        render={({ field }) => (
          <FormItem>
            <FormLabel data-testid="label-address">
              Street Address {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              <Input
                placeholder="123 Main Street"
                data-testid="input-address"
                {...field}
              />
            </FormControl>
            <FormMessage data-testid="error-address" />
          </FormItem>
        )}
      />

      {/* City, State, ZIP in a row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* City */}
        <FormField
          control={form.control}
          name={getFieldName("city")}
          render={({ field }) => (
            <FormItem>
              <FormLabel data-testid="label-city">
                City {required && <span className="text-destructive">*</span>}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="City"
                  data-testid="input-city"
                  {...field}
                />
              </FormControl>
              <FormMessage data-testid="error-city" />
            </FormItem>
          )}
        />

        {/* State */}
        <FormField
          control={form.control}
          name={getFieldName("state")}
          render={({ field }) => (
            <FormItem>
              <FormLabel data-testid="label-state">
                State {required && <span className="text-destructive">*</span>}
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                data-testid="select-state"
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem 
                      key={state.value} 
                      value={state.value}
                      data-testid={`state-option-${state.value}`}
                    >
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage data-testid="error-state" />
            </FormItem>
          )}
        />

        {/* ZIP Code */}
        <FormField
          control={form.control}
          name={getFieldName("zipCode")}
          render={({ field }) => (
            <FormItem>
              <FormLabel data-testid="label-zipcode">
                ZIP Code {required && <span className="text-destructive">*</span>}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="12345"
                  data-testid="input-zipcode"
                  {...field}
                />
              </FormControl>
              <FormMessage data-testid="error-zipcode" />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}