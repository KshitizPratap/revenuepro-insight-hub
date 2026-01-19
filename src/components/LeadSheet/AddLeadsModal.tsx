import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { doPOST } from "@/utils/HttpUtils";
import { Loader2, FileText, Table } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getStatusInfo } from "@/utils/leads/leadProcessing";

interface AddLeadsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string | null;
  onSuccess?: () => void;
}

type EntryMethod = "select" | "manual" | "google-sheet";

const LEAD_STATUSES = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "estimate_set", label: "Estimate Set" },
  { value: "virtual_quote", label: "Virtual Quote" },
  { value: "estimate_canceled", label: "Estimate Canceled" },
  { value: "proposal_presented", label: "Proposal Presented" },
  { value: "job_booked", label: "Job Booked" },
  { value: "job_lost", label: "Job Lost" },
  { value: "estimate_rescheduled", label: "Estimate Rescheduled" },
  { value: "unqualified", label: "Unqualified" },
] as const;

// Reusable FormField component
interface FormFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "number" | "date";
  required?: boolean;
  step?: string;
  onWheel?: (e: React.WheelEvent<HTMLInputElement>) => void;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  step,
  onWheel,
  className = "",
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        step={step}
        onWheel={onWheel}
      />
    </div>
  );
};

export const AddLeadsModal: React.FC<AddLeadsModalProps> = ({
  isOpen,
  onOpenChange,
  clientId,
  onSuccess,
}) => {
  const [entryMethod, setEntryMethod] = useState<EntryMethod>("select");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    leadName: "",
    email: "",
    phone: "",
    service: "",
    adSetName: "",
    adName: "",
    zip: "",
    leadDate: new Date().toISOString().split("T")[0],
    status: "new",
    proposalAmount: "",
    jobBookedAmount: "",
    unqualifiedLeadReason: "",
    notes: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Prevent number inputs from changing on scroll
  const handleNumberInputWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  // Form field configurations
  const formFields = [
    {
      id: "leadName",
      name: "leadName",
      label: "Lead Name",
      placeholder: "John Doe",
      type: "text" as const,
    },
    {
      id: "email",
      name: "email",
      label: "Email",
      placeholder: "john.doe@example.com",
      type: "email" as const,
      required: true,
    },
    {
      id: "phone",
      name: "phone",
      label: "Phone",
      placeholder: "+1234567890",
      type: "tel" as const,
      required: true,
    },
    {
      id: "service",
      name: "service",
      label: "Service",
      placeholder: "Roofing",
      type: "text" as const,
    },
    {
      id: "adSetName",
      name: "adSetName",
      label: "Ad Set Name",
      placeholder: "Summer Campaign 2026",
      type: "text" as const,
    },
    {
      id: "adName",
      name: "adName",
      label: "Ad Name",
      placeholder: "Discount Ad",
      type: "text" as const,
    },
    {
      id: "zip",
      name: "zip",
      label: "ZIP Code",
      placeholder: "12345",
      type: "text" as const,
    },
    {
      id: "leadDate",
      name: "leadDate",
      label: "Lead Date",
      type: "date" as const,
    },
    {
      id: "proposalAmount",
      name: "proposalAmount",
      label: "Proposal Amount ($)",
      placeholder: "5000",
      type: "number" as const,
      step: "0.01",
      onWheel: handleNumberInputWheel,
    },
    {
      id: "jobBookedAmount",
      name: "jobBookedAmount",
      label: "Job Booked Amount ($)",
      placeholder: "0",
      type: "number" as const,
      step: "0.01",
      onWheel: handleNumberInputWheel,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast({
        title: "Error",
        description: "No client selected. Please select a client first.",
        variant: "destructive",
      });
      return;
    }

    // Validate that at least email or phone is provided
    if (!formData.email && !formData.phone) {
      toast({
        title: "Validation Error",
        description: "Please provide at least an email or phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Helper function to parse and round monetary values to 2 decimal places
      const parseMonetaryValue = (value: string): number => {
        if (!value || value.trim() === "") return 0;
        const parsed = parseFloat(value);
        if (isNaN(parsed)) return 0;
        // Round to 2 decimal places to avoid floating-point precision issues
        return Math.round(parsed * 100) / 100;
      };

      const payload: any = {
        clientId,
        entrySource: "manual",
        ...(formData.leadName && { leadName: formData.leadName }),
        ...(formData.email && { email: formData.email }),
        ...(formData.phone && { phone: formData.phone }),
        ...(formData.service && { service: formData.service }),
        ...(formData.adSetName && { adSetName: formData.adSetName }),
        ...(formData.adName && { adName: formData.adName }),
        ...(formData.zip && { zip: formData.zip }),
        ...(formData.leadDate && { leadDate: formData.leadDate }),
        ...(formData.status && { status: formData.status }),
        ...(formData.proposalAmount && {
          proposalAmount: parseMonetaryValue(formData.proposalAmount),
        }),
        ...(formData.jobBookedAmount && {
          jobBookedAmount: parseMonetaryValue(formData.jobBookedAmount),
        }),
        ...(formData.unqualifiedLeadReason && {
          unqualifiedLeadReason: formData.unqualifiedLeadReason,
        }),
        ...(formData.notes && { notes: formData.notes }),
      };

      const response = await doPOST("/hooks/create-lead", payload);

      if (response.error) {
        toast({
          title: "Error",
          description: response.message || "Failed to create lead",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Lead created successfully",
        });
        // Reset form
        setFormData({
          leadName: "",
          email: "",
          phone: "",
          service: "",
          adSetName: "",
          adName: "",
          zip: "",
          leadDate: new Date().toISOString().split("T")[0],
          status: "new",
          proposalAmount: "",
          jobBookedAmount: "",
          unqualifiedLeadReason: "",
          notes: "",
        });
        setEntryMethod("select");
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setEntryMethod("select");
      setFormData({
        leadName: "",
        email: "",
        phone: "",
        service: "",
        adSetName: "",
        adName: "",
        zip: "",
        leadDate: new Date().toISOString().split("T")[0],
        status: "new",
        proposalAmount: "",
        jobBookedAmount: "",
        unqualifiedLeadReason: "",
        notes: "",
      });
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Leads</DialogTitle>
          <DialogDescription>
            Choose how you want to add leads to the system
          </DialogDescription>
        </DialogHeader>

        {entryMethod === "select" && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setEntryMethod("manual")}
                className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
              >
                <FileText className="w-12 h-12 text-blue-600 mb-3" />
                <h3 className="font-semibold text-lg mb-2">Manually</h3>
                <p className="text-sm text-gray-600 text-center">
                  Enter lead information manually using the form
                </p>
              </button>

              <button
                onClick={() => setEntryMethod("google-sheet")}
                disabled
                className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg transition-all cursor-not-allowed opacity-50 bg-gray-50"
              >
                <Table className="w-12 h-12 text-gray-400 mb-3" />
                <h3 className="font-semibold text-lg mb-2 text-gray-500">Google Sheet</h3>
                <p className="text-sm text-gray-500 text-center">
                  Import leads from a Google Sheet (Coming soon)
                </p>
              </button>
            </div>
          </div>
        )}

        {entryMethod === "google-sheet" && (
          <div className="space-y-4 py-4">
            <div className="text-center py-8">
              <Table className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Google Sheet Import
              </h3>
              <p className="text-gray-600">
                This feature is coming soon. Please use the manual entry option
                for now.
              </p>
              <Button
                variant="outline"
                onClick={() => setEntryMethod("select")}
                className="mt-4"
              >
                Go Back
              </Button>
            </div>
          </div>
        )}

        {entryMethod === "manual" && (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formFields.map((field) => (
                <FormField
                  key={field.id}
                  id={field.id}
                  name={field.name}
                  label={field.label}
                  value={formData[field.name as keyof typeof formData] as string}
                  onChange={handleInputChange}
                  placeholder={field.placeholder}
                  type={field.type}
                  required={field.required}
                  step={field.step}
                  onWheel={field.onWheel}
                />
              ))}

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status">
                      {formData.status && (
                        <span className={`px-2 py-1 rounded text-xs border ${getStatusInfo(formData.status).color}`}>
                          {getStatusInfo(formData.status).label}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((status) => {
                      const statusInfo = getStatusInfo(status.value);
                      return (
                        <SelectItem key={status.value} value={status.value} className="text-sm">
                          <span className="inline-flex items-center gap-2">
                            <div className={`w-2 h-2 ${statusInfo.dotColor} rounded-full`}></div>
                            {statusInfo.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Unqualified Lead Reason */}
              {formData.status === "unqualified" && (
                <FormField
                  id="unqualifiedLeadReason"
                  name="unqualifiedLeadReason"
                  label="Unqualified Lead Reason"
                  value={formData.unqualifiedLeadReason}
                  onChange={handleInputChange}
                  placeholder="Reason for unqualified lead"
                  className="md:col-span-2"
                />
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes (max 2000 characters)"
                rows={3}
                maxLength={2000}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEntryMethod("select")}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Lead"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
