import { Bell, Save } from "lucide-react";
import {
  Form,
  useDataProvider,
  useGetIdentity,
  useGetOne,
  useNotify,
  useRecordContext,
} from "ra-core";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SelectInput } from "@/components/admin/select-input";

interface ReminderPreferences {
  id?: number;
  sales_id: number;
  email_enabled: boolean;
  default_hours_before: number;
  created_at?: string;
  updated_at?: string;
}

const HOURS_BEFORE_OPTIONS = [
  { id: 1, name: "1 hour before" },
  { id: 2, name: "2 hours before" },
  { id: 4, name: "4 hours before" },
  { id: 8, name: "8 hours before" },
  { id: 24, name: "1 day before" },
  { id: 48, name: "2 days before" },
  { id: 72, name: "3 days before" },
  { id: 168, name: "1 week before" },
];

export const ReminderSettings = () => {
  const { identity } = useGetIdentity();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const [loading, setLoading] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [defaultHoursBefore, setDefaultHoursBefore] = useState(24);
  const [preferences, setPreferences] = useState<ReminderPreferences | null>(null);

  // Load existing preferences
  useEffect(() => {
    if (!identity) return;

    const loadPreferences = async () => {
      try {
        const { data } = await dataProvider.getList("reminder_preferences", {
          filter: { sales_id: identity.id },
          pagination: { page: 1, perPage: 1 },
          sort: { field: "id", order: "DESC" },
        });

        if (data && data.length > 0) {
          const prefs = data[0] as ReminderPreferences;
          setPreferences(prefs);
          setEmailEnabled(prefs.email_enabled);
          setDefaultHoursBefore(prefs.default_hours_before);
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
      }
    };

    loadPreferences();
  }, [identity, dataProvider]);

  const handleSave = async () => {
    if (!identity) return;

    setLoading(true);
    try {
      const data: ReminderPreferences = {
        sales_id: identity.id,
        email_enabled: emailEnabled,
        default_hours_before: defaultHoursBefore,
      };

      if (preferences?.id) {
        // Update existing
        await dataProvider.update("reminder_preferences", {
          id: preferences.id,
          data,
          previousData: preferences,
        });
      } else {
        // Create new
        await dataProvider.create("reminder_preferences", { data });
      }

      notify("Reminder preferences saved successfully");
    } catch (error) {
      notify("Failed to save preferences. Please try again.", { type: "error" });
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!identity) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <CardTitle>Task Reminders</CardTitle>
        </div>
        <CardDescription>
          Configure when and how you receive task reminder notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Reminders Toggle */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="email-enabled" className="text-base font-medium">
              Email Reminders
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive email notifications for upcoming tasks
            </p>
          </div>
          <Switch
            id="email-enabled"
            checked={emailEnabled}
            onCheckedChange={setEmailEnabled}
          />
        </div>

        {/* Default Reminder Time */}
        <div className="space-y-2">
          <Label className="text-base font-medium">Default Reminder Time</Label>
          <p className="text-sm text-muted-foreground mb-3">
            How far in advance should you be reminded about tasks?
          </p>
          <select
            value={defaultHoursBefore}
            onChange={(e) => setDefaultHoursBefore(Number(e.target.value))}
            disabled={!emailEnabled}
            className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            {HOURS_BEFORE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        {/* Info Box */}
        <div className="rounded-lg bg-muted p-4 text-sm">
          <p className="font-medium mb-2">How it works:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>
              Reminders are sent automatically based on your default time preference
            </li>
            <li>You'll receive one reminder per task before the due date</li>
            <li>Completed tasks won't send reminders</li>
            <li>
              You can customize reminder time when creating individual tasks
            </li>
          </ul>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
