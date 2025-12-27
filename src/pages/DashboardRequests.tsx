import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";
import { mockReturnRequests, ReturnRequest } from "@/lib/mockData";
import { Check, X, Eye, Clock, CheckCircle, XCircle, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function DashboardRequests() {
  const [requests, setRequests] = useState<ReturnRequest[]>(mockReturnRequests);
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null);
  const { toast } = useToast();

  const handleApprove = (id: string) => {
    setRequests(requests.map(r => 
      r.id === id ? { ...r, status: 'approved' as const, updatedAt: new Date().toISOString() } : r
    ));
    toast({
      title: "Solicitação aprovada",
      description: "O cliente será notificado.",
    });
  };

  const handleReject = (id: string) => {
    setRequests(requests.map(r => 
      r.id === id ? { ...r, status: 'rejected' as const, updatedAt: new Date().toISOString() } : r
    ));
    toast({
      title: "Solicitação rejeitada",
      description: "O cliente será notificado.",
    });
  };

  const getStatusBadge = (status: ReturnRequest['status']) => {
    const config = {
      pending: { label: 'Pendente', variant: 'outline' as const, icon: Clock },
      approved: { label: 'Aprovado', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: 'Rejeitado', variant: 'destructive' as const, icon: XCircle },
      completed: { label: 'Concluído', variant: 'secondary' as const, icon: Package },
    };
    const { label, variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  return (
    <>
      <Helmet>
        <title>Solicitações - Trocas.app</title>
        <meta name="description" content="Gerencie solicitações de troca e devolução." />
      </Helmet>
      <DashboardLayout>
        <div className="space-y-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold mb-2">Solicitações</h1>
            <p className="text-muted-foreground">
              Gerencie as solicitações de troca e devolução
            </p>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground">Pedido</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Resolução</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Valor</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Data</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="p-4 font-medium">{request.orderNumber}</td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{request.customerName}</div>
                          <div className="text-sm text-muted-foreground">{request.customerEmail}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={request.resolution === 'store_credit' ? 'default' : 'outline'} className={request.resolution === 'store_credit' ? 'bg-accent text-accent-foreground' : ''}>
                          {request.resolution === 'store_credit' ? 'Crédito na loja' : 'Reembolso'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div>
                          <div>R$ {request.totalValue.toFixed(2)}</div>
                          {request.bonusValue > 0 && (
                            <div className="text-sm text-accent">+R$ {request.bonusValue.toFixed(2)} bônus</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(request.status)}</td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {request.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-accent hover:text-accent"
                                onClick={() => handleApprove(request.id)}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleReject(request.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Solicitação {selectedRequest?.orderNumber}</DialogTitle>
              <DialogDescription>
                Detalhes da solicitação de {selectedRequest?.resolution === 'store_credit' ? 'crédito na loja' : 'reembolso'}
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Cliente</div>
                    <div className="font-medium">{selectedRequest.customerName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">E-mail</div>
                    <div className="font-medium">{selectedRequest.customerEmail}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Itens</div>
                  {selectedRequest.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <img src={item.productImage} alt={item.productName} className="w-12 h-12 rounded object-cover" />
                      <div className="flex-1">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-sm text-muted-foreground">Qtd: {item.quantity} • R$ {item.price.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Motivo</div>
                  <div>{selectedRequest.reason}</div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
}
