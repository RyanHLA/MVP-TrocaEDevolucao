import { ReturnRequest } from "@/hooks/useReturnRequests";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RecentRequestsProps {
  requests: ReturnRequest[];
}

export function RecentRequests({ requests }: RecentRequestsProps) {
  const navigate = useNavigate();

  const getStatusConfig = (status: ReturnRequest['status']) => {
    const config = {
      pending: { label: 'Pendente', variant: 'outline' as const, icon: Clock, color: 'text-warning' },
      approved: { label: 'Aprovado', variant: 'default' as const, icon: CheckCircle, color: 'text-primary' },
      rejected: { label: 'Rejeitado', variant: 'destructive' as const, icon: XCircle, color: 'text-destructive' },
      completed: { label: 'Concluído', variant: 'secondary' as const, icon: Package, color: 'text-accent' },
    };
    return config[status];
  };

  if (requests.length === 0) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Solicitações Recentes</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma solicitação ainda</p>
          <p className="text-sm">As solicitações aparecerão aqui</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Solicitações Recentes</h3>
        <button 
          onClick={() => navigate('/dashboard/requests')}
          className="text-sm text-primary hover:underline"
        >
          Ver todas
        </button>
      </div>

      <div className="space-y-4">
        {requests.slice(0, 5).map((request) => {
          const statusConfig = getStatusConfig(request.status);
          const bonusValue = request.credit_value ? Number(request.credit_value) - Number(request.total_value) : 0;
          
          return (
            <div 
              key={request.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() => navigate('/dashboard/requests')}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">#{request.order_number}</span>
                  <Badge 
                    variant={request.resolution_type === 'store_credit' ? 'default' : 'outline'}
                    className={request.resolution_type === 'store_credit' ? 'bg-accent/20 text-accent border-accent/30' : ''}
                  >
                    {request.resolution_type === 'store_credit' ? 'Crédito' : 'Reembolso'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {request.customer_name}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  R$ {Number(request.total_value).toFixed(2)}
                </div>
                {bonusValue > 0 && (
                  <div className="text-xs text-accent">+R$ {bonusValue.toFixed(2)} bônus</div>
                )}
                <div className={`text-sm flex items-center gap-1 justify-end ${statusConfig.color}`}>
                  <statusConfig.icon className="w-3 h-3" />
                  {statusConfig.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
