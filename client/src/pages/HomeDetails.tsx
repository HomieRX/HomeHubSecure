import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Home, 
  Edit3, 
  Save, 
  Plus, 
  Trash2, 
  Users, 
  Phone, 
  MapPin,
  Calendar,
  Ruler,
  Thermometer,
  Zap
} from 'lucide-react';

const homeDetailsFormSchema = z.object({
  propertyType: z.string().optional(),
  yearBuilt: z.string().optional(),
  squareFootage: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  lotSize: z.string().optional(),
  heatingType: z.string().optional(),
  coolingType: z.string().optional(),
  roofType: z.string().optional(),
  foundation: z.string().optional(),
  flooring: z.string().optional(),
  specialFeatures: z.string().optional(),
  maintenanceNotes: z.string().optional(),
});

const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});

type HomeDetailsFormData = z.infer<typeof homeDetailsFormSchema>;
type EmergencyContact = z.infer<typeof emergencyContactSchema>;

export default function HomeDetails() {
  const [isEditing, setIsEditing] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    {
      name: 'Jane Smith',
      relationship: 'Spouse',
      phone: '(555) 123-4568',
      email: 'jane.smith@email.com'
    }
  ]);
  const [appliances, setAppliances] = useState<string[]>([
    'Refrigerator - Samsung 2022',
    'Washer/Dryer - LG 2021',
    'HVAC System - Carrier 2020'
  ]);
  const [newAppliance, setNewAppliance] = useState('');
  const [newContact, setNewContact] = useState<EmergencyContact>({
    name: '',
    relationship: '',
    phone: '',
    email: ''
  });
  const [showAddContact, setShowAddContact] = useState(false);

  // Mock data - in real app this would come from API
  const homeData = {
    id: '1',
    propertyType: 'Single Family Home',
    yearBuilt: '1995',
    squareFootage: '2,400',
    bedrooms: '4',
    bathrooms: '3',
    lotSize: '0.25 acres',
    heatingType: 'Gas Forced Air',
    coolingType: 'Central Air',
    roofType: 'Asphalt Shingles',
    foundation: 'Concrete Slab',
    flooring: 'Hardwood, Tile, Carpet',
    specialFeatures: 'Fireplace, 2-car garage, covered patio, mature landscaping',
    maintenanceNotes: 'HVAC serviced annually, roof inspected 2023, gutters cleaned spring/fall',
  };

  const form = useForm<HomeDetailsFormData>({
    resolver: zodResolver(homeDetailsFormSchema),
    defaultValues: homeData,
  });

  const onSubmit = (data: HomeDetailsFormData) => {
    console.log('Home details update:', { ...data, appliances, emergencyContacts });
    // TODO: Implement API call to update home details
    setIsEditing(false);
  };

  const addAppliance = () => {
    if (newAppliance.trim()) {
      setAppliances([...appliances, newAppliance.trim()]);
      setNewAppliance('');
    }
  };

  const removeAppliance = (index: number) => {
    setAppliances(appliances.filter((_, i) => i !== index));
  };

  const addEmergencyContact = () => {
    if (newContact.name && newContact.relationship && newContact.phone) {
      setEmergencyContacts([...emergencyContacts, newContact]);
      setNewContact({ name: '', relationship: '', phone: '', email: '' });
      setShowAddContact(false);
    }
  };

  const removeEmergencyContact = (index: number) => {
    setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
  };

  const propertyTypes = [
    'Single Family Home',
    'Townhouse',
    'Condominium',
    'Duplex',
    'Apartment',
    'Mobile Home',
    'Other'
  ];

  const heatingTypes = [
    'Gas Forced Air',
    'Electric Forced Air',
    'Heat Pump',
    'Radiant Heat',
    'Baseboard Heat',
    'Wood/Pellet Stove',
    'Other'
  ];

  const coolingTypes = [
    'Central Air',
    'Window Units',
    'Ductless Mini-Split',
    'Evaporative Cooler',
    'None',
    'Other'
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Home Details</h1>
          <p className="text-muted-foreground">Manage your property information and emergency contacts</p>
        </div>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant={isEditing ? 'outline' : 'default'}
          data-testid={isEditing ? 'button-cancel-edit' : 'button-edit-details'}
        >
          {isEditing ? 'Cancel' : <><Edit3 className="h-4 w-4 mr-2" />Edit Details</>}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Property Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type</FormLabel>
                      <FormControl>
                        {isEditing ? (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger data-testid="select-property-type">
                              <SelectValue placeholder="Select property type" />
                            </SelectTrigger>
                            <SelectContent>
                              {propertyTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input value={field.value || ''} disabled />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="yearBuilt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Year Built
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditing}
                          placeholder="e.g., 1995"
                          data-testid="input-year-built"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="squareFootage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Ruler className="h-3 w-3" />
                        Square Footage
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditing}
                          placeholder="e.g., 2,400"
                          data-testid="input-square-footage"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedrooms</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditing}
                          placeholder="e.g., 4"
                          data-testid="input-bedrooms"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bathrooms</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditing}
                          placeholder="e.g., 3"
                          data-testid="input-bathrooms"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lotSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Lot Size
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditing}
                          placeholder="e.g., 0.25 acres"
                          data-testid="input-lot-size"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Systems */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  Home Systems
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="heatingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heating Type</FormLabel>
                        <FormControl>
                          {isEditing ? (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger data-testid="select-heating-type">
                                <SelectValue placeholder="Select heating type" />
                              </SelectTrigger>
                              <SelectContent>
                                {heatingTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input value={field.value || ''} disabled />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="coolingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cooling Type</FormLabel>
                        <FormControl>
                          {isEditing ? (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger data-testid="select-cooling-type">
                                <SelectValue placeholder="Select cooling type" />
                              </SelectTrigger>
                              <SelectContent>
                                {coolingTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input value={field.value || ''} disabled />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="roofType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roof Type</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isEditing}
                            placeholder="e.g., Asphalt Shingles"
                            data-testid="input-roof-type"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="foundation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Foundation</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isEditing}
                            placeholder="e.g., Concrete Slab"
                            data-testid="input-foundation"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="flooring"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Flooring</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isEditing}
                            placeholder="e.g., Hardwood, Tile"
                            data-testid="input-flooring"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="specialFeatures"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Features</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={!isEditing}
                        rows={3}
                        placeholder="List special features like fireplace, garage, patio, etc."
                        data-testid="input-special-features"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maintenanceNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maintenance Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={!isEditing}
                        rows={3}
                        placeholder="Track maintenance schedules, service records, etc."
                        data-testid="input-maintenance-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Appliances */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Appliances & Equipment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {appliances.map((appliance, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                    <span className="text-sm">{appliance}</span>
                    {isEditing && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAppliance(index)}
                        data-testid={`button-remove-appliance-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              {isEditing && (
                <div className="flex gap-2">
                  <Input
                    value={newAppliance}
                    onChange={(e) => setNewAppliance(e.target.value)}
                    placeholder="Add appliance (e.g., Dishwasher - KitchenAid 2022)"
                    data-testid="input-new-appliance"
                  />
                  <Button
                    type="button"
                    onClick={addAppliance}
                    disabled={!newAppliance.trim()}
                    data-testid="button-add-appliance"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Emergency Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {emergencyContacts.map((contact, index) => (
                  <div key={index} className="p-4 border rounded-md">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-sm text-muted-foreground">{contact.relationship}</div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </span>
                          {contact.email && (
                            <span>{contact.email}</span>
                          )}
                        </div>
                      </div>
                      {isEditing && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEmergencyContact(index)}
                          data-testid={`button-remove-contact-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {isEditing && (
                <div className="space-y-3">
                  {showAddContact ? (
                    <div className="p-4 border rounded-md space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          value={newContact.name}
                          onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                          placeholder="Name"
                          data-testid="input-contact-name"
                        />
                        <Input
                          value={newContact.relationship}
                          onChange={(e) => setNewContact({...newContact, relationship: e.target.value})}
                          placeholder="Relationship"
                          data-testid="input-contact-relationship"
                        />
                        <Input
                          value={newContact.phone}
                          onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                          placeholder="Phone"
                          data-testid="input-contact-phone"
                        />
                        <Input
                          value={newContact.email}
                          onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                          placeholder="Email (optional)"
                          data-testid="input-contact-email"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={addEmergencyContact}
                          disabled={!newContact.name || !newContact.relationship || !newContact.phone}
                          data-testid="button-save-contact"
                        >
                          Save Contact
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowAddContact(false);
                            setNewContact({ name: '', relationship: '', phone: '', email: '' });
                          }}
                          data-testid="button-cancel-contact"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddContact(true)}
                      data-testid="button-add-contact"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Emergency Contact
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {isEditing && (
            <div className="flex gap-2">
              <Button type="submit" data-testid="button-save-home-details">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                data-testid="button-cancel-changes"
              >
                Cancel
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}