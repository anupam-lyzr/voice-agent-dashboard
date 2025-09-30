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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Save,
  RefreshCw,
  Plus,
  Users,
  Edit,
  Clock,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

interface Agent {
  id: string;
  agent_id: string;
  name: string;
  email: string;
  phone?: string;
  google_calendar_id: string;
  timezone: string;
  working_hours: string;
  tag_identifier?: string;
  client_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AgentFormData {
  name: string;
  email: string;
  phone: string;
  google_calendar_id: string;
  timezone: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const TIMEZONE_OPTIONS = [
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
];

const TIME_OPTIONS = [
  { value: "8AM", label: "8:00 AM" },
  { value: "9AM", label: "9:00 AM" },
  { value: "10AM", label: "10:00 AM" },
  { value: "11AM", label: "11:00 AM" },
  { value: "12PM", label: "12:00 PM" },
  { value: "1PM", label: "1:00 PM" },
  { value: "2PM", label: "2:00 PM" },
  { value: "3PM", label: "3:00 PM" },
  { value: "4PM", label: "4:00 PM" },
  { value: "5PM", label: "5:00 PM" },
  { value: "6PM", label: "6:00 PM" },
];

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState<AgentFormData>({
    name: "",
    email: "",
    phone: "",
    google_calendar_id: "",
    timezone: "America/New_York",
    start_time: "9AM",
    end_time: "5PM",
    is_active: true,
  });

  const API_ROOT =
    (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env
      ?.VITE_API_BASE_URL || "http://localhost:8000";
  const API_BASE_URL = `${API_ROOT}/api/dashboard`;
  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/agents`);
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      } else {
        toast.error("Failed to load agents");
      }
    } catch (error) {
      toast.error("Error loading agents");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveAgent = async () => {
    setSaving(true);
    try {
      // Combine start_time and end_time into working_hours
      const working_hours = `${formData.start_time}-${formData.end_time}`;

      const agentData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        google_calendar_id: formData.google_calendar_id || formData.email,
        timezone: formData.timezone,
        working_hours: working_hours,
        is_active: formData.is_active,
      };

      const isEditing = editingAgent !== null;
      const url = isEditing
        ? `${API_BASE_URL}/api/dashboard/agents/${editingAgent.id}`
        : `${API_BASE_URL}/api/dashboard/agents`;

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agentData),
      });

      if (response.ok) {
        toast.success(
          `Agent ${isEditing ? "updated" : "created"} successfully!`
        );
        setDialogOpen(false);
        setEditingAgent(null);
        resetForm();
        loadAgents();
      } else {
        const errorData = await response.json();
        toast.error(
          errorData.detail ||
            `Failed to ${isEditing ? "update" : "create"} agent`
        );
      }
    } catch (error) {
      toast.error(`Error ${editingAgent ? "updating" : "creating"} agent`);
      console.error("Error:", error);
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (agent: Agent) => {
    // Parse working hours back to start/end times
    const [start_time, end_time] = agent.working_hours?.split("-") || [
      "9AM",
      "5PM",
    ];

    setFormData({
      name: agent.name,
      email: agent.email,
      phone: agent.phone || "",
      google_calendar_id: agent.google_calendar_id,
      timezone: agent.timezone,
      start_time: start_time,
      end_time: end_time,
      is_active: agent.is_active,
    });
    setEditingAgent(agent);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingAgent(null);
    resetForm();
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      google_calendar_id: "",
      timezone: "America/New_York",
      start_time: "9AM",
      end_time: "5PM",
      is_active: true,
    });
  };

  const deactivateAgent = async (agent: Agent) => {
    if (!confirm(`Are you sure you want to deactivate ${agent.name}?`)) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/agents/${agent.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success(`Agent ${agent.name} deactivated successfully!`);
        loadAgents();
      } else {
        toast.error("Failed to deactivate agent");
      }
    } catch (error) {
      toast.error("Error deactivating agent");
      console.error("Error:", error);
    }
  };

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-8 w-8" />
            Agent Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage agents and their availability for client meetings
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="min-w-[140px]">
              <Plus className="h-4 w-4 mr-2" />
              Add Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAgent ? "Edit Agent" : "Add New Agent"}
              </DialogTitle>
              <DialogDescription>
                Configure agent details and availability for client meeting
                scheduling
              </DialogDescription>
            </DialogHeader>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveAgent();
              }}
            >
              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Anthony Fracchia"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                        google_calendar_id:
                          prev.google_calendar_id || e.target.value,
                      }))
                    }
                    placeholder="anthony@altruisadvisor.com"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="+1-248-633-2866"
                  />
                </div>
                <div>
                  <Label htmlFor="google_calendar_id">Google Calendar ID</Label>
                  <Input
                    id="google_calendar_id"
                    value={formData.google_calendar_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        google_calendar_id: e.target.value,
                      }))
                    }
                    placeholder="anthony@altruisadvisor.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Usually same as email address
                  </p>
                </div>
              </div>

              {/* Schedule Settings */}
              <Separator />
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Meeting Schedule Settings
              </h4>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, timezone: value }))
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

                <div>
                  <Label htmlFor="start_time">Available From</Label>
                  <Select
                    value={formData.start_time}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, start_time: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.slice(0, -2).map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="end_time">Available Until</Label>
                  <Select
                    value={formData.end_time}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, end_time: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.slice(4).map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Explanation */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  How Working Hours Work
                </h5>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>
                    • Clients will only see meeting slots within these hours
                  </li>
                  <li>• Times are shown in the agent's timezone</li>
                  <li>
                    • Example: 10AM-3PM = slots at 10:00, 11:00, 12:00, 1:00,
                    2:00
                  </li>
                  <li>
                    • Calendar integration respects these availability windows
                  </li>
                </ul>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="is_active">
                  Active Agent (can receive client assignments)
                </Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="min-w-[120px]"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {editingAgent ? "Update Agent" : "Create Agent"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search agents by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Badge variant="secondary">
              {filteredAgents.length} agent
              {filteredAgents.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agents</CardTitle>
          <CardDescription>
            Manage your team of agents and their availability for client
            meetings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Timezone</TableHead>
                <TableHead>Available Hours</TableHead>
                <TableHead>Clients</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-sm text-gray-500">
                        {agent.tag_identifier}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="h-3 w-3 mr-1" />
                        {agent.email}
                      </div>
                      {agent.phone && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="h-3 w-3 mr-1" />
                          {agent.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="text-sm">
                        {agent.timezone
                          .replace("America/", "")
                          .replace("_", " ")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {agent.working_hours || "9AM-5PM"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{agent.client_count}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={agent.is_active ? "default" : "secondary"}>
                      {agent.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(agent)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      {agent.is_active && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deactivateAgent(agent)}
                        >
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredAgents.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No agents found
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? "No agents match your search criteria"
                  : "Get started by adding your first agent"}
              </p>
              {!searchTerm && (
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Agent
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
