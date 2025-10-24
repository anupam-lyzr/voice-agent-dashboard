import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Users,
  Phone,
  CheckCircle,
  TrendingUp,
  Activity,
  RefreshCw,
  MessageSquare,
  PhoneOff,
  XCircle,
  UserX,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Ban,
  Mail,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "../components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

interface CampaignStats {
  total_clients: number;
  completed_calls: number;
  interested_clients: number;
  not_interested_clients: number;
  dnc_requests: number;
  no_answer_clients: number;
  pending_clients: number;
  completion_rate: number;
  interest_rate: number;
  real_outcomes: Record<string, number>;
  last_updated: string;

  // NEW FIELDS
  total_conversations?: number;
  avg_call_duration?: number;
  call_status_breakdown?: {
    total_calls_made: number;
    calls_answered: number;
    voicemail: number;
    busy: number;
    failed: number;
    no_contact: number;
  };
  conversation_outcomes_breakdown?: {
    interested_yes_no: number;
    schedule_invite_yes_yes: number;
    not_interested_no: number;
    dnc_requested_no_no: number;
    keep_communications_no_yes: number;
    voicemail: number;
    no_outcome: number;
  };
}

interface CallLog {
  call_id: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  outcome: string;
  duration: string;
  started_at: string;
  is_test_call?: boolean;
  total_attempts?: number;
  attempts_left?: number;
  next_call_scheduled?: string;
  agent_assigned?: string;
  outreach_method?: string; // "voice_call" | "email"
  client_type?: string; // "medicare" | "non_medicare"
}

interface ClientRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  agent: string;
  client_type: "medicare" | "non_medicare" | string;
  status: string;
  attempts: number;
  contact_type: "call" | "email";
  last_contacted: string | null;
  tags: string[];
}

interface ActiveCallRow {
  call_sid?: string;
  client_name?: string;
  status?: string;
  call_status?: string;
  conversation_turns?: number;
  turns?: number;
  started_at?: string;
  outreach_method?: "voice_call" | "email" | string;
  client_type?: "medicare" | "non_medicare" | string;
  client_email?: string;
  client_phone?: string;
}

// API base: prefer env var, fallback to localhost
const API_ROOT =
  (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL || "http://localhost:8000";
const API_BASE_URL = `${API_ROOT}/api/dashboard`;

export default function Dashboard() {
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  // const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Clients table state
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [clientsTotal, setClientsTotal] = useState(0);
  const [clientsPage, setClientsPage] = useState(1);
  const [clientsSearch, setClientsSearch] = useState("");
  const [clientsTypeFilter, setClientsTypeFilter] = useState<string>("");
  const [clientsStatusFilter, setClientsStatusFilter] = useState<string>("");
  const [clientsTagFilter, setClientsTagFilter] = useState<string>("");
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [activeTab, setActiveTab] = useState("analytics");

  // Active calls
  const [activeCalls, setActiveCalls] = useState<ActiveCallRow[]>([]);
  const [isLoadingActiveCalls, setIsLoadingActiveCalls] = useState(false);

  // Settings state
  // const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  // const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Campaign progress state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [campaignProgress, setCampaignProgress] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // const [maxAttempts, setMaxAttempts] = useState<string>("6");
  // const [stopOutcomes, setStopOutcomes] = useState<string>(
  //   "interested,not_interested,dnc_requested"
  // );
  // const [medicareCadence, setMedicareCadence] = useState<string>("0,3,7,14");
  // const [nonMedicareCadence, setNonMedicareCadence] =
  //   useState<string>("0,3,7,14");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, callLogsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/stats`),
        fetch(`${API_BASE_URL}/call-logs?limit=10`),
        fetch(`${API_BASE_URL}/system-health`),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (callLogsRes.ok) {
        const logsData = await callLogsRes.json();
        setCallLogs(logsData.logs || []);
      }

      setLastRefresh(new Date());
      toast.success("Dashboard data refreshed");
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to refresh dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  // const refreshSystemHealth = async () => {
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/system-health/refresh`, {
  //       method: "POST",
  //     });
  //     if (response.ok) {
  //       const healthData = await response.json();
  //       setHealth(healthData);
  //       setLastRefresh(new Date());
  //       toast.success("System health refreshed");
  //     } else {
  //       toast.error("Failed to refresh system health");
  //     }
  //   } catch (error) {
  //     console.error("Failed to refresh system health:", error);
  //     toast.error("Failed to refresh system health");
  //   }
  // };

  // define callbacks before effects to avoid use-before-define
  const fetchActiveCalls = useCallback(async () => {
    try {
      setIsLoadingActiveCalls(true);
      const res = await fetch(`${API_BASE_URL}/active-calls`);
      if (res.ok) {
        const data = await res.json();
        setActiveCalls(data.calls || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingActiveCalls(false);
    }
  }, []);

  const fetchClients = useCallback(
    async (page = 1) => {
      try {
        setIsLoadingClients(true);
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("page_size", "50");
        if (clientsSearch) params.set("search", clientsSearch);
        if (clientsTypeFilter) params.set("client_type", clientsTypeFilter);
        if (clientsStatusFilter) params.set("status", clientsStatusFilter);
        if (clientsTagFilter) params.set("tag", clientsTagFilter);
        const res = await fetch(`${API_BASE_URL}/clients?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setClients(data.clients || []);
          setClientsTotal(data.total || 0);
          setClientsPage(data.page || page);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingClients(false);
      }
    },
    [clientsSearch, clientsTypeFilter, clientsStatusFilter, clientsTagFilter]
  );

  useEffect(() => {
    fetchData();
    fetchClients(1);
    fetchCampaignProgress();
    // Removed automatic polling - now only manual refresh
  }, [fetchClients]);

  useEffect(() => {
    if (activeTab === "active") {
      fetchActiveCalls();
    } else if (activeTab === "health") {
      fetchData();
    }
  }, [activeTab, fetchActiveCalls, fetchClients]);

  // moved earlier

  // moved earlier

  const fetchCampaignProgress = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/campaign-progress`);
      if (!res.ok) throw new Error("Failed to fetch campaign progress");
      const data = await res.json();
      setCampaignProgress(data);
    } catch (error) {
      console.error("Campaign progress fetch error:", error);
    }
  };

  // const fetchSettings = async () => {
  //   try {
  //     setIsLoadingSettings(true);
  //     const res = await fetch(`${API_BASE_URL}/settings`);
  //     if (!res.ok) throw new Error("Settings fetch failed");
  //     const data = await res.json();
  //     setMaxAttempts(String(data.max_call_attempts ?? 6));
  //     setStopOutcomes(
  //       (
  //         data.stop_call_outcomes || [
  //           "interested",
  //           "not_interested",
  //           "dnc_requested",
  //         ]
  //       ).join(",")
  //     );
  //     setMedicareCadence(
  //       (data.medicare_email_cadence_days || [0, 3, 7, 14]).join(",")
  //     );
  //     setNonMedicareCadence(
  //       (data.nonmedicare_email_cadence_days || [0, 3, 7, 14]).join(",")
  //     );
  //   } catch (err) {
  //     console.error(err);
  //     toast.error("Failed to load settings");
  //   } finally {
  //     setIsLoadingSettings(false);
  //   }
  // };

  const getOutcomeBadge = (outcome: string) => {
    const outcomeMap = {
      interested: { variant: "default" as const, color: "text-green-600" },
      not_interested: { variant: "secondary" as const, color: "text-gray-600" },
      dnc_requested: { variant: "destructive" as const, color: "text-red-600" },
      no_answer: { variant: "outline" as const, color: "text-yellow-600" },
    };
    return (
      outcomeMap[outcome as keyof typeof outcomeMap] || {
        variant: "outline" as const,
        color: "text-gray-600",
      }
    );
  };

  if (isLoading && !stats) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Voice Agent Dashboard
            </h1>
            <p className="text-muted-foreground">
              Production campaign monitoring and testing interface
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={async () => {
                try {
                  setIsProcessing(true);
                  const res = await fetch(
                    `${API_BASE_URL}/trigger-campaign-processor`,
                    { method: "POST" }
                  );
                  if (res.ok) {
                    const data = await res.json();
                    toast.success(
                      data.message || "Campaign started successfully"
                    );
                    // Refresh campaign progress and stats
                    await fetchCampaignProgress();
                  } else {
                    toast.error("Failed to start campaign");
                  }
                } catch (error) {
                  console.error("Start campaign error:", error);
                  toast.error("Failed to start campaign");
                } finally {
                  setIsProcessing(false);
                }
              }}
              disabled={isProcessing}
              size="sm"
            >
              {isProcessing ? "Starting..." : "Start Campaign"}
            </Button>
            <Badge variant="outline" className="text-xs">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </Badge>
            <Button
              onClick={fetchData}
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              <span className="ml-2">Refresh</span>
            </Button>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="mt-6 space-y-6"
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="call-history">Call History</TabsTrigger>
            <TabsTrigger value="live-activity">Live Activity</TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CardTitle className="text-sm font-medium">
                          Total Clients
                        </CardTitle>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total number of clients in the campaign</p>
                      </TooltipContent>
                    </Tooltip>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(stats.total_clients ?? 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(stats.pending_clients ?? 0).toLocaleString()} pending
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CardTitle className="text-sm font-medium">
                          Completed Calls
                        </CardTitle>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Calls that were answered and completed (from Twilio
                          status: completed)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(stats.completed_calls ?? 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(stats.completion_rate ?? 0).toFixed(1)}% completion rate
                    </p>
                    <Progress
                      value={stats.completion_rate ?? 0}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Interested Clients
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {(stats.interested_clients ?? 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(stats.interest_rate ?? 0).toFixed(1)}% interest rate
                    </p>
                    <Progress
                      value={stats.interest_rate ?? 0}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Not Interested
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(stats.not_interested_clients ?? 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Campaign responses
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Additional Analytics Row */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      DNC Requests
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {stats.dnc_requests?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Do not call requests
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      No Answer
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {stats.no_answer_clients?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      No answer + voicemail
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Real Outcomes
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1">
                      {Object.entries(stats.real_outcomes || {}).map(
                        ([outcome, count]) => (
                          <div key={outcome} className="flex justify-between">
                            <span className="capitalize">
                              {outcome.replace("_", " ")}
                            </span>
                            <span className="font-medium">{count}</span>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* NEW BREAKDOWN CARDS */}
            {stats?.call_status_breakdown && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">
                  Call Status Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CardTitle className="text-sm font-medium">
                            Total Calls Made
                          </CardTitle>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total number of call attempts made</p>
                        </TooltipContent>
                      </Tooltip>
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {(
                          stats.call_status_breakdown?.total_calls_made ?? 0
                        ).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CardTitle className="text-sm font-medium">
                            Calls Answered
                          </CardTitle>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Calls that were answered (Twilio status: completed)
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {(
                          stats.call_status_breakdown?.calls_answered ?? 0
                        ).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CardTitle className="text-sm font-medium">
                            Voicemail
                          </CardTitle>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Calls that went to voicemail (detected by our
                            system)
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {(
                          stats.call_status_breakdown?.voicemail ?? 0
                        ).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CardTitle className="text-sm font-medium">
                            Busy
                          </CardTitle>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Calls that received a busy signal</p>
                        </TooltipContent>
                      </Tooltip>
                      <PhoneOff className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">
                        {(
                          stats.call_status_breakdown?.busy ?? 0
                        ).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CardTitle className="text-sm font-medium">
                            Failed
                          </CardTitle>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Calls that failed (likely invalid numbers)</p>
                        </TooltipContent>
                      </Tooltip>
                      <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {(
                          stats.call_status_breakdown?.failed ?? 0
                        ).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CardTitle className="text-sm font-medium">
                            No Contact
                          </CardTitle>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Calls with no answer or no conversation</p>
                        </TooltipContent>
                      </Tooltip>
                      <UserX className="h-4 w-4 text-gray-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-600">
                        {(
                          stats.call_status_breakdown?.no_contact ?? 0
                        ).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Conversation Outcomes Breakdown */}
            {stats?.conversation_outcomes_breakdown && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">
                  Conversation Outcomes (Answered Calls)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CardTitle className="text-sm font-medium">
                            Interested (Yes + No)
                          </CardTitle>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Clients who said Yes to interest but No to
                            scheduling
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <ThumbsUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {(
                          stats.conversation_outcomes_breakdown
                            ?.interested_yes_no ?? 0
                        ).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CardTitle className="text-sm font-medium">
                            Schedule Invite (Yes + Yes)
                          </CardTitle>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Clients who said Yes to both interest and scheduling
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {(
                          stats.conversation_outcomes_breakdown
                            ?.schedule_invite_yes_yes ?? 0
                        ).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CardTitle className="text-sm font-medium">
                            Not Interested (No)
                          </CardTitle>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Clients who said No to interest</p>
                        </TooltipContent>
                      </Tooltip>
                      <ThumbsDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {(
                          stats.conversation_outcomes_breakdown
                            ?.not_interested_no ?? 0
                        ).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CardTitle className="text-sm font-medium">
                            DNC Requested (No + No)
                          </CardTitle>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Clients who said No to both interest and future
                            contact
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <Ban className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {(
                          stats.conversation_outcomes_breakdown
                            ?.dnc_requested_no_no ?? 0
                        ).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CardTitle className="text-sm font-medium">
                            Keep Communications (No + Yes)
                          </CardTitle>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Clients who said No to interest but Yes to future
                            contact
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <Mail className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">
                        {(
                          stats.conversation_outcomes_breakdown
                            ?.keep_communications_no_yes ?? 0
                        ).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CardTitle className="text-sm font-medium">
                            No Outcome
                          </CardTitle>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Answered calls with no clear conversation outcome
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <HelpCircle className="h-4 w-4 text-gray-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-600">
                        {(
                          stats.conversation_outcomes_breakdown?.no_outcome ?? 0
                        ).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Campaign Progress Section */}
            {campaignProgress && (
              <div className="space-y-6">
                {/* Medicare Email Campaign */}
                <Card>
                  <CardHeader>
                    <CardTitle>Medicare Email Campaign</CardTitle>
                    <CardDescription>
                      Progressive email outreach (6 emails over time)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {campaignProgress.medicare?.total || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Medicare
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {campaignProgress.medicare?.pending || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Pending
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {campaignProgress.medicare?.in_progress || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          In Progress
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {campaignProgress.medicare?.completed || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Completed
                        </div>
                      </div>
                    </div>

                    {/* CRM Outcomes */}
                    <div className="border-t mt-4 pt-4">
                      <div className="text-sm font-medium mb-3">
                        Campaign Outcomes
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-600">
                            {campaignProgress.medicare?.interested_count || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Interested
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-red-600">
                            {campaignProgress.medicare?.dnc_count || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            DNC
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-orange-600">
                            {campaignProgress.medicare?.unsubscribed_count || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Unsubscribed
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Non-Medicare Call Campaign */}
                <Card>
                  <CardHeader>
                    <CardTitle>Non-Medicare Call Campaign</CardTitle>
                    <CardDescription>
                      Progressive voice calls (max attempts configurable)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {campaignProgress.non_medicare_calls?.total || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Non-Medicare
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {campaignProgress.non_medicare_calls?.pending || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Pending
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {campaignProgress.non_medicare_calls?.in_progress ||
                            0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          In Progress
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {campaignProgress.non_medicare_calls?.completed || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Completed
                        </div>
                      </div>
                    </div>

                    {/* CRM Outcomes */}
                    <div className="border-t mt-4 pt-4">
                      <div className="text-sm font-medium mb-3">
                        Campaign Outcomes
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-600">
                            {campaignProgress.non_medicare_calls
                              ?.interested_count || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Interested
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-red-600">
                            {campaignProgress.non_medicare_calls?.dnc_count ||
                              0}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            DNC
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Non-Medicare Email Fallback (only show if exists) */}
                {campaignProgress.non_medicare_emails?.total > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Non-Medicare Email Fallback</CardTitle>
                      <CardDescription>
                        Email campaigns after call attempts exhausted
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {campaignProgress.non_medicare_emails.total}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            In Email Phase
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {campaignProgress.non_medicare_emails.pending}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Pending
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {campaignProgress.non_medicare_emails.in_progress}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            In Progress
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {campaignProgress.non_medicare_emails.completed}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Completed
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Recent Call Activity
                </CardTitle>
                <CardDescription>
                  Latest call outcomes and summaries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {callLogs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Call ID</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Outcome</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Attempts</TableHead>
                        <TableHead>Next Call</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {callLogs.map((log) => (
                        <TableRow
                          key={log.call_id}
                          className={
                            log.is_test_call
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : ""
                          }
                        >
                          <TableCell className="font-medium">
                            {log.call_id.substring(0, 8)}...
                            {log.is_test_call && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Test
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div>{log.client_name || log.client_phone}</div>
                              {log.agent_assigned && (
                                <div className="text-xs text-muted-foreground">
                                  Agent: {log.agent_assigned}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge {...getOutcomeBadge(log.outcome)}>
                              {log.outcome.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.duration}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {log.total_attempts || 0}/6 attempts
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {Math.max(0, 6 - (log.total_attempts || 0))} left
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.next_call_scheduled ? (
                              <div className="text-sm">
                                {new Date(
                                  log.next_call_scheduled
                                ).toLocaleDateString()}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                -
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(log.started_at).toLocaleTimeString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent call activity found
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Clients Table (already built) */}
            <Card>
              <CardHeader>
                <CardTitle>Clients</CardTitle>
                <CardDescription>
                  All clients in the active campaign pool
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Search name/phone/email"
                    value={clientsSearch}
                    onChange={(e) => setClientsSearch(e.target.value)}
                  />
                  <select
                    className="border rounded-md px-2 py-1"
                    value={clientsTypeFilter}
                    onChange={(e) => setClientsTypeFilter(e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="medicare">Medicare</option>
                    <option value="non_medicare">Non-Medicare</option>
                  </select>
                  <select
                    className="border rounded-md px-2 py-1"
                    value={clientsStatusFilter}
                    onChange={(e) => setClientsStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <select
                    className="border rounded-md px-2 py-1"
                    value={clientsTagFilter}
                    onChange={(e) => setClientsTagFilter(e.target.value)}
                  >
                    <option value="">All Tags</option>
                    <option value="LYZR-UC1-INTERESTED">Interested</option>
                    <option value="LYZR-UC1-DNC-REQUESTED">DNC</option>
                    <option value="LYZR-UC1-NOT-INTERESTED">
                      Not Interested
                    </option>
                  </select>
                  <Button
                    variant="outline"
                    onClick={() => fetchClients(1)}
                    disabled={isLoadingClients}
                  >
                    Filter
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Contact Type</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Last Contact</TableHead>
                      <TableHead>Tags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.phone}</TableCell>
                        <TableCell>{c.email}</TableCell>
                        <TableCell>{c.agent}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              c.client_type === "medicare"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {c.client_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{c.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              c.contact_type === "email"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {c.contact_type === "email"
                              ? "📧 Email"
                              : "📞 Call"}
                          </Badge>
                        </TableCell>
                        <TableCell>{c.attempts}/6</TableCell>
                        <TableCell>
                          {c.last_contacted ? (
                            new Date(c.last_contacted).toLocaleDateString()
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {c.tags?.length > 0 ? (
                              c.tags.map((tag, i) => (
                                <Badge
                                  key={i}
                                  variant={
                                    tag.includes("INTERESTED")
                                      ? "default"
                                      : tag.includes("DNC")
                                      ? "destructive"
                                      : "outline"
                                  }
                                  className="text-xs"
                                >
                                  {tag
                                    .replace("LYZR-UC1-", "")
                                    .replace(/_/g, " ")}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                -
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                  <div>
                    Page {clientsPage} • {(clientsTotal || 0).toLocaleString()}{" "}
                    total
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => fetchClients(Math.max(1, clientsPage - 1))}
                      disabled={clientsPage <= 1 || isLoadingClients}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => fetchClients(clientsPage + 1)}
                      disabled={clients.length === 0 || isLoadingClients}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Activity Tab */}
          <TabsContent value="live-activity" className="space-y-6">
            {/* Live Calls Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Live Calls
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchActiveCalls}
                    disabled={isLoadingActiveCalls}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        isLoadingActiveCalls ? "animate-spin" : ""
                      }`}
                    />
                    <span className="ml-2">Refresh</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeCalls.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Call SID</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Turns</TableHead>
                        <TableHead>Started</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeCalls.map((c) => (
                        <TableRow key={c.call_sid || c.started_at}>
                          <TableCell className="font-mono text-xs">
                            {c.call_sid ? `${c.call_sid.slice(0, 10)}...` : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                c.outreach_method === "email"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {c.outreach_method === "email" ? "Email" : "Call"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                c.client_type === "medicare"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {c.client_type || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div>{c.client_name || "Unknown"}</div>
                              <div className="text-xs text-muted-foreground">
                                {c.outreach_method === "email"
                                  ? c.client_email || ""
                                  : c.client_phone || ""}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {c.status || c.call_status || "in_progress"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {c.turns || c.conversation_turns || 0}
                          </TableCell>
                          <TableCell>
                            {c.started_at
                              ? new Date(c.started_at).toLocaleTimeString()
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No active calls
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity Section */}
            {/* <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Recent Call Activity
                </CardTitle>
                <CardDescription>
                  Latest completed calls and their outcomes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Recent activity will be displayed here
                  <div className="text-xs mt-2">
                    This section will show the latest call completions,
                    outcomes, and trends
                  </div>
                </div>
              </CardContent>
            </Card> */}
          </TabsContent>

          {/* Call History Tab */}
          <TabsContent value="call-history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Call History
                </CardTitle>
                <CardDescription>
                  Complete history of all calls with pagination and filters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Call History with pagination and filters will be displayed
                  here
                  <div className="text-xs mt-2">
                    This will show all calls from the database with filtering
                    options
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
