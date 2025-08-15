import { useState } from "react";
import { Download, FileText, FileJson, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV, exportToJSON, ExportConfig } from "@/lib/export-utils";

interface ExportButtonProps<T = any> {
  data: T[];
  config: Omit<ExportConfig<T>, "data">;
  disabled?: boolean;
  variant?: "button" | "dropdown";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function ExportButton<T = any>({
  data,
  config,
  disabled = false,
  variant = "button",
  size = "default",
  className = "",
}: ExportButtonProps<T>) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExportCSV = async () => {
    if (isExporting || disabled) return;

    setIsExporting(true);
    try {
      exportToCSV({
        ...config,
        data,
      });

      toast({
        title: "Export Complete",
        description: `Successfully exported ${data.length} records to CSV`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    if (isExporting || disabled) return;

    setIsExporting(true);
    try {
      exportToJSON({
        ...config,
        data,
      });

      toast({
        title: "Export Complete",
        description: `Successfully exported ${data.length} records to JSON`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (variant === "dropdown") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={size}
            disabled={disabled || data.length === 0 || isExporting}
            className={className}
          >
            <MoreHorizontal className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExportCSV} disabled={isExporting}>
            <FileText className="mr-2 h-4 w-4" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportJSON} disabled={isExporting}>
            <FileJson className="mr-2 h-4 w-4" />
            Export as JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleExportCSV}
      disabled={disabled || data.length === 0 || isExporting}
      className={className}
    >
      <Download className="h-4 w-4 mr-2" />
      {isExporting ? "Exporting..." : "Export CSV"}
    </Button>
  );
}

// Convenience component for CSV-only export
export function ExportCSVButton<T = any>(props: ExportButtonProps<T>) {
  return <ExportButton {...props} variant="button" />;
}

// Convenience component for dropdown with multiple formats
export function ExportDropdown<T = any>(props: ExportButtonProps<T>) {
  return <ExportButton {...props} variant="dropdown" />;
}
