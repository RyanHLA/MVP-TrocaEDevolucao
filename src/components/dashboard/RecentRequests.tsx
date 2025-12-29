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
      pending: { label: 'Pendente', variant: 'pending-soft' as const, icon: Clock },
      approved: { label: 'Aprovado', variant: 'approved-soft' as const, icon: CheckCircle },
      rejected: { label: 'Rejeitado', variant: 'rejected-soft' as const, icon: XCircle },
      completed: { label: 'Concluído', variant: 'completed-soft' as const, icon: Package },
    };
    return config[status];
  };

  if (requests.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold">Solicitações Recentes</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhuma solicitação ainda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Solicitações Recentes</h3>
        <button 
          onClick={() => navigate('/dashboard/requests')}
          className="text-sm text-primary hover:underline font-medium"
        >
          Ver todas
        </button>
      </div>

      <div className="space-y-3">
        {requests.slice(0, 5).map((request) => {
          const statusConfig = getStatusConfig(request.status);
          const bonusValue = request.credit_value ? Number(request.credit_value) - Number(request.total_value) : 0;
          
          return (
            <div 
              key={request.id}
              className="flex items-center gap-4 p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              onClick={() => navigate('/dashboard/requests')}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">#{request.order_number}</span>
                  <Badge 
                    variant={request.resolution_type === 'store_credit' ? 'approved-soft' : 'outline'}
                  >
                    {request.resolution_type === 'store_credit' ? 'Crédito' : 'Reembolso'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {request.customer_name}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-sm">
                  R$ {Number(request.total_value).toFixed(2)}
                </div>
                {bonusValue > 0 && (
                  <div className="text-xs text-success">+R$ {bonusValue.toFixed(2)} bônus</div>
                )}
              </div>
              <Badge variant={statusConfig.variant} className="gap-1">
                <statusConfig.icon className="w-3 h-3" />
                {statusConfig.label}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
