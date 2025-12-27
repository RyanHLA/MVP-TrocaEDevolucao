import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ConversionChart } from "@/components/dashboard/ConversionChart";
import { RecentRequests } from "@/components/dashboard/RecentRequests";
import { Helmet } from "react-helmet-async";
import { mockMetrics, mockReturnRequests } from "@/lib/mockData";

export default function Dashboard() {
  return (
    <>
      <Helmet>
        <title>Dashboard - Trocas.app</title>
        <meta name="description" content="Dashboard de gerenciamento de trocas e devoluções." />
      </Helmet>
      <DashboardLayout>
        <div className="space-y-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral das suas trocas e devoluções
            </p>
          </div>

          <StatsCards metrics={mockMetrics} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ConversionChart data={mockMetrics.monthlyTrend} />
            <RecentRequests requests={mockReturnRequests} />
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
