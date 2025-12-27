import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Helmet } from "react-helmet-async";
import { mockStores } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DashboardSettings() {
  const { toast } = useToast();
  const [selectedStoreId, setSelectedStoreId] = useState(mockStores[0]?.id || "");
  const selectedStore = mockStores.find(s => s.id === selectedStoreId);
  
  const [settings, setSettings] = useState(selectedStore?.settings || {
    returnWindowDays: 7,
    allowRefund: true,
    allowStoreCredit: true,
    storeCreditBonus: 5,
    creditFormat: 'coupon' as const,
    requiresReason: true,
    allowPartialReturns: true,
  });

  const handleSave = () => {
    toast({
      title: "Configurações salvas",
      description: "As novas regras já estão ativas.",
    });
  };

  return (
    <>
      <Helmet>
        <title>Configurações - Trocas.app</title>
        <meta name="description" content="Configure regras de troca e devolução." />
      </Helmet>
      <DashboardLayout>
        <div className="space-y-8 animate-fade-in max-w-2xl">
          <div>
            <h1 className="text-3xl font-bold mb-2">Configurações</h1>
            <p className="text-muted-foreground">
              Configure as regras de troca e devolução
            </p>
          </div>

          <div className="space-y-2">
            <Label>Loja</Label>
            <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma loja" />
              </SelectTrigger>
              <SelectContent>
                {mockStores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="glass-card p-6 space-y-6">
            <h2 className="text-xl font-semibold">Regras de Elegibilidade</h2>
            
            <div className="space-y-2">
              <Label htmlFor="returnWindow">Janela de troca/devolução (dias)</Label>
              <Input
                id="returnWindow"
                type="number"
                value={settings.returnWindowDays}
                onChange={(e) => setSettings({ ...settings, returnWindowDays: Number(e.target.value) })}
                className="max-w-[200px]"
              />
              <p className="text-sm text-muted-foreground">
                Prazo após a entrega para solicitar troca/devolução (CDC: mínimo 7 dias)
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Permitir trocas parciais</Label>
                <p className="text-sm text-muted-foreground">
                  Cliente pode trocar apenas alguns itens do pedido
                </p>
              </div>
              <Switch
                checked={settings.allowPartialReturns}
                onCheckedChange={(checked) => setSettings({ ...settings, allowPartialReturns: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Exigir motivo</Label>
                <p className="text-sm text-muted-foreground">
                  Cliente deve informar o motivo da troca/devolução
                </p>
              </div>
              <Switch
                checked={settings.requiresReason}
                onCheckedChange={(checked) => setSettings({ ...settings, requiresReason: checked })}
              />
            </div>
          </div>

          <div className="glass-card p-6 space-y-6">
            <h2 className="text-xl font-semibold">Opções de Resolução</h2>

            <div className="flex items-center justify-between">
              <div>
                <Label>Permitir reembolso</Label>
                <p className="text-sm text-muted-foreground">
                  Cliente pode optar por reembolso em dinheiro
                </p>
              </div>
              <Switch
                checked={settings.allowRefund}
                onCheckedChange={(checked) => setSettings({ ...settings, allowRefund: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Permitir crédito na loja</Label>
                <p className="text-sm text-muted-foreground">
                  Cliente pode optar por crédito para compras futuras
                </p>
              </div>
              <Switch
                checked={settings.allowStoreCredit}
                onCheckedChange={(checked) => setSettings({ ...settings, allowStoreCredit: checked })}
              />
            </div>
          </div>

          <div className="glass-card p-6 space-y-6">
            <h2 className="text-xl font-semibold">Incentivo de Crédito</h2>
            
            <div className="space-y-2">
              <Label htmlFor="bonus">Bônus para crédito na loja (%)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="bonus"
                  type="number"
                  value={settings.storeCreditBonus}
                  onChange={(e) => setSettings({ ...settings, storeCreditBonus: Number(e.target.value) })}
                  className="max-w-[200px]"
                  min={0}
                  max={50}
                />
                <span className="text-accent font-semibold">
                  +{settings.storeCreditBonus}% extra
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Valor adicional oferecido quando o cliente escolhe crédito na loja
              </p>
            </div>

            <div className="space-y-2">
              <Label>Formato do crédito</Label>
              <Select
                value={settings.creditFormat}
                onValueChange={(value: 'coupon' | 'native') => setSettings({ ...settings, creditFormat: value })}
              >
                <SelectTrigger className="max-w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coupon">Cupom de desconto</SelectItem>
                  <SelectItem value="native">Crédito nativo da plataforma</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Como o crédito será entregue ao cliente
              </p>
            </div>
          </div>

          <Button variant="hero" size="lg" onClick={handleSave}>
            Salvar configurações
          </Button>
        </div>
      </DashboardLayout>
    </>
  );
}
