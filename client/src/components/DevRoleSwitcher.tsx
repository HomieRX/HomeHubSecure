import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Settings, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';

const AVAILABLE_ROLES = [
  { value: 'homeowner', label: 'Homeowner', color: 'bg-blue-500' },
  { value: 'contractor', label: 'Contractor', color: 'bg-green-500' },
  { value: 'merchant', label: 'Merchant', color: 'bg-purple-500' },
  { value: 'admin', label: 'Admin', color: 'bg-red-500' },
];

export function DevRoleSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Only render in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  // Get current user data
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    staleTime: 30000, // 30 seconds
  });

  // Role switch mutation
  const switchRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      const response = await apiRequest('/api/dev/switch-role', {
        method: 'POST',
        body: { role }
      });
      return response;
    },
    onSuccess: (data) => {
      // Invalidate user data to refresh it
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Role switched successfully",
        description: `You are now a ${data.user.role}`,
      });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to switch role",
        description: error.message || "An error occurred",
      });
    }
  });

  if (userLoading || !currentUser) {
    return (
      <Button variant="ghost" size="icon" disabled data-testid="dev-role-switcher-loading">
        <Settings className="h-4 w-4" />
      </Button>
    );
  }

  const currentRole = AVAILABLE_ROLES.find(role => role.value === currentUser.role);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 border border-yellow-400 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800"
          data-testid="dev-role-switcher-trigger"
        >
          <Settings className="h-3 w-3" />
          <span className="text-xs">DEV</span>
          <Badge 
            variant="outline" 
            className={`text-xs h-4 ${currentRole?.color} text-white border-none`}
          >
            {currentRole?.label || currentUser.role}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-yellow-600" />
            <h4 className="font-medium text-sm">Development Role Switcher</h4>
            <Badge variant="secondary" className="text-xs">DEV ONLY</Badge>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Current role: <strong className="text-foreground">{currentRole?.label || currentUser.role}</strong>
            </p>
            
            <div className="space-y-2">
              <label htmlFor="role-select" className="text-sm font-medium">
                Switch to role:
              </label>
              <Select 
                onValueChange={(role) => switchRoleMutation.mutate(role)}
                disabled={switchRoleMutation.isPending}
              >
                <SelectTrigger data-testid="dev-role-select">
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ROLES.map((role) => (
                    <SelectItem 
                      key={role.value} 
                      value={role.value}
                      disabled={role.value === currentUser.role}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${role.color}`} />
                        {role.label}
                        {role.value === currentUser.role && (
                          <span className="text-xs text-muted-foreground">(current)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {switchRoleMutation.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Switching role...
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground border-t pt-2">
            <p>⚠️ This feature is only available in development mode</p>
            <p>Changes your user role for testing different UI states</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}