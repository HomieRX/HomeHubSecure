import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Search } from "lucide-react";

// Service categories from the schema
const SERVICE_CATEGORIES = [
  "Handyman",
  "Dishwasher",
  "Oven", 
  "Microwave",
  "Refrigerator",
  "Sink Disposal",
  "Clothes Washer",
  "Clothes Dryer",
  "Water Heater",
  "Basic Electrical",
  "Basic Irrigation", 
  "Basic Plumbing"
];

// Merchant categories (more business-focused)
const MERCHANT_CATEGORIES = [
  "Hardware Store",
  "Garden Center",
  "Home Improvement",
  "Electrical Supplies",
  "Plumbing Supplies",
  "Lumber Yard",
  "Paint Store",
  "Flooring Store",
  "Appliance Store",
  "HVAC Supplies",
  "Roofing Materials",
  "Windows & Doors",
  "Kitchen & Bath",
  "Outdoor/Landscaping",
  "Tools & Equipment",
  "Safety Supplies"
];

interface SpecialtySelectorProps {
  fieldName?: string;
  type?: "contractor" | "merchant";
  label?: string;
  description?: string;
  required?: boolean;
  maxSelections?: number;
}

export function SpecialtySelector({
  fieldName = "specialties",
  type = "contractor",
  label,
  description,
  required = false,
  maxSelections = 10
}: SpecialtySelectorProps) {
  const form = useFormContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [customSpecialty, setCustomSpecialty] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const categories = type === "contractor" ? SERVICE_CATEGORIES : MERCHANT_CATEGORIES;
  const defaultLabel = type === "contractor" ? "Service Specialties" : "Business Categories";
  const defaultDescription = type === "contractor" 
    ? "Select the services you specialize in" 
    : "Select the categories that best describe your business";

  const currentValue: string[] = form.watch(fieldName) || [];

  const filteredCategories = categories.filter(category =>
    category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSpecialty = (specialty: string) => {
    const current = currentValue;
    const isSelected = current.includes(specialty);
    
    if (isSelected) {
      // Remove specialty
      const updated = current.filter(item => item !== specialty);
      form.setValue(fieldName, updated);
    } else {
      // Add specialty (check max limit)
      if (current.length < maxSelections) {
        const updated = [...current, specialty];
        form.setValue(fieldName, updated);
      }
    }
  };

  const addCustomSpecialty = () => {
    if (customSpecialty.trim() && !currentValue.includes(customSpecialty.trim())) {
      if (currentValue.length < maxSelections) {
        const updated = [...currentValue, customSpecialty.trim()];
        form.setValue(fieldName, updated);
        setCustomSpecialty("");
        setShowCustomInput(false);
      }
    }
  };

  const removeSpecialty = (specialty: string) => {
    const updated = currentValue.filter(item => item !== specialty);
    form.setValue(fieldName, updated);
  };

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={() => (
        <FormItem>
          <FormLabel data-testid={`label-${fieldName}`}>
            {label || defaultLabel} {required && <span className="text-destructive">*</span>}
          </FormLabel>
          
          <FormControl>
            <Card data-testid={`specialty-selector-${type}`}>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">
                  {label || defaultLabel}
                </CardTitle>
                {(description || defaultDescription) && (
                  <p className="text-sm text-muted-foreground">
                    {description || defaultDescription}
                  </p>
                )}
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="search-specialties"
                  />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Selected Specialties */}
                {currentValue.length > 0 && (
                  <div data-testid="selected-specialties">
                    <h4 className="text-sm font-medium mb-2">
                      Selected ({currentValue.length}/{maxSelections})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {currentValue.map((specialty) => (
                        <Badge
                          key={specialty}
                          variant="default"
                          className="px-3 py-1"
                          data-testid={`selected-specialty-${specialty}`}
                        >
                          {specialty}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-auto p-0 hover:bg-transparent"
                            onClick={() => removeSpecialty(specialty)}
                            data-testid={`remove-specialty-${specialty}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Categories */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Available Categories</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    {filteredCategories.map((category) => {
                      const isSelected = currentValue.includes(category);
                      const isDisabled = !isSelected && currentValue.length >= maxSelections;
                      
                      return (
                        <div
                          key={category}
                          className="flex items-center space-x-2"
                          data-testid={`category-option-${category}`}
                        >
                          <Checkbox
                            id={category}
                            checked={isSelected}
                            disabled={isDisabled}
                            onCheckedChange={() => toggleSpecialty(category)}
                            data-testid={`checkbox-${category}`}
                          />
                          <label
                            htmlFor={category}
                            className={`text-sm cursor-pointer ${
                              isDisabled ? "text-muted-foreground" : ""
                            }`}
                          >
                            {category}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  
                  {filteredCategories.length === 0 && searchTerm && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No categories found matching "{searchTerm}"
                    </p>
                  )}
                </div>

                {/* Custom Specialty Input */}
                <div className="border-t pt-4">
                  {!showCustomInput ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCustomInput(true)}
                      disabled={currentValue.length >= maxSelections}
                      data-testid="button-add-custom"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Custom {type === "contractor" ? "Service" : "Category"}
                    </Button>
                  ) : (
                    <div className="flex gap-2" data-testid="custom-specialty-input">
                      <Input
                        placeholder={`Enter custom ${type === "contractor" ? "service" : "category"}`}
                        value={customSpecialty}
                        onChange={(e) => setCustomSpecialty(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addCustomSpecialty()}
                        data-testid="input-custom-specialty"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={addCustomSpecialty}
                        disabled={!customSpecialty.trim() || currentValue.length >= maxSelections}
                        data-testid="button-save-custom"
                      >
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCustomInput(false);
                          setCustomSpecialty("");
                        }}
                        data-testid="button-cancel-custom"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </FormControl>
          
          <FormMessage data-testid={`error-${fieldName}`} />
        </FormItem>
      )}
    />
  );
}