import { DashboardMetrics } from "@/hooks/useReturnRequests";
import { TrendingUp, TrendingDown, Percent, ArrowUpRight } from "lucide-react";

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
      colorClass: "bg-primary/10 text-primary",
    },
    {
      label: "Conversão p/ Crédito",
      value: `${metrics.storeCreditConversion}%`,
      icon: Percent,
      subLabel: "das solicitações",
      colorClass: "bg-success/10 text-success",
      valueClass: "text-success",
    },
    {
      label: "Valor Reembolsado",
      value: `R$ ${metrics.totalRefundedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingDown,
      subLabel: "total devolvido",
      colorClass: "bg-destructive/10 text-destructive",
    },
    {
      label: "Receita Retida",
      value: `R$ ${metrics.retainedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      subLabel: "via crédito na loja",
      colorClass: "bg-success/10 text-success",
      valueClass: "text-success",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div 
          key={stat.label}
          className="bg-card border border-border rounded-lg p-5 animate-slide-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${stat.colorClass}`}>
              <stat.icon className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-semibold ${stat.valueClass || ''}`}>
            {stat.value}
          </div>
          {stat.subLabel && (
            <div className="text-xs text-muted-foreground mt-1">{stat.subLabel}</div>
          )}
        </div>
      ))}
    </div>
  );
}
