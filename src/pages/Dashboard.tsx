import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ConversionChart } from "@/components/dashboard/ConversionChart";
import { RecentRequests } from "@/components/dashboard/RecentRequests";
import { Helmet } from "react-helmet-async";
import { useStores } from "@/hooks/useStores";
import { useDashboardMetrics, useReturnRequests } from "@/hooks/useReturnRequests";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function Dashboard() {
  const { data: stores, isLoading: storesLoading } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("all");
  
  const storeFilter = selectedStoreId === "all" ? undefined : selectedStoreId;
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics(storeFilter);
  const { data: requests, isLoading: requestsLoading } = useReturnRequests(storeFilter);

  const isLoading = storesLoading || metricsLoading || requestsLoading;

  // Generate monthly trend data from real requests
  const monthlyTrend = generateMonthlyTrend(requests || []);

  return (
    <>
      <Helmet>
        <title>Dashboard - Trocas.app</title>
        <meta name="description" content="Dashboard de gerenciamento de trocas e devoluções." />
      </Helmet>
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Visão geral das suas trocas e devoluções
              </p>
            </div>
            
            {stores && stores.length > 0 && (
              <div className="w-full md:w-64">
                <Label className="text-xs text-muted-foreground mb-1">Filtrar por loja</Label>
                <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as lojas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as lojas</SelectItem>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))}
            </div>
          ) : (
            <StatsCards metrics={metrics || { totalRequests: 0, storeCreditConversion: 0, totalRefundedValue: 0, retainedRevenue: 0, bonusCost: 0, pendingRequests: 0 }} />
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {isLoading ? (
              <>
                <Skeleton className="h-72 rounded-lg" />
                <Skeleton className="h-72 rounded-lg" />
              </>
            ) : (
              <>
                <ConversionChart data={monthlyTrend} />
                <RecentRequests requests={requests || []} />
              </>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}

// Helper to generate monthly trend from real data
function generateMonthlyTrend(requests: any[]) {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  const now = new Date();
  
  return months.map((month, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - (4 - index), 1);
    
    const monthRequests = requests.filter(r => {
      const created = new Date(r.created_at);
      return created >= monthDate && created < nextMonth;
    });
    
    const refunds = monthRequests
      .filter(r => r.resolution_type === 'refund')
      .reduce((sum, r) => sum + Number(r.total_value), 0);
    
    const storeCredits = monthRequests
      .filter(r => r.resolution_type === 'store_credit')
      .reduce((sum, r) => sum + Number(r.total_value), 0);
    
    return { month, refunds, storeCredits };
  });
}
