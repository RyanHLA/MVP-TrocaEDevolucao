import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Package, Check, Gift, CreditCard, ArrowRight, ArrowLeft } from "lucide-react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { mockOrder, returnReasons, mockStores } from "@/lib/mockData";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Step = 'lookup' | 'items' | 'resolution' | 'confirmation';

export default function CustomerPortal() {
  const { storeSlug } = useParams();
  const { toast } = useToast();
  const store = mockStores.find(s => s.slug === storeSlug) || mockStores[0];
  const bonusPercent = store?.settings.storeCreditBonus || 5;

  const [step, setStep] = useState<Step>('lookup');
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [itemReasons, setItemReasons] = useState<Record<string, string>>({});
  const [resolution, setResolution] = useState<'refund' | 'store_credit'>('store_credit');
  const [isLoading, setIsLoading] = useState(false);

  const eligibleItems = mockOrder.items.filter(item => item.eligible);
  const selectedTotal = eligibleItems
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const bonusValue = resolution === 'store_credit' ? selectedTotal * (bonusPercent / 100) : 0;

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (orderNumber === "54321" || orderNumber === mockOrder.orderNumber) {
        setStep('items');
      } else {
        toast({
          title: "Pedido não encontrado",
          description: "Verifique o número do pedido e tente novamente.",
          variant: "destructive",
        });
      }
    }, 1000);
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
    if (store?.settings.requiresReason && missingReasons.length > 0) {
      toast({
        title: "Informe o motivo",
        description: "Selecione o motivo para cada item.",
        variant: "destructive",
      });
      return;
    }

    setStep('resolution');
  };

  const handleSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('confirmation');
      toast({
        title: "Solicitação enviada!",
        description: "Acompanhe o status por e-mail.",
      });
    }, 1500);
  };

  const storeName = store?.name || storeSlug?.replace(/-/g, ' ') || "Loja Demo";

  return (
    <>
      <Helmet>
        <title>Trocas e Devoluções - {storeName}</title>
        <meta name="description" content={`Portal de trocas e devoluções da ${storeName}.`} />
      </Helmet>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-info flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold">{storeName}</span>
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
                      placeholder="Ex: 54321"
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

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Dica: Use o pedido <span className="font-mono bg-secondary px-2 py-1 rounded">54321</span> para testar
                </p>
              </div>
            )}

            {step === 'items' && (
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

                <div className="space-y-4 mb-8">
                  {mockOrder.items.map((item) => (
                    <div 
                      key={item.id}
                      className={`p-4 rounded-lg border transition-all ${
                        item.eligible 
                          ? 'border-border hover:border-primary cursor-pointer' 
                          : 'border-border/50 opacity-50'
                      } ${selectedItems.includes(item.id) ? 'border-primary bg-primary/5' : 'bg-secondary/30'}`}
                      onClick={() => {
                        if (!item.eligible) return;
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
                          disabled={!item.eligible}
                          className="mt-1"
                        />
                        <img 
                          src={item.productImage} 
                          alt={item.productName} 
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-sm text-muted-foreground">
                            Qtd: {item.quantity} • R$ {item.price.toFixed(2)}
                          </div>
                          {!item.eligible && (
                            <div className="text-sm text-destructive mt-1">
                              Fora do prazo de devolução
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {selectedItems.includes(item.id) && store?.settings.requiresReason && (
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
                  ))}
                </div>

                <Button 
                  variant="hero" 
                  className="w-full h-12"
                  onClick={handleItemSelection}
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {step === 'resolution' && (
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
                  {store?.settings.allowStoreCredit && (
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

                  {store?.settings.allowRefund && (
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

            {step === 'confirmation' && (
              <div className="glass-card p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/20 flex items-center justify-center">
                  <Check className="w-10 h-10 text-accent" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Solicitação enviada!</h1>
                <p className="text-muted-foreground mb-8">
                  Você receberá atualizações por e-mail em <strong>{email}</strong>
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
          ? 'bg-accent text-accent-foreground' 
          : active 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-secondary text-muted-foreground'
      }`}>
        {completed ? <Check className="w-4 h-4" /> : number}
      </div>
      <span className={`text-sm hidden sm:inline ${active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  );
}
