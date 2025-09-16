import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Copy,
  Printer,
  Download,
  Mail,
  ToggleLeft,
  ToggleRight,
  Edit,
  Trash2,
  Plus,
  Filter,
  RefreshCw,
  Loader2
} from "lucide-react";

type SortDirection = "asc" | "desc" | null;

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface AdminDataTableProps {
  entityType: string;
  title: string;
  description: string;
  columns: Column[];
  actions?: {
    copy?: boolean;
    print?: boolean;
    download?: boolean;
    email?: boolean;
    changeStatus?: boolean;
    edit?: boolean;
    delete?: boolean;
  };
  onCreate?: () => void;
  onEdit?: (item: any) => void;
  onStatusChange?: (item: any, newStatus: string) => void;
}

export function AdminDataTable({
  entityType,
  title,
  description,
  columns,
  actions = {
    copy: true,
    print: true,
    download: true,
    email: true,
    changeStatus: true,
    edit: true,
    delete: true
  },
  onCreate,
  onEdit,
  onStatusChange
}: AdminDataTableProps) {
  const { toast } = useToast();
  
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch data
  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: [`/api/admin/${entityType}`],
    enabled: !!entityType
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/${entityType}/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/${entityType}`] });
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filtered and sorted data
  const processedData = useMemo(() => {
    let filtered = items as any[];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((item: any) => {
        const searchableText = columns
          .map(col => {
            const value = item[col.key];
            return typeof value === 'string' ? value : String(value || '');
          })
          .join(' ')
          .toLowerCase();
        return searchableText.includes(searchTerm.toLowerCase());
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item: any) => {
        if (statusFilter === "active") return item.isActive === true || item.status === "active";
        if (statusFilter === "inactive") return item.isActive === false || item.status === "inactive";
        return item.status === statusFilter;
      });
    }

    // Apply sorting
    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        
        if (aValue === bValue) return 0;
        
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (aValue instanceof Date && bValue instanceof Date) {
          comparison = aValue.getTime() - bValue.getTime();
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }
        
        return sortDirection === "desc" ? -comparison : comparison;
      });
    }

    return filtered;
  }, [items, searchTerm, sortColumn, sortDirection, statusFilter, columns]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = processedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Sorting handler
  const handleSort = (column: string) => {
    if (!columns.find(col => col.key === column)?.sortable) return;
    
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Action handlers
  const handleCopy = async (item: any) => {
    try {
      const text = JSON.stringify(item, null, 2);
      await navigator.clipboard.writeText(text);
      toast({
        title: "Success",
        description: "Item data copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy data",
        variant: "destructive",
      });
    }
  };

  const handlePrint = (item: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Print ${title}</title></head>
          <body>
            <h1>${title}</h1>
            <pre>${JSON.stringify(item, null, 2)}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = (item: any) => {
    const dataStr = JSON.stringify(item, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entityType}-${item.id || 'export'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleEmail = (item: any) => {
    const subject = encodeURIComponent(`${title} Data Export`);
    const body = encodeURIComponent(`Please find the ${title} data below:\n\n${JSON.stringify(item, null, 2)}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const getSortIcon = (column: string) => {
    if (!columns.find(col => col.key === column)?.sortable) return null;
    
    if (sortColumn === column) {
      if (sortDirection === "asc") return <ArrowUp className="h-3 w-3" />;
      if (sortDirection === "desc") return <ArrowDown className="h-3 w-3" />;
    }
    return <ArrowUpDown className="h-3 w-3 opacity-50" />;
  };

  const getStatusBadge = (item: any) => {
    if (item.isActive !== undefined) {
      return (
        <Badge variant={item.isActive ? "default" : "secondary"}>
          {item.isActive ? "Active" : "Inactive"}
        </Badge>
      );
    }
    if (item.status) {
      const variant = item.status === "active" || item.status === "completed" ? "default" : "secondary";
      return <Badge variant={variant}>{item.status}</Badge>;
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
              data-testid="button-refresh"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            {onCreate && (
              <Button
                onClick={onCreate}
                className="gap-2"
                data-testid="button-create-new"
              >
                <Plus className="h-4 w-4" />
                Add New
              </Button>
            )}
          </div>
        </div>
        
        {/* Filters and Search */}
        <div className="flex items-center gap-4 pt-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              data-testid="input-search"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32" data-testid="select-status-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="w-24" data-testid="select-page-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={column.sortable ? "cursor-pointer hover:bg-muted/70" : ""}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {getSortIcon(column.key)}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm ? `No results found for "${searchTerm}"` : `No ${title.toLowerCase()} found`}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item: any, index) => (
                  <TableRow key={item.id || index} className="hover-elevate">
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        {column.render ? column.render(item[column.key], item) : (
                          <div className="flex items-center gap-2">
                            {item[column.key]}
                            {column.key === 'status' || column.key === 'isActive' ? getStatusBadge(item) : null}
                          </div>
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            data-testid={`button-actions-${item.id}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          {actions.copy && (
                            <DropdownMenuItem onClick={() => handleCopy(item)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Data
                            </DropdownMenuItem>
                          )}
                          
                          {actions.print && (
                            <DropdownMenuItem onClick={() => handlePrint(item)}>
                              <Printer className="h-4 w-4 mr-2" />
                              Print
                            </DropdownMenuItem>
                          )}
                          
                          {actions.download && (
                            <DropdownMenuItem onClick={() => handleDownload(item)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                          )}
                          
                          {actions.email && (
                            <DropdownMenuItem onClick={() => handleEmail(item)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Email
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          {actions.edit && onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(item)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          
                          {actions.changeStatus && onStatusChange && (
                            <DropdownMenuItem 
                              onClick={() => onStatusChange(item, item.isActive ? 'inactive' : 'active')}
                            >
                              {item.isActive ? (
                                <>
                                  <ToggleLeft className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                          
                          {actions.delete && (
                            <>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the item.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(item.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                data-testid="button-prev-page"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-10"
                      data-testid={`button-page-${pageNum}`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                data-testid="button-next-page"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}