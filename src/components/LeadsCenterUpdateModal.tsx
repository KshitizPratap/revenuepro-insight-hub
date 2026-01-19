import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const STORAGE_KEY = "leadsCenterUpdateModalShown";
const DONE_UNTIL_KEY = "leadsCenterUpdateModalDoneUntil";
const TARGET_DAYS = [5, 6, 0]; // Friday (5), Saturday (6), Sunday (0)

export function LeadsCenterUpdateModal() {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const checkAndShowModal = () => {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      // Check if today is Friday, Saturday, or Sunday
      if (!TARGET_DAYS.includes(dayOfWeek)) {
        return;
      }

      // Check if user clicked "I've Already Done It" - don't show until next week
      const doneUntilDate = localStorage.getItem(DONE_UNTIL_KEY);
      if (doneUntilDate) {
        const todayString = today.toISOString().split("T")[0];
        // Compare date strings (YYYY-MM-DD format allows string comparison)
        if (todayString < doneUntilDate) {
          return;
        } else {
          // Expired, clear it
          localStorage.removeItem(DONE_UNTIL_KEY);
        }
      }

      // Get today's date string (YYYY-MM-DD) for localStorage key
      const todayString = today.toISOString().split("T")[0];
      const lastShownDate = localStorage.getItem(STORAGE_KEY);

      // Show modal if it hasn't been shown today
      if (lastShownDate !== todayString) {
        setIsOpen(true);
      }
    };

    checkAndShowModal();
  }, []);

  const handleClose = (open: boolean) => {
    if (!open) {
      const today = new Date();
      const todayString = today.toISOString().split("T")[0];
      localStorage.setItem(STORAGE_KEY, todayString);
      setIsOpen(false);
    }
  };

  const handleAlreadyDone = () => {
    // Set a date for next week's Friday (7 days from now, then find next Friday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Calculate days until next Friday
    let daysUntilNextFriday;
    if (dayOfWeek <= 5) {
      // If today is Sunday (0) through Friday (5), go to next Friday
      daysUntilNextFriday = 5 - dayOfWeek + 7;
    } else {
      // If today is Saturday (6), go to next Friday
      daysUntilNextFriday = 6;
    }
    
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilNextFriday);
    nextFriday.setHours(0, 0, 0, 0);
    
    // Mark today as shown and set done until next Friday
    const todayString = today.toISOString().split("T")[0];
    localStorage.setItem(STORAGE_KEY, todayString);
    localStorage.setItem(DONE_UNTIL_KEY, nextFriday.toISOString().split("T")[0]);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Time to Update Your Leads! 📊
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            Hey there! Just a friendly reminder to update your lead statuses before Sunday evening.
          </p>

          <p className="text-sm text-gray-700 leading-relaxed">
            We use the latest lead statuses to generate our weekly reports every Sunday night. Keeping your leads up-to-date ensures accurate reporting for the entire team.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm font-semibold text-gray-900 mb-2">Why this matters:</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Accurate weekly reports depend on current lead statuses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Helps the team stay aligned on progress</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Takes just a few minutes to review and update</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed pt-2">
            Please take a moment to review your leads and update their statuses in the{" "}
            <Link 
              to="/leads" 
              className="text-blue-600 hover:text-blue-800 underline font-semibold"
              onClick={() => handleClose(false)}
            >
              Lead Center
            </Link>
            .
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleAlreadyDone}
            className="px-6"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            I've Already Done It
          </Button>
          <Button
            asChild
            className="bg-[#1f1c13] hover:bg-[#2a2518] text-white px-6"
          >
            <Link to="/leads" onClick={() => handleClose(false)}>
              Go to Lead Center
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
