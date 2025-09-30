import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Save,
  RefreshCw,
  Settings as SettingsIcon,
  Phone,
  Mail,
  Clock,
  Users,
} from "lucide-react";

interface CampaignSettings {
  max_call_attempts: number;
  call_interval_days: number;
  stop_call_outcomes: string[];
  allow_weekend_outreach: boolean;
  max_concurrent_calls: number;
  medicare_email_cadence_days: number[];
  nonmedicare_email_cadence_days: number[];
  max_medicare_email_attempts: number;
  max_nonmedicare_email_attempts: number;
  business_start_hour: number;
  business_end_hour: number;
  business_timezone: string;
  voice_profile_name: string;
  campaign_end_date: string;
  auto_extend_days: number;
}

const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona Time (MST)" },
  { value: "America/Anchorage", label: "Alaska Time (AKST)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
];

const CALL_OUTCOMES = [
  "interested",
  "not_interested",
  "dnc_requested",
  "callback_requested",
  "voicemail",
  "no_answer",
  "busy",
  "failed",
];

export default function Settings() {
  const [settings, setSettings] = useState<CampaignSettings>({
    max_call_attempts: 3,
    call_interval_days: 2,
    stop_call_outcomes: ["interested", "not_interested", "dnc_requested"],
    allow_weekend_outreach: false,
    max_concurrent_calls: 10,
    medicare_email_cadence_days: [0, 3, 7],
    nonmedicare_email_cadence_days: [0, 3, 7],
    max_medicare_email_attempts: 3,
    max_nonmedicare_email_attempts: 3,
    business_start_hour: 9,
    business_end_hour: 17,
    business_timezone: "America/New_York",
    voice_profile_name: "chad_alex",
    campaign_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    auto_extend_days: 30,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // API base: prefer env var, fallback to localhost
  const API_ROOT =
    (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env
      ?.VITE_API_BASE_URL || "http://localhost:8000";
  const API_BASE_URL = `${API_ROOT}/api/dashboard`;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        toast.error("Failed to load settings");
      }
    } catch (error) {
      toast.error("Error loading settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success("Settings saved successfully!");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      toast.error("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const updateArrayField = (field: keyof CampaignSettings, value: string) => {
    const numbers = value
      .split(",")
      .map((v) => parseInt(v.trim()))
      .filter((n) => !isNaN(n));
    setSettings((prev) => ({ ...prev, [field]: numbers }));
  };

  const toggleOutcome = (outcome: string) => {
    setSettings((prev) => ({
      ...prev,
      stop_call_outcomes: prev.stop_call_outcomes.includes(outcome)
        ? prev.stop_call_outcomes.filter((o) => o !== outcome)
        : [...prev.stop_call_outcomes, outcome],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Campaign Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure voice agent campaign parameters and business rules
          </p>
        </div>
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="min-w-[120px]"
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Core Campaign Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call Campaign Settings
            </CardTitle>
            <CardDescription>
              Configure call attempts, intervals, and outcomes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max_call_attempts">Max Call Attempts</Label>
                <Input
                  id="max_call_attempts"
                  type="number"
                  min="1"
                  max="10"
                  value={settings.max_call_attempts}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      max_call_attempts: parseInt(e.target.value) || 3,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="call_interval_days">Call Interval (Days)</Label>
                <Input
                  id="call_interval_days"
                  type="number"
                  min="1"
                  max="14"
                  value={settings.call_interval_days}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      call_interval_days: parseInt(e.target.value) || 2,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="max_concurrent_calls">Max Concurrent Calls</Label>
              <Input
                id="max_concurrent_calls"
                type="number"
                min="1"
                max="50"
                value={settings.max_concurrent_calls}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    max_concurrent_calls: parseInt(e.target.value) || 10,
                  }))
                }
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="allow_weekend_outreach"
                checked={settings.allow_weekend_outreach}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    allow_weekend_outreach: checked,
                  }))
                }
              />
              <Label htmlFor="allow_weekend_outreach">
                Allow Weekend Outreach
              </Label>
            </div>

            <div>
              <Label htmlFor="voice_profile_name">Voice Profile</Label>
              <Input
                id="voice_profile_name"
                value={settings.voice_profile_name}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    voice_profile_name: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label>Stop Call Outcomes</Label>
              <p className="text-sm text-gray-500 mb-2">
                Select outcomes that should stop further calling attempts
              </p>
              <div className="flex flex-wrap gap-2">
                {CALL_OUTCOMES.map((outcome) => (
                  <Badge
                    key={outcome}
                    variant={
                      settings.stop_call_outcomes.includes(outcome)
                        ? "default"
                        : "secondary"
                    }
                    className="cursor-pointer"
                    onClick={() => toggleOutcome(outcome)}
                  >
                    {outcome.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Campaign Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Campaign Settings
            </CardTitle>
            <CardDescription>
              Configure email cadence and attempt limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max_medicare_email_attempts">
                  Medicare Email Attempts
                </Label>
                <Input
                  id="max_medicare_email_attempts"
                  type="number"
                  min="1"
                  max="10"
                  value={settings.max_medicare_email_attempts}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      max_medicare_email_attempts:
                        parseInt(e.target.value) || 3,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="max_nonmedicare_email_attempts">
                  Non-Medicare Email Attempts
                </Label>
                <Input
                  id="max_nonmedicare_email_attempts"
                  type="number"
                  min="1"
                  max="10"
                  value={settings.max_nonmedicare_email_attempts}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      max_nonmedicare_email_attempts:
                        parseInt(e.target.value) || 3,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="medicare_cadence">
                Medicare Email Cadence (Days)
              </Label>
              <Input
                id="medicare_cadence"
                placeholder="0, 3, 7"
                value={settings.medicare_email_cadence_days.join(", ")}
                onChange={(e) =>
                  updateArrayField(
                    "medicare_email_cadence_days",
                    e.target.value
                  )
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Comma-separated days after initial contact
              </p>
            </div>

            <div>
              <Label htmlFor="nonmedicare_cadence">
                Non-Medicare Email Cadence (Days)
              </Label>
              <Input
                id="nonmedicare_cadence"
                placeholder="0, 3, 7"
                value={settings.nonmedicare_email_cadence_days.join(", ")}
                onChange={(e) =>
                  updateArrayField(
                    "nonmedicare_email_cadence_days",
                    e.target.value
                  )
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Comma-separated days after initial contact
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Business Hours & Timezone
            </CardTitle>
            <CardDescription>
              Set operating hours and timezone for campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="business_start_hour">Start Hour (24h)</Label>
                <Input
                  id="business_start_hour"
                  type="number"
                  min="0"
                  max="23"
                  value={settings.business_start_hour}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      business_start_hour: parseInt(e.target.value) || 9,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="business_end_hour">End Hour (24h)</Label>
                <Input
                  id="business_end_hour"
                  type="number"
                  min="0"
                  max="23"
                  value={settings.business_end_hour}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      business_end_hour: parseInt(e.target.value) || 17,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="business_timezone">Timezone</Label>
                <Select
                  value={settings.business_timezone}
                  onValueChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      business_timezone: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Management */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Campaign Management
            </CardTitle>
            <CardDescription>
              Configure campaign timeline and automatic extensions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="campaign_end_date">Campaign End Date</Label>
                <Input
                  id="campaign_end_date"
                  type="date"
                  value={settings.campaign_end_date}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      campaign_end_date: e.target.value,
                    }))
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  All campaign processing will stop on this date
                </p>
              </div>
              <div>
                <Label htmlFor="auto_extend_days">Auto-Extend Days</Label>
                <Input
                  id="auto_extend_days"
                  type="number"
                  min="1"
                  max="90"
                  value={settings.auto_extend_days}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      auto_extend_days: parseInt(e.target.value) || 30,
                    }))
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default extension period when manually extending campaigns
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Badge variant="secondary">Active</Badge>
                Main Campaign Status
              </h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-gray-500">
                    Current End Date
                  </Label>
                  <p className="font-medium">
                    {new Date(settings.campaign_end_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">
                    Days Remaining
                  </Label>
                  <p className="font-medium">
                    {Math.max(
                      0,
                      Math.ceil(
                        (new Date(settings.campaign_end_date).getTime() -
                          new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )}{" "}
                    days
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Quick Actions</Label>
                  <div className="flex gap-2 mt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const extendedDate = new Date(
                          settings.campaign_end_date
                        );
                        extendedDate.setDate(
                          extendedDate.getDate() + settings.auto_extend_days
                        );
                        setSettings((prev) => ({
                          ...prev,
                          campaign_end_date: extendedDate
                            .toISOString()
                            .split("T")[0],
                        }));
                        toast.success(
                          `Campaign extended by ${settings.auto_extend_days} days`
                        );
                      }}
                    >
                      Extend
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSettings((prev) => ({
                          ...prev,
                          campaign_end_date: new Date()
                            .toISOString()
                            .split("T")[0],
                        }));
                        toast.warning("Campaign will end today");
                      }}
                    >
                      Stop Today
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
