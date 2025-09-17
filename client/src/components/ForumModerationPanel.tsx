import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Flag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Pin,
  PinOff,
  Trash2,
  MessageSquare,
  Users,
  Calendar,
  TrendingUp,
  Shield,
  Ban,
  UserX,
  Edit,
  Archive,
  MoreHorizontal
} from "lucide-react";

interface FlaggedContent {
  id: string;
  type: "post" | "topic";
  content: string;
  reason: string;
  reportedBy: string;
  reportedAt: string;
  status: "pending" | "reviewed" | "approved" | "rejected";
  forumName: string;
  topicTitle?: string;
  authorName: string;
  flagCount: number;
}

interface ModerationAction {
  id: string;
  action: string;
  targetType: "post" | "topic" | "user";
  targetId: string;
  moderatorId: string;
  reason: string;
  timestamp: string;
}

const moderationActionSchema = z.object({
  action: z.enum(["approve", "reject", "hide", "delete", "warn", "suspend", "ban"]),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  duration: z.number().optional()
});

type ModerationActionFormData = z.infer<typeof moderationActionSchema>;

export function ForumModerationPanel() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showModerationDialog, setShowModerationDialog] = useState(false);
  const [moderationTarget, setModerationTarget] = useState<FlaggedContent | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ModerationActionFormData>({
    resolver: zodResolver(moderationActionSchema),
    defaultValues: {
      action: "approve",
      reason: "",
      duration: undefined
    }
  });

  // Get flagged content
  const { data: flaggedContent = [], isLoading: flaggedLoading } = useQuery({
    queryKey: ["/api/admin/forums/flagged"],
    select: (data: any) => data || []
  });

  // Get moderation statistics
  const { data: moderationStats = {} } = useQuery({
    queryKey: ["/api/admin/forums/moderation/stats"],
    select: (data: any) => data || {}
  });

  // Get recent moderation actions
  const { data: recentActions = [] } = useQuery({
    queryKey: ["/api/admin/forums/moderation/actions"],
    select: (data: any) => data || []
  });

  // Moderation actions mutation
  const moderationMutation = useMutation({
    mutationFn: async (data: { 
      contentIds: string[], 
      action: string, 
      reason: string, 
      duration?: number 
    }) => {
      return fetch("/api/admin/forums/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).then(res => {
        if (!res.ok) throw new Error("Failed to perform moderation action");
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/forums/flagged"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/forums/moderation/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/forums/moderation/actions"] });
      toast({
        title: "Success",
        description: "Moderation action completed successfully"
      });
      setSelectedItems([]);
      setShowModerationDialog(false);
      setModerationTarget(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to perform moderation action",
        variant: "destructive"
      });
    }
  });

  const handleBulkAction = (action: string) => {
    if (selectedItems.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select items to moderate",
        variant: "destructive"
      });
      return;
    }

    const reason = `Bulk ${action} action performed by administrator`;
    moderationMutation.mutate({
      contentIds: selectedItems,
      action,
      reason
    });
  };

  const handleSingleAction = (content: FlaggedContent, action: string) => {
    setModerationTarget(content);
    form.setValue("action", action as any);
    setShowModerationDialog(true);
  };

  const onSubmitModeration = (data: ModerationActionFormData) => {
    const contentIds = moderationTarget ? [moderationTarget.id] : selectedItems;
    
    if (contentIds.length === 0) {
      toast({
        title: "No Target",
        description: "No content selected for moderation",
        variant: "destructive"
      });
      return;
    }

    moderationMutation.mutate({
      contentIds,
      action: data.action,
      reason: data.reason,
      duration: data.duration
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(flaggedContent.map((item: FlaggedContent) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending": return "destructive";
      case "approved": return "default";
      case "rejected": return "secondary";
      default: return "outline";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "approve": return <CheckCircle className="h-4 w-4" />;
      case "reject": return <XCircle className="h-4 w-4" />;
      case "hide": return <EyeOff className="h-4 w-4" />;
      case "delete": return <Trash2 className="h-4 w-4" />;
      case "warn": return <AlertTriangle className="h-4 w-4" />;
      case "suspend": return <UserX className="h-4 w-4" />;
      case "ban": return <Ban className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Moderation Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {moderationStats.pending || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Flagged content awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions Today</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {moderationStats.actionsToday || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Moderation actions performed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Forums</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {moderationStats.activeForums || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Forums requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {moderationStats.avgResponseTime || "0h"}
            </div>
            <p className="text-xs text-muted-foreground">
              Average moderation response
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Moderation Tabs */}
      <Tabs defaultValue="flagged" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="flagged" data-testid="tab-flagged">
            Flagged Content
            {moderationStats.pending > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {moderationStats.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="actions" data-testid="tab-actions">Recent Actions</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Flagged Content Tab */}
        <TabsContent value="flagged" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Flagged Content Review</CardTitle>
                  <CardDescription>
                    Review and moderate flagged posts and topics
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select onValueChange={handleBulkAction} disabled={selectedItems.length === 0}>
                    <SelectTrigger className="w-[180px]" data-testid="select-bulk-action">
                      <SelectValue placeholder="Bulk Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approve">Approve Selected</SelectItem>
                      <SelectItem value="reject">Reject Selected</SelectItem>
                      <SelectItem value="hide">Hide Selected</SelectItem>
                      <SelectItem value="delete">Delete Selected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/forums/flagged"] })}
                    data-testid="button-refresh"
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {flaggedLoading ? (
                <div className="text-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading flagged content...</p>
                </div>
              ) : flaggedContent.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">No Flagged Content</p>
                  <p className="text-muted-foreground">All content has been reviewed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Select All Header */}
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <Checkbox
                      checked={selectedItems.length === flaggedContent.length}
                      onCheckedChange={handleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                    <span className="text-sm font-medium">
                      Select All ({selectedItems.length} of {flaggedContent.length} selected)
                    </span>
                  </div>

                  {/* Flagged Content List */}
                  {flaggedContent.map((item: FlaggedContent) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                            data-testid={`checkbox-item-${item.id}`}
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {item.type === "post" ? <MessageSquare className="h-3 w-3 mr-1" /> : <Users className="h-3 w-3 mr-1" />}
                                {item.type}
                              </Badge>
                              <Badge variant={getStatusBadgeVariant(item.status)}>
                                {item.status}
                              </Badge>
                              <Badge variant="secondary">
                                <Flag className="h-3 w-3 mr-1" />
                                {item.flagCount} reports
                              </Badge>
                            </div>
                            
                            <div>
                              <p className="font-medium text-sm">
                                {item.topicTitle ? `Topic: ${item.topicTitle}` : "Direct Post"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Forum: {item.forumName} • Author: {item.authorName}
                              </p>
                            </div>

                            <div className="bg-muted p-3 rounded-md">
                              <p className="text-sm line-clamp-3">{item.content}</p>
                            </div>

                            <div className="text-xs text-muted-foreground">
                              <p><strong>Reason:</strong> {item.reason}</p>
                              <p><strong>Reported by:</strong> {item.reportedBy} • {new Date(item.reportedAt).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSingleAction(item, "approve")}
                            className="text-green-600 hover:text-green-700"
                            data-testid={`button-approve-${item.id}`}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSingleAction(item, "reject")}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-reject-${item.id}`}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSingleAction(item, "hide")}
                            data-testid={`button-hide-${item.id}`}
                          >
                            <EyeOff className="h-4 w-4" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-more-${item.id}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Advanced Moderation</DialogTitle>
                              </DialogHeader>
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => handleSingleAction(item, "warn")}
                                  className="justify-start"
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Warn User
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handleSingleAction(item, "suspend")}
                                  className="justify-start"
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Suspend User
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handleSingleAction(item, "ban")}
                                  className="justify-start text-red-600"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Ban User
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handleSingleAction(item, "delete")}
                                  className="justify-start text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Content
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Moderation Actions</CardTitle>
              <CardDescription>
                View recent moderation actions performed by administrators
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActions.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No Recent Actions</p>
                  <p className="text-muted-foreground">No moderation actions have been performed recently</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActions.map((action: ModerationAction) => (
                    <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getActionIcon(action.action)}
                        <div>
                          <p className="font-medium text-sm">
                            {action.action.charAt(0).toUpperCase() + action.action.slice(1)} {action.targetType}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {action.reason}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {new Date(action.timestamp).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Moderator: {action.moderatorId}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Moderation Analytics</CardTitle>
              <CardDescription>
                Forum moderation insights and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Content Reports by Type</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Spam</span>
                      <span>{moderationStats.reportsByType?.spam || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Inappropriate Content</span>
                      <span>{moderationStats.reportsByType?.inappropriate || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Harassment</span>
                      <span>{moderationStats.reportsByType?.harassment || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Off-topic</span>
                      <span>{moderationStats.reportsByType?.offtopic || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Moderation Actions (Last 7 Days)</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Approved</span>
                      <span className="text-green-600">{moderationStats.actionsByType?.approved || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Rejected</span>
                      <span className="text-red-600">{moderationStats.actionsByType?.rejected || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Hidden</span>
                      <span className="text-yellow-600">{moderationStats.actionsByType?.hidden || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Deleted</span>
                      <span className="text-red-700">{moderationStats.actionsByType?.deleted || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Moderation Action Dialog */}
      <Dialog open={showModerationDialog} onOpenChange={setShowModerationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Moderation Action</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitModeration)} className="space-y-4">
              <FormField
                control={form.control}
                name="action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-moderation-action">
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="approve">Approve</SelectItem>
                        <SelectItem value="reject">Reject</SelectItem>
                        <SelectItem value="hide">Hide</SelectItem>
                        <SelectItem value="delete">Delete</SelectItem>
                        <SelectItem value="warn">Warn User</SelectItem>
                        <SelectItem value="suspend">Suspend User</SelectItem>
                        <SelectItem value="ban">Ban User</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain the reason for this moderation action..."
                        {...field}
                        data-testid="textarea-moderation-reason"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(form.watch("action") === "suspend" || form.watch("action") === "ban") && (
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (days)</FormLabel>
                      <FormControl>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                          <SelectTrigger data-testid="select-duration">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 day</SelectItem>
                            <SelectItem value="3">3 days</SelectItem>
                            <SelectItem value="7">1 week</SelectItem>
                            <SelectItem value="14">2 weeks</SelectItem>
                            <SelectItem value="30">1 month</SelectItem>
                            <SelectItem value="0">Permanent</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModerationDialog(false)}
                  data-testid="button-cancel-moderation"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={moderationMutation.isPending}
                  data-testid="button-submit-moderation"
                >
                  {moderationMutation.isPending ? "Processing..." : "Apply Action"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}