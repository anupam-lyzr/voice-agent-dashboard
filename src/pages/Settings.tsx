import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Save,
  RefreshCw,
  Settings as SettingsIcon,
  Phone,
  Mail,
  Play,
  Pause,
  Shield,
  AlertTriangle,
} from "lucide-react";

// API base: prefer env var, fallback to localhost
const API_ROOT =
  (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL || "http://localhost:8000";
const API_BASE_URL = `${API_ROOT}/api/dashboard`;

interface CampaignConfig {
  campaign_id: string;
  status: "active" | "paused";
  campaign_name: string;
  campaign_type: string;
  medicare_settings: {
    enabled: boolean;
    max_email_attempts: number;
    email_cadence_days: number[];
    email_templates: string[];
  };
  non_medicare_call_settings: {
    enabled: boolean;
    max_call_attempts: number;
    call_cadence_days: number[];
    stop_conditions: string[];
  };
  non_medicare_email_settings: {
    enabled: boolean;
    max_email_attempts: number;
    email_cadence_days: number[];
  };
  max_daily_emails_per_client: number;
  max_daily_calls_per_client: number;
  min_hours_between_contacts: number;
  batch_size: number;
}

export default function Settings() {
  const [config, setConfig] = useState<CampaignConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showStopDialog, setShowStopDialog] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/campaign/config`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
      } else {
        toast.error("Failed to load campaign configuration");
      }
    } catch (error) {
      toast.error("Error loading configuration");
    } finally {
      setLoading(false);
    }
  };

  const startCampaign = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/campaign/start`, {
        method: "POST",
      });
      if (response.ok) {
        toast.success("Campaign started successfully!");
        await loadConfig();
      } else {
        toast.error("Failed to start campaign");
      }
    } catch (error) {
      toast.error("Error starting campaign");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmStopCampaign = () => {
    setShowStopDialog(true);
  };

  const stopCampaign = async () => {
    setShowStopDialog(false);
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/campaign/stop`, {
        method: "POST",
      });
      if (response.ok) {
        toast.success("Campaign paused successfully!");
        await loadConfig();
      } else {
        toast.error("Failed to pause campaign");
      }
    } catch (error) {
      toast.error("Error pausing campaign");
    } finally {
      setActionLoading(false);
    }
  };

  const saveMedicareSettings = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/campaign/config/medicare`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config.medicare_settings),
      });
      if (response.ok) {
        toast.success("Medicare settings saved!");
      } else {
        toast.error("Failed to save Medicare settings");
      }
    } catch (error) {
      toast.error("Error saving Medicare settings");
    } finally {
      setSaving(false);
    }
  };

  const saveNonMedicareCallSettings = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/campaign/config/non-medicare-calls`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config.non_medicare_call_settings),
        }
      );
      if (response.ok) {
        toast.success("Non-Medicare call settings saved!");
      } else {
        toast.error("Failed to save non-Medicare call settings");
      }
    } catch (error) {
      toast.error("Error saving non-Medicare call settings");
    } finally {
      setSaving(false);
    }
  };

  const saveNonMedicareEmailSettings = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/campaign/config/non-medicare-emails`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config.non_medicare_email_settings),
        }
      );
      if (response.ok) {
        toast.success("Non-Medicare email settings saved!");
      } else {
        toast.error("Failed to save non-Medicare email settings");
      }
    } catch (error) {
      toast.error("Error saving non-Medicare email settings");
    } finally {
      setSaving(false);
    }
  };

  const saveAntiSpamSettings = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/campaign/config/anti-spam`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            max_daily_emails_per_client: config.max_daily_emails_per_client,
            max_daily_calls_per_client: config.max_daily_calls_per_client,
            min_hours_between_contacts: config.min_hours_between_contacts,
          }),
        }
      );
      if (response.ok) {
        toast.success("Anti-spam settings saved!");
      } else {
        toast.error("Failed to save anti-spam settings");
      }
    } catch (error) {
      toast.error("Error saving anti-spam settings");
    } finally {
      setSaving(false);
    }
  };

  const updateArrayField = (
    section:
      | "medicare_settings"
      | "non_medicare_call_settings"
      | "non_medicare_email_settings",
    field: string,
    value: string
  ) => {
    const numbers = value
      .split(",")
      .map((v) => parseInt(v.trim()))
      .filter((n) => !isNaN(n));
    setConfig((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: numbers,
        },
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading campaign configuration...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="max-w-6xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load campaign configuration. Please try refreshing the
            page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Campaign Configuration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage campaign settings for Medicare and non-Medicare clients
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={
              config.status === "active" ? confirmStopCampaign : startCampaign
            }
            disabled={actionLoading}
            variant={config.status === "active" ? "destructive" : "default"}
          >
            {actionLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : config.status === "active" ? (
              <Pause className="h-4 w-4 mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {config.status === "active" ? "Pause Campaign" : "Start Campaign"}
          </Button>
        </div>
      </div>

      {/* Stop Campaign Confirmation Dialog */}
      <AlertDialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pause Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately stop all campaign processing including:
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Medicare email campaigns</li>
                <li>Non-Medicare call campaigns</li>
                <li>Non-Medicare email fallback campaigns</li>
              </ul>
              <p className="mt-3 font-semibold text-red-600">
                No new contacts will be made until you start the campaign again.
              </p>
              <p className="mt-2 text-sm">
                Clients will remain in their current state and resume from where
                they left off when you restart.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={stopCampaign}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Pause Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Campaign Status Alert */}
      <Alert variant={config.status === "active" ? "default" : "destructive"}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant={config.status === "active" ? "default" : "secondary"}
            >
              {config.status.toUpperCase()}
            </Badge>
            <span className="text-sm">
              Campaign is currently{" "}
              {config.status === "active" ? "running" : "paused"}
            </span>
          </div>
        </div>
      </Alert>

      {/* Medicare Email Campaign */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Medicare Email Campaign
              </CardTitle>
              <CardDescription>
                Progressive email campaign for Medicare clients (6 emails)
              </CardDescription>
            </div>
            <Switch
              checked={config.medicare_settings.enabled}
              onCheckedChange={(checked) =>
                setConfig((prev) => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    medicare_settings: {
                      ...prev.medicare_settings,
                      enabled: checked,
                    },
                  };
                })
              }
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Max Email Attempts</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={config.medicare_settings.max_email_attempts}
                onChange={(e) =>
                  setConfig((prev) => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      medicare_settings: {
                        ...prev.medicare_settings,
                        max_email_attempts: parseInt(e.target.value) || 6,
                      },
                    };
                  })
                }
              />
            </div>
            <div>
              <Label>Status</Label>
              <div className="mt-2">
                <Badge
                  variant={
                    config.medicare_settings.enabled ? "default" : "secondary"
                  }
                >
                  {config.medicare_settings.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <Label>Email Cadence (Days)</Label>
            <Input
              placeholder="0, 2, 4, 7, 10, 14"
              value={config.medicare_settings.email_cadence_days.join(", ")}
              onChange={(e) =>
                updateArrayField(
                  "medicare_settings",
                  "email_cadence_days",
                  e.target.value
                )
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Days after first email (0 = immediate, 2 = 2 days later, etc.)
            </p>
          </div>

          <Button onClick={saveMedicareSettings} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Medicare Settings
          </Button>
        </CardContent>
      </Card>

      {/* Non-Medicare Call Campaign */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Non-Medicare Call Campaign
              </CardTitle>
              <CardDescription>
                Voice outreach campaign for non-Medicare clients (6 calls)
              </CardDescription>
            </div>
            <Switch
              checked={config.non_medicare_call_settings.enabled}
              onCheckedChange={(checked) =>
                setConfig((prev) => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    non_medicare_call_settings: {
                      ...prev.non_medicare_call_settings,
                      enabled: checked,
                    },
                  };
                })
              }
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Max Call Attempts</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={config.non_medicare_call_settings.max_call_attempts}
                onChange={(e) =>
                  setConfig((prev) => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      non_medicare_call_settings: {
                        ...prev.non_medicare_call_settings,
                        max_call_attempts: parseInt(e.target.value) || 6,
                      },
                    };
                  })
                }
              />
            </div>
            <div>
              <Label>Status</Label>
              <div className="mt-2">
                <Badge
                  variant={
                    config.non_medicare_call_settings.enabled
                      ? "default"
                      : "secondary"
                  }
                >
                  {config.non_medicare_call_settings.enabled
                    ? "Enabled"
                    : "Disabled"}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <Label>Call Cadence (Days)</Label>
            <Input
              placeholder="0, 2, 4, 7, 10, 14"
              value={config.non_medicare_call_settings.call_cadence_days.join(
                ", "
              )}
              onChange={(e) =>
                updateArrayField(
                  "non_medicare_call_settings",
                  "call_cadence_days",
                  e.target.value
                )
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Days after first call (0 = immediate, 2 = 2 days later, etc.)
            </p>
          </div>

          <Button onClick={saveNonMedicareCallSettings} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Call Settings
          </Button>
        </CardContent>
      </Card>

      {/* Non-Medicare Email Fallback */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Non-Medicare Email Fallback
              </CardTitle>
              <CardDescription>
                Fallback email campaign after failed calls (6 emails)
              </CardDescription>
            </div>
            <Switch
              checked={config.non_medicare_email_settings.enabled}
              onCheckedChange={(checked) =>
                setConfig((prev) => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    non_medicare_email_settings: {
                      ...prev.non_medicare_email_settings,
                      enabled: checked,
                    },
                  };
                })
              }
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Max Email Attempts</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={config.non_medicare_email_settings.max_email_attempts}
                onChange={(e) =>
                  setConfig((prev) => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      non_medicare_email_settings: {
                        ...prev.non_medicare_email_settings,
                        max_email_attempts: parseInt(e.target.value) || 6,
                      },
                    };
                  })
                }
              />
            </div>
            <div>
              <Label>Status</Label>
              <div className="mt-2">
                <Badge
                  variant={
                    config.non_medicare_email_settings.enabled
                      ? "default"
                      : "secondary"
                  }
                >
                  {config.non_medicare_email_settings.enabled
                    ? "Enabled"
                    : "Disabled"}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <Label>Email Cadence (Days)</Label>
            <Input
              placeholder="0, 2, 4, 7, 10, 14"
              value={config.non_medicare_email_settings.email_cadence_days.join(
                ", "
              )}
              onChange={(e) =>
                updateArrayField(
                  "non_medicare_email_settings",
                  "email_cadence_days",
                  e.target.value
                )
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Days after transition to email phase
            </p>
          </div>

          <Button onClick={saveNonMedicareEmailSettings} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Email Fallback Settings
          </Button>
        </CardContent>
      </Card>

      {/* Anti-Spam Safeguards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Anti-Spam Safeguards
          </CardTitle>
          <CardDescription>
            Hard limits to prevent excessive contact attempts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              These are HARD LIMITS enforced at multiple levels. Changes affect
              all campaigns immediately.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Max Emails Per Day</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={config.max_daily_emails_per_client}
                onChange={(e) =>
                  setConfig((prev) => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      max_daily_emails_per_client:
                        parseInt(e.target.value) || 1,
                    };
                  })
                }
              />
              <p className="text-xs text-gray-500 mt-1">Per client per day</p>
            </div>

            <div>
              <Label>Max Calls Per Day</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={config.max_daily_calls_per_client}
                onChange={(e) =>
                  setConfig((prev) => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      max_daily_calls_per_client: parseInt(e.target.value) || 1,
                    };
                  })
                }
              />
              <p className="text-xs text-gray-500 mt-1">Per client per day</p>
            </div>

            <div>
              <Label>Min Hours Between Contacts</Label>
              <Input
                type="number"
                min="12"
                max="72"
                value={config.min_hours_between_contacts}
                onChange={(e) =>
                  setConfig((prev) => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      min_hours_between_contacts:
                        parseInt(e.target.value) || 24,
                    };
                  })
                }
              />
              <p className="text-xs text-gray-500 mt-1">Any contact type</p>
            </div>
          </div>

          <Button
            onClick={saveAntiSpamSettings}
            disabled={saving}
            variant="destructive"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Anti-Spam Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
