import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";
import { useReturnRequests, useUpdateRequestStatus, ReturnRequest } from "@/hooks/useReturnRequests";
import { useStores } from "@/hooks/useStores";
import { useCalculateShipping, useCreateShippingLabel, useCheckoutShipping, ShippingQuote } from "@/hooks/useShipping";
import { Check, X, Eye, Clock, CheckCircle, XCircle, Package, Loader2, Truck, Printer, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function DashboardRequests() {
  const { data: stores } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("all");
  
  const storeFilter = selectedStoreId === "all" ? undefined : selectedStoreId;
  const { data: requests, isLoading } = useReturnRequests(storeFilter);
  const updateStatus = useUpdateRequestStatus();
  const calculateShipping = useCalculateShipping();
  const createLabel = useCreateShippingLabel();
  const checkoutShipping = useCheckoutShipping();
  
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null);
  const [shippingDialogRequest, setShippingDialogRequest] = useState<ReturnRequest | null>(null);
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [shippingStep, setShippingStep] = useState<'quotes' | 'confirm' | 'done'>('quotes');

  const getStoreName = (storeId: string) => {
    const store = stores?.find(s => s.id === storeId);
    return store?.name || 'Loja';
  };

  const handleApprove = (request: ReturnRequest) => {
    updateStatus.mutate({ 
      id: request.id, 
      status: 'approved',
      customerEmail: request.customer_email,
      customerName: request.customer_name,
      orderNumber: request.order_number,
      storeName: getStoreName(request.store_id),
    });
  };

  const handleReject = (request: ReturnRequest) => {
    updateStatus.mutate({ 
      id: request.id, 
      status: 'rejected',
      customerEmail: request.customer_email,
      customerName: request.customer_name,
      orderNumber: request.order_number,
      storeName: getStoreName(request.store_id),
    });
  };

  const handleComplete = (request: ReturnRequest) => {
    updateStatus.mutate({ 
      id: request.id, 
      status: 'completed',
      customerEmail: request.customer_email,
      customerName: request.customer_name,
      orderNumber: request.order_number,
      storeName: getStoreName(request.store_id),
    });
  };

  const getStatusBadge = (status: ReturnRequest['status']) => {
    const config = {
      pending: { label: 'Pendente', variant: 'pending-soft' as const, icon: Clock },
      approved: { label: 'Aprovado', variant: 'approved-soft' as const, icon: CheckCircle },
      rejected: { label: 'Rejeitado', variant: 'rejected-soft' as const, icon: XCircle },
      completed: { label: 'Concluído', variant: 'completed-soft' as const, icon: Package },
    };
    const { label, variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  const handleOpenShippingDialog = async (request: ReturnRequest) => {
    setShippingDialogRequest(request);
    setShippingQuotes([]);
    setSelectedServiceId("");
    
    if (request.label_url) {
      // Already has label, go to done step
      setShippingStep('done');
    } else if (request.shipping_id) {
      // Has shipping ID but no label, go to confirm step
      setShippingStep('confirm');
    } else {
      // Need to calculate quotes
      setShippingStep('quotes');
      calculateShipping.mutate(
        { returnRequestId: request.id },
        {
          onSuccess: (quotes) => {
            setShippingQuotes(quotes);
          },
        }
      );
    }
  };

  const handleCreateLabel = () => {
    if (!shippingDialogRequest || !selectedServiceId) return;
    
    createLabel.mutate(
      { 
        returnRequestId: shippingDialogRequest.id, 
        serviceId: parseInt(selectedServiceId) 
      },
      {
        onSuccess: () => {
          setShippingStep('confirm');
        },
      }
    );
  };

  const handleCheckoutShipping = () => {
    if (!shippingDialogRequest) return;
    
    checkoutShipping.mutate(
      { returnRequestId: shippingDialogRequest.id },
      {
        onSuccess: () => {
          setShippingStep('done');
        },
      }
    );
  };

  const closeShippingDialog = () => {
    setShippingDialogRequest(null);
    setShippingQuotes([]);
    setSelectedServiceId("");
    setShippingStep('quotes');
  };

  return (
    <>
      <Helmet>
        <title>Solicitações - Trocas.app</title>
        <meta name="description" content="Gerencie solicitações de troca e devolução." />
      </Helmet>
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold mb-1">Solicitações</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie as solicitações de troca e devolução
              </p>
            </div>
            
            {stores && stores.length > 0 && (
              <div className="w-full md:w-56">
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
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : requests && requests.length > 0 ? (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Pedido</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Resolução</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                      <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {requests.map((request) => {
                      const bonusValue = request.credit_value ? Number(request.credit_value) - Number(request.total_value) : 0;
                      return (
                        <tr key={request.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-medium text-sm">#{request.order_number}</td>
                          <td className="p-4">
                            <div>
                              <div className="font-medium text-sm">{request.customer_name}</div>
                              <div className="text-xs text-muted-foreground">{request.customer_email}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant={request.resolution_type === 'store_credit' ? 'approved-soft' : 'outline'}>
                              {request.resolution_type === 'store_credit' ? 'Crédito na loja' : 'Reembolso'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div>
                              <div className="text-sm">R$ {Number(request.total_value).toFixed(2)}</div>
                              {bonusValue > 0 && (
                                <div className="text-xs text-success">+R$ {bonusValue.toFixed(2)} bônus</div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">{getStatusBadge(request.status)}</td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(request.created_at).toLocaleDateString('pt-BR')}
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
                                    onClick={() => handleApprove(request)}
                                    disabled={updateStatus.isPending}
                                  >
                                    {updateStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleReject(request)}
                                    disabled={updateStatus.isPending}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {request.status === 'approved' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary hover:text-primary"
                                    onClick={() => handleOpenShippingDialog(request)}
                                  >
                                    {request.label_url ? (
                                      <>
                                        <Printer className="w-4 h-4 mr-1" />
                                        Etiqueta
                                      </>
                                    ) : (
                                      <>
                                        <Truck className="w-4 h-4 mr-1" />
                                        Frete
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-accent hover:text-accent"
                                    onClick={() => handleComplete(request)}
                                    disabled={updateStatus.isPending}
                                  >
                                    <Package className="w-4 h-4 mr-1" />
                                    Concluir
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">Nenhuma solicitação</h3>
              <p className="text-muted-foreground">
                As solicitações de troca e devolução aparecerão aqui.
              </p>
            </div>
          )}
        </div>

        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Solicitação #{selectedRequest?.order_number}</DialogTitle>
              <DialogDescription>
                Detalhes da solicitação de {selectedRequest?.resolution_type === 'store_credit' ? 'crédito na loja' : 'reembolso'}
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Cliente</div>
                    <div className="font-medium">{selectedRequest.customer_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">E-mail</div>
                    <div className="font-medium">{selectedRequest.customer_email}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Itens</div>
                  <div className="space-y-2">
                    {selectedRequest.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">Qtd: {item.quantity} • R$ {item.price.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedRequest.reason && (
                  <div>
                    <div className="text-sm text-muted-foreground">Motivo</div>
                    <div>{selectedRequest.reason}</div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <div className="text-sm text-muted-foreground">Valor total</div>
                    <div className="font-medium">R$ {Number(selectedRequest.total_value).toFixed(2)}</div>
                  </div>
                  {selectedRequest.credit_value && (
                    <div>
                      <div className="text-sm text-muted-foreground">Crédito (com bônus)</div>
                      <div className="font-medium text-accent">R$ {Number(selectedRequest.credit_value).toFixed(2)}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Shipping Dialog */}
        <Dialog open={!!shippingDialogRequest} onOpenChange={closeShippingDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Gerar Etiqueta de Frete
              </DialogTitle>
              <DialogDescription>
                Pedido #{shippingDialogRequest?.order_number}
              </DialogDescription>
            </DialogHeader>

            {shippingStep === 'quotes' && (
              <div className="space-y-4 py-4">
                {calculateShipping.isPending ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Calculando opções de frete...</span>
                  </div>
                ) : shippingQuotes.length > 0 ? (
                  <>
                    <Label>Selecione a transportadora:</Label>
                    <RadioGroup value={selectedServiceId} onValueChange={setSelectedServiceId}>
                      {shippingQuotes.map((quote) => (
                        <div 
                          key={quote.id} 
                          className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${
                            selectedServiceId === String(quote.id) 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedServiceId(String(quote.id))}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={String(quote.id)} id={String(quote.id)} />
                            <div>
                              <div className="font-medium">{quote.company.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {quote.name} • {quote.delivery_range.min}-{quote.delivery_range.max} dias úteis
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">R$ {parseFloat(quote.price).toFixed(2)}</div>
                            {parseFloat(quote.discount) > 0 && (
                              <div className="text-xs text-success">-R$ {parseFloat(quote.discount).toFixed(2)}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                    <Button 
                      className="w-full" 
                      onClick={handleCreateLabel}
                      disabled={!selectedServiceId || createLabel.isPending}
                    >
                      {createLabel.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Criando etiqueta...
                        </>
                      ) : (
                        <>
                          <Truck className="w-4 h-4 mr-2" />
                          Criar Etiqueta
                        </>
                      )}
                    </Button>
                  </>
                ) : calculateShipping.isError ? (
                  <div className="text-center py-8 text-destructive">
                    <p>Erro ao calcular frete.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Verifique se o endereço da loja está configurado em Configurações.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma opção de frete disponível.
                  </div>
                )}
              </div>
            )}

            {shippingStep === 'confirm' && (
              <div className="space-y-4 py-4">
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Etiqueta criada!</h3>
                  <p className="text-sm text-muted-foreground">
                    Clique em "Comprar e Gerar" para finalizar a compra e gerar a etiqueta para impressão.
                  </p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCheckoutShipping}
                  disabled={checkoutShipping.isPending}
                >
                  {checkoutShipping.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4 mr-2" />
                      Comprar e Gerar Etiqueta
                    </>
                  )}
                </Button>
              </div>
            )}

            {shippingStep === 'done' && (
              <div className="space-y-4 py-4">
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">Etiqueta pronta!</h3>
                  {shippingDialogRequest?.tracking_code && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Código de rastreio: <strong>{shippingDialogRequest.tracking_code}</strong>
                    </p>
                  )}
                  {shippingDialogRequest?.shipping_cost && (
                    <p className="text-sm text-muted-foreground">
                      Custo do frete: R$ {Number(shippingDialogRequest.shipping_cost).toFixed(2)}
                    </p>
                  )}
                </div>
                {shippingDialogRequest?.label_url && (
                  <Button 
                    className="w-full" 
                    onClick={() => window.open(shippingDialogRequest.label_url!, '_blank')}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir Etiqueta
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={closeShippingDialog}
                >
                  Fechar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
}
