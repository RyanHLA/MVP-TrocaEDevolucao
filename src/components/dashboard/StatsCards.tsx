import { DashboardMetrics } from "@/hooks/useReturnRequests";
import { TrendingUp, TrendingDown, Percent, ArrowUpRight, Clock } from "lucide-react";

interface StatsCardsProps {
  metrics: DashboardMetrics;
}

export function StatsCards({ metrics }: StatsCardsProps) {
  const stats = [
    {
      label: "Total de Solicitações",
      value: metrics.totalRequests,
      icon: ArrowUpRight,
      subLabel: `${metrics.pendingRequests} pendentes`,
    },
    {
      label: "Conversão p/ Crédito",
      value: `${metrics.storeCreditConversion}%`,
      icon: Percent,
      highlight: true,
      subLabel: "das solicitações",
    },
    {
      label: "Valor Reembolsado",
      value: `R$ ${metrics.totalRefundedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingDown,
      negative: true,
      subLabel: "total devolvido",
    },
    {
      label: "Receita Retida",
      value: `R$ ${metrics.retainedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      highlight: true,
      subLabel: "via crédito na loja",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div 
          key={stat.label}
          className="stat-card animate-slide-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              stat.highlight ? 'bg-accent/20 text-accent' : 
              stat.negative ? 'bg-destructive/10 text-destructive' :
              'bg-primary/10 text-primary'
            }`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl font-bold mb-1 ${stat.highlight ? 'text-accent' : ''}`}>
            {stat.value}
          </div>
          <div className="text-sm text-muted-foreground">{stat.label}</div>
          {stat.subLabel && (
            <div className="text-xs text-muted-foreground/70 mt-1">{stat.subLabel}</div>
          )}
        </div>
      ))}
    </div>
  );
}
