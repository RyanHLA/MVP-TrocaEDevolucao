import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Package, Check, Gift, CreditCard, ArrowRight, ArrowLeft, AlertCircle } from "lucide-react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { returnReasons } from "@/lib/mockData";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Step = 'lookup' | 'items' | 'resolution' | 'confirmation';

interface OrderItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
}

interface OrderData {
  id: number;
  number: string;
  customer: {
    name: string;
    email: string;
  };
  items: OrderItem[];
  total: number;
  createdAt: string;
  status: string;
}

interface StoreSettings {
  allowRefund: boolean;
  allowStoreCredit: boolean;
  storeCreditBonus: number;
  requiresReason: boolean;
  allowPartialReturns: boolean;
}

interface EligibilityInfo {
  isEligible: boolean;
  daysSinceOrder: number;
  returnWindowDays: number;
  message: string;
}

export default function CustomerPortal() {
  const { storeSlug } = useParams();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('lookup');
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [itemReasons, setItemReasons] = useState<Record<number, string>>({});
  const [resolution, setResolution] = useState<'refund' | 'store_credit'>('store_credit');
  const [isLoading, setIsLoading] = useState(false);
  
  // Real data from API
  const [order, setOrder] = useState<OrderData | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityInfo | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string>("");

  // Fetch store name on mount
  useEffect(() => {
    async function fetchStoreName() {
      if (!storeSlug) return;
      
      const { data } = await supabase
        .from('stores')
        .select('name')
        .eq('slug', storeSlug)
        .maybeSingle();
      
      if (data) {
        setStoreName(data.name);
      } else {
        setStoreName(storeSlug.replace(/-/g, ' '));
      }
    }
    fetchStoreName();
  }, [storeSlug]);

  const bonusPercent = settings?.storeCreditBonus || 5;

  const eligibleItems = order?.items.filter(() => eligibility?.isEligible) || [];
  const selectedTotal = eligibleItems
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const bonusValue = resolution === 'store_credit' ? selectedTotal * (bonusPercent / 100) : 0;

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('nuvemshop', {
        body: {
          action: 'get-order',
          storeSlug,
          orderNumber,
          customerEmail: email,
        },
      });

      if (error || !data.success) {
        toast({
          title: "Pedido não encontrado",
          description: data?.error || "Verifique o número do pedido e e-mail e tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setOrder(data.order);
      setSettings(data.settings);
      setEligibility(data.eligibility);
      setStoreId(data.storeId);
      
      // Set default resolution based on settings
      if (data.settings.allowStoreCredit) {
        setResolution('store_credit');
      } else if (data.settings.allowRefund) {
        setResolution('refund');
      }
      
      setStep('items');
    } catch (err) {
      console.error('Error fetching order:', err);
      toast({
        title: "Erro ao buscar pedido",
        description: "Ocorreu um erro. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemSelection = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Selecione ao menos um item",
        description: "Escolha os itens que deseja trocar ou devolver.",
        variant: "destructive",
      });
      return;
    }

    const missingReasons = selectedItems.filter(id => !itemReasons[id]);
    if (settings?.requiresReason && missingReasons.length > 0) {
      toast({
        title: "Informe o motivo",
        description: "Selecione o motivo para cada item.",
        variant: "destructive",
      });
      return;
    }

    setStep('resolution');
  };

  const handleSubmit = async () => {
    if (!order || !storeId) return;
    
    setIsLoading(true);
    
    try {
      const selectedItemsData = order.items
        .filter(item => selectedItems.includes(item.id))
        .map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          reason: itemReasons[item.id] || null,
        }));

      const creditValue = resolution === 'store_credit' ? selectedTotal + bonusValue : null;

      const { error } = await supabase
        .from('return_requests')
        .insert({
          store_id: storeId,
          order_id: String(order.id),
          order_number: order.number,
          customer_name: order.customer.name,
          customer_email: order.customer.email,
          items: selectedItemsData,
          total_value: selectedTotal,
          credit_value: creditValue,
          resolution_type: resolution,
          reason: Object.values(itemReasons).join('; '),
          status: 'pending',
        });

      if (error) {
        console.error('Error creating return request:', error);
        toast({
          title: "Erro ao enviar",
          description: "Ocorreu um erro. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setStep('confirmation');
      toast({
        title: "Solicitação enviada!",
        description: "Acompanhe o status por e-mail.",
      });
    } catch (err) {
      console.error('Error submitting request:', err);
      toast({
        title: "Erro ao enviar",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const displayStoreName = storeName || storeSlug?.replace(/-/g, ' ') || "Loja";

  return (
    <>
      <Helmet>
        <title>Trocas e Devoluções - {displayStoreName}</title>
        <meta name="description" content={`Portal de trocas e devoluções da ${displayStoreName}.`} />
      </Helmet>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-info flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold">{displayStoreName}</span>
            </div>
            <span className="text-sm text-muted-foreground">Trocas e Devoluções</span>
          </div>
        </header>

        {/* Progress Steps */}
        {step !== 'confirmation' && (
          <div className="border-b border-border py-4">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-center gap-2">
                <StepIndicator number={1} label="Buscar pedido" active={step === 'lookup'} completed={step !== 'lookup'} />
                <div className="w-8 h-px bg-border" />
                <StepIndicator number={2} label="Selecionar itens" active={step === 'items'} completed={step === 'resolution'} />
                <div className="w-8 h-px bg-border" />
                <StepIndicator number={3} label="Escolher resolução" active={step === 'resolution'} completed={false} />
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-xl mx-auto animate-fade-in">
            {step === 'lookup' && (
              <div className="glass-card p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Package className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Trocar ou Devolver</h1>
                  <p className="text-muted-foreground">
                    Informe os dados do seu pedido para iniciar
                  </p>
                </div>

                <form onSubmit={handleLookup} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="orderNumber">Número do pedido</Label>
                    <Input
                      id="orderNumber"
                      placeholder="Ex: 12345"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      required
                      className="h-12 bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail usado na compra</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 bg-secondary/50"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    variant="hero" 
                    className="w-full h-12"
                    disabled={isLoading}
                  >
                    {isLoading ? "Buscando..." : "Buscar pedido"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            )}

            {step === 'items' && order && (
              <div className="glass-card p-8">
                <div className="mb-8">
                  <Button variant="ghost" size="sm" onClick={() => setStep('lookup')} className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                  <h1 className="text-2xl font-bold mb-2">Selecione os itens</h1>
                  <p className="text-muted-foreground">
                    Escolha os produtos que deseja trocar ou devolver
                  </p>
                </div>

                {/* Eligibility notice */}
                {eligibility && !eligibility.isEligible && (
                  <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Prazo expirado</p>
                      <p className="text-sm text-muted-foreground">{eligibility.message}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4 mb-8">
                  {order.items.map((item) => {
                    const isEligible = eligibility?.isEligible ?? true;
                    return (
                      <div 
                        key={item.id}
                        className={`p-4 rounded-lg border transition-all ${
                          isEligible 
                            ? 'border-border hover:border-primary cursor-pointer' 
                            : 'border-border/50 opacity-50'
                        } ${selectedItems.includes(item.id) ? 'border-primary bg-primary/5' : 'bg-secondary/30'}`}
                        onClick={() => {
                          if (!isEligible) return;
                          setSelectedItems(prev => 
                            prev.includes(item.id) 
                              ? prev.filter(id => id !== item.id)
                              : [...prev, item.id]
                          );
                        }}
                      >
                        <div className="flex items-start gap-4">
                          <Checkbox 
                            checked={selectedItems.includes(item.id)}
                            disabled={!isEligible}
                            className="mt-1"
                          />
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center">
                              <Package className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Qtd: {item.quantity} • R$ {item.price.toFixed(2)}
                            </div>
                            {!isEligible && (
                              <div className="text-sm text-destructive mt-1">
                                Fora do prazo de devolução
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {selectedItems.includes(item.id) && settings?.requiresReason && (
                          <div className="mt-4 ml-10">
                            <Select
                              value={itemReasons[item.id] || ""}
                              onValueChange={(value) => setItemReasons(prev => ({ ...prev, [item.id]: value }))}
                            >
                              <SelectTrigger onClick={(e) => e.stopPropagation()}>
                                <SelectValue placeholder="Selecione o motivo" />
                              </SelectTrigger>
                              <SelectContent>
                                {returnReasons.map((reason) => (
                                  <SelectItem key={reason} value={reason}>
                                    {reason}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Button 
                  variant="hero" 
                  className="w-full h-12"
                  onClick={handleItemSelection}
                  disabled={!eligibility?.isEligible}
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {step === 'resolution' && settings && (
              <div className="glass-card p-8">
                <div className="mb-8">
                  <Button variant="ghost" size="sm" onClick={() => setStep('items')} className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                  <h1 className="text-2xl font-bold mb-2">Como prefere receber?</h1>
                  <p className="text-muted-foreground">
                    Escolha como deseja ser ressarcido
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  {settings.allowStoreCredit && (
                    <div 
                      className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                        resolution === 'store_credit' 
                          ? 'border-accent bg-accent/10' 
                          : 'border-border hover:border-accent/50'
                      }`}
                      onClick={() => setResolution('store_credit')}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                          <Gift className="w-6 h-6 text-accent" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-lg">Crédito na loja</span>
                            <span className="px-2 py-0.5 text-xs font-medium bg-accent text-accent-foreground rounded-full">
                              +{bonusPercent}% bônus
                            </span>
                          </div>
                          <p className="text-muted-foreground text-sm mb-3">
                            Receba crédito para usar em compras futuras
                          </p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-accent">
                              R$ {(selectedTotal + bonusValue).toFixed(2)}
                            </span>
                            <span className="text-sm text-muted-foreground line-through">
                              R$ {selectedTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {settings.allowRefund && (
                    <div 
                      className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                        resolution === 'refund' 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setResolution('refund')}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                          <CreditCard className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-lg mb-1">Reembolso</div>
                          <p className="text-muted-foreground text-sm mb-3">
                            Receba o valor de volta na forma original de pagamento
                          </p>
                          <div className="text-2xl font-bold">
                            R$ {selectedTotal.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  variant="hero" 
                  className="w-full h-12"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Confirmar solicitação"}
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            )}

            {step === 'confirmation' && order && (
              <div className="glass-card p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/20 flex items-center justify-center">
                  <Check className="w-10 h-10 text-accent" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Solicitação enviada!</h1>
                <p className="text-muted-foreground mb-8">
                  Você receberá atualizações por e-mail em <strong>{order.customer.email}</strong>
                </p>

                <div className="bg-secondary/50 rounded-lg p-4 mb-8 text-left">
                  <div className="text-sm text-muted-foreground mb-2">Resumo</div>
                  <div className="flex justify-between mb-1">
                    <span>Resolução</span>
                    <span className="font-medium">
                      {resolution === 'store_credit' ? 'Crédito na loja' : 'Reembolso'}
                    </span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Valor base</span>
                    <span>R$ {selectedTotal.toFixed(2)}</span>
                  </div>
                  {bonusValue > 0 && (
                    <div className="flex justify-between text-accent">
                      <span>Bônus</span>
                      <span>+R$ {bonusValue.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-border mt-2 pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>R$ {(selectedTotal + bonusValue).toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Próximos passos</h3>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>1. Nossa equipe analisará sua solicitação em até 48h</p>
                    <p>2. Você receberá instruções para envio do produto</p>
                    <p>3. Após recebimento, seu crédito/reembolso será processado</p>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="mt-8"
                  onClick={() => {
                    setStep('lookup');
                    setOrder(null);
                    setSelectedItems([]);
                    setItemReasons({});
                    setOrderNumber("");
                    setEmail("");
                  }}
                >
                  Nova solicitação
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

function StepIndicator({ 
  number, 
  label, 
  active, 
  completed 
}: { 
  number: number; 
  label: string; 
  active: boolean; 
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
        completed 
          ? 'bg-primary text-primary-foreground' 
          : active 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-secondary text-muted-foreground'
      }`}>
        {completed ? <Check className="w-4 h-4" /> : number}
      </div>
      <span className={`text-sm hidden sm:block ${active ? 'font-medium' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  );
}
