import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { toast } from "sonner";

// API base: prefer env var, fallback to localhost
const API_ROOT =
  (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL || "http://localhost:8000";
const API_BASE_URL = `${API_ROOT}/api/dashboard`;

interface ClientRow {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  phone: string;
  email: string;
  agent: string;
  client_type: "medicare" | "non_medicare" | string;
  campaign_status: string;
  total_attempts: number;
  last_contact_attempt: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  attempts: number;
}

const Clients = () => {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [batchName, setBatchName] = useState("");
  const [startCampaignOnUpload, setStartCampaignOnUpload] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  // Client data state
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [clientsSearch, setClientsSearch] = useState("");
  const [clientsTypeFilter, setClientsTypeFilter] = useState<string>("");
  const [clientsStatusFilter, setClientsStatusFilter] = useState<string>("");
  const [clientsTotal, setClientsTotal] = useState(0);
  const [clientsPage, setClientsPage] = useState(1);

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
    [clientsSearch, clientsTypeFilter, clientsStatusFilter]
  );

  useEffect(() => {
    fetchClients(1);
  }, [clientsSearch, clientsTypeFilter, clientsStatusFilter]);

  const parseUpload = async () => {
    if (!uploadFile) {
      toast.error("Select a file first");
      return;
    }
    try {
      setIsParsing(true);
      const formData = new FormData();
      formData.append("file", uploadFile);
      const res = await fetch(`${API_BASE_URL}/upload/parse`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Parse failed");
      const data = await res.json();
      setPreview(data);
      toast.success("Parsed successfully");
    } catch {
      toast.error("Failed to parse file");
    } finally {
      setIsParsing(false);
    }
  };

  const finalizeUpload = async () => {
    if (!uploadFile) {
      toast.error("Select a file first");
      return;
    }
    try {
      setIsFinalizing(true);
      const formData = new FormData();
      formData.append("file", uploadFile);
      if (batchName) formData.append("batch_name", batchName);
      if (startCampaignOnUpload) formData.append("start_campaign", "true");
      const res = await fetch(`${API_BASE_URL}/upload/finalize`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Finalize failed");
      const data = await res.json();
      const message = data.campaign_started
        ? `Upload complete: ${data.inserted} inserted, ${data.updated} updated. Campaign started for batch "${data.batch_name}"`
        : `Upload complete: ${data.inserted} inserted, ${data.updated} updated`;
      toast.success(message);
      setPreview(null);
      setUploadFile(null);
      setBatchName("");
      // refresh clients and stats
      fetchClients(1);
      // fetchData();
    } catch {
      toast.error("Failed to finalize upload");
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Client Management
          </h1>
          <p className="text-muted-foreground">
            Upload and manage client data for campaigns
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Clients (CSV/XLSX)</CardTitle>
          <CardDescription>
            Append clients to the active campaign pool
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Input
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              <div className="space-y-2">
                <Input
                  placeholder="Batch name (optional)"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="startCampaign"
                    checked={startCampaignOnUpload}
                    onChange={(e) => setStartCampaignOnUpload(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="startCampaign" className="text-sm">
                    Start campaign immediately after upload
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={parseUpload}
                disabled={!uploadFile || isParsing}
                variant="outline"
              >
                {isParsing ? "Parsing..." : "Parse"}
              </Button>
              <Button
                onClick={finalizeUpload}
                disabled={!uploadFile || !preview || isFinalizing}
              >
                {isFinalizing ? "Finalizing..." : "Finalize Import"}
              </Button>
            </div>
          </div>
          {preview && (
            <div className="mt-4 text-sm text-muted-foreground">
              <div>Total rows: {preview.total_rows}</div>
              <div>
                Valid: {preview.valid_count} | Invalid: {preview.invalid_count}
              </div>
              {preview.invalid_count > 0 && (
                <div className="mt-2">
                  Showing first {Math.min(5, preview.invalid_rows.length)}{" "}
                  invalid rows
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client List Section */}
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
                <TableHead>Attempts</TableHead>
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
                        c.client_type === "medicare" ? "default" : "secondary"
                      }
                    >
                      {c.client_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.status}</Badge>
                  </TableCell>
                  <TableCell>{c.attempts}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
            <div>
              Page {clientsPage} • {(clientsTotal || 0).toLocaleString()} total
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
    </div>
  );
};

export default Clients;
