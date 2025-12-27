import { DashboardMetrics } from "@/lib/mockData";
import { TrendingUp, TrendingDown, DollarSign, Percent, Gift, ArrowUpRight } from "lucide-react";

interface StatsCardsProps {
  metrics: DashboardMetrics;
}

export function StatsCards({ metrics }: StatsCardsProps) {
  const stats = [
    {
      label: "Total de Solicitações",
      value: metrics.totalRequests,
      icon: ArrowUpRight,
      trend: "+12%",
      trendUp: true,
    },
    {
      label: "Conversão p/ Crédito",
      value: `${metrics.storeCreditConversion}%`,
      icon: Percent,
      trend: "+5%",
      trendUp: true,
      highlight: true,
    },
    {
      label: "Valor Reembolsado",
      value: `R$ ${metrics.totalRefundedValue.toLocaleString('pt-BR')}`,
      icon: TrendingDown,
      trend: "-8%",
      trendUp: false,
    },
    {
      label: "Receita Retida",
      value: `R$ ${metrics.retainedRevenue.toLocaleString('pt-BR')}`,
      icon: TrendingUp,
      trend: "+18%",
      trendUp: true,
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div 
          key={stat.label}
          className={`stat-card animate-slide-up`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              stat.highlight ? 'bg-accent/20 text-accent' : 'bg-primary/10 text-primary'
            }`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${
              stat.trendUp ? 'text-accent' : 'text-destructive'
            }`}>
              {stat.trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {stat.trend}
            </div>
          </div>
          <div className={`text-2xl font-bold mb-1 ${stat.highlight ? 'text-accent' : ''}`}>
            {stat.value}
          </div>
          <div className="text-sm text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
