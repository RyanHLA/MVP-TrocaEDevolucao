import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Helmet } from "react-helmet-async";
import { useStores, useUpdateStoreAddress, StoreAddressData } from "@/hooks/useStores";
import { useStoreSettings, useUpdateStoreSettings } from "@/hooks/useStoreSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, AlertCircle, MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function DashboardSettings() {
  const { data: stores, isLoading: storesLoading } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  
  useEffect(() => {
    if (stores && stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);
  
  const { data: existingSettings, isLoading: settingsLoading } = useStoreSettings(selectedStoreId);
  const updateSettings = useUpdateStoreSettings();
  const updateAddress = useUpdateStoreAddress();
  
  const selectedStore = stores?.find(s => s.id === selectedStoreId);
  
  const [settings, setSettings] = useState({
    return_window_days: 7,
    allow_refund: true,
    allow_store_credit: true,
    store_credit_bonus: 5,
    credit_format: 'coupon' as 'coupon' | 'native',
    requires_reason: true,
    allow_partial_returns: true,
  });

  const [address, setAddress] = useState<StoreAddressData>({
    address_street: '',
    address_number: '',
    address_complement: '',
    address_district: '',
    address_city: '',
    address_state: '',
    address_postal_code: '',
    phone: '',
    document: '',
  });

  // Update local state when settings load
  useEffect(() => {
    if (existingSettings) {
      setSettings({
        return_window_days: existingSettings.return_window_days,
        allow_refund: existingSettings.allow_refund,
        allow_store_credit: existingSettings.allow_store_credit,
        store_credit_bonus: existingSettings.store_credit_bonus,
        credit_format: existingSettings.credit_format as 'coupon' | 'native',
        requires_reason: existingSettings.requires_reason,
        allow_partial_returns: existingSettings.allow_partial_returns,
      });
    } else if (selectedStoreId && !settingsLoading) {
      // Reset to defaults when switching to a store without settings
      setSettings({
        return_window_days: 7,
        allow_refund: true,
        allow_store_credit: true,
        store_credit_bonus: 5,
        credit_format: 'coupon',
        requires_reason: true,
        allow_partial_returns: true,
      });
    }
  }, [existingSettings, selectedStoreId, settingsLoading]);

  // Load store address when store changes
  useEffect(() => {
    if (selectedStore) {
      setAddress({
        address_street: selectedStore.address_street || '',
        address_number: selectedStore.address_number || '',
        address_complement: selectedStore.address_complement || '',
        address_district: selectedStore.address_district || '',
        address_city: selectedStore.address_city || '',
        address_state: selectedStore.address_state || '',
        address_postal_code: selectedStore.address_postal_code || '',
        phone: selectedStore.phone || '',
        document: selectedStore.document || '',
      });
    }
  }, [selectedStore]);

  const handleSave = () => {
    if (!selectedStoreId) return;
    updateSettings.mutate({ storeId: selectedStoreId, settings });
  };

  const handleSaveAddress = () => {
    if (!selectedStoreId) return;
    updateAddress.mutate({ storeId: selectedStoreId, address });
  };

  const isLoading = storesLoading || settingsLoading;

  if (storesLoading) {
    return (
      <>
        <Helmet>
          <title>Configurações - Trocas.app</title>
          <meta name="description" content="Configure regras de troca e devolução." />
        </Helmet>
        <DashboardLayout>
          <div className="space-y-8 max-w-2xl">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </DashboardLayout>
      </>
    );
  }

  if (!stores || stores.length === 0) {
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
            <div className="glass-card p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">Nenhuma loja conectada</h3>
              <p className="text-muted-foreground text-sm">
                Conecte uma loja na aba "Lojas" para configurar as regras de troca e devolução.
              </p>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

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
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {settingsLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : (
            <>
              <div className="glass-card p-6 space-y-6">
                <h2 className="text-xl font-semibold">Regras de Elegibilidade</h2>
                
                <div className="space-y-2">
                  <Label htmlFor="returnWindow">Janela de troca/devolução (dias)</Label>
                  <Input
                    id="returnWindow"
                    type="number"
                    value={settings.return_window_days}
                    onChange={(e) => setSettings({ ...settings, return_window_days: Number(e.target.value) })}
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
                    checked={settings.allow_partial_returns}
                    onCheckedChange={(checked) => setSettings({ ...settings, allow_partial_returns: checked })}
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
                    checked={settings.requires_reason}
                    onCheckedChange={(checked) => setSettings({ ...settings, requires_reason: checked })}
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
                    checked={settings.allow_refund}
                    onCheckedChange={(checked) => setSettings({ ...settings, allow_refund: checked })}
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
                    checked={settings.allow_store_credit}
                    onCheckedChange={(checked) => setSettings({ ...settings, allow_store_credit: checked })}
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
                      value={settings.store_credit_bonus}
                      onChange={(e) => setSettings({ ...settings, store_credit_bonus: Number(e.target.value) })}
                      className="max-w-[200px]"
                      min={0}
                      max={50}
                    />
                    <span className="text-accent font-semibold">
                      +{settings.store_credit_bonus}% extra
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Valor adicional oferecido quando o cliente escolhe crédito na loja
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Formato do crédito</Label>
                  <Select
                    value={settings.credit_format}
                    onValueChange={(value: 'coupon' | 'native') => setSettings({ ...settings, credit_format: value })}
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

              <Button 
                variant="hero" 
                size="lg" 
                onClick={handleSave}
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar configurações
              </Button>

              {/* Store Address for Shipping */}
              <div className="glass-card p-6 space-y-6">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Endereço da Loja (Logística Reversa)</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Configure o endereço de destino para receber os produtos devolvidos via Melhor Envio.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>CNPJ</Label>
                    <Input
                      placeholder="00.000.000/0001-00"
                      value={address.document}
                      onChange={(e) => setAddress({ ...address, document: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Telefone</Label>
                    <Input
                      placeholder="(11) 99999-9999"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <Input
                      placeholder="00000-000"
                      value={address.address_postal_code}
                      onChange={(e) => setAddress({ ...address, address_postal_code: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select value={address.address_state} onValueChange={(v) => setAddress({ ...address, address_state: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRAZILIAN_STATES.map(uf => (
                          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Cidade</Label>
                    <Input
                      placeholder="São Paulo"
                      value={address.address_city}
                      onChange={(e) => setAddress({ ...address, address_city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Bairro</Label>
                    <Input
                      placeholder="Centro"
                      value={address.address_district}
                      onChange={(e) => setAddress({ ...address, address_district: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Rua</Label>
                    <Input
                      placeholder="Rua Exemplo"
                      value={address.address_street}
                      onChange={(e) => setAddress({ ...address, address_street: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Número</Label>
                    <Input
                      placeholder="123"
                      value={address.address_number}
                      onChange={(e) => setAddress({ ...address, address_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Complemento</Label>
                    <Input
                      placeholder="Sala 1"
                      value={address.address_complement}
                      onChange={(e) => setAddress({ ...address, address_complement: e.target.value })}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSaveAddress}
                  disabled={updateAddress.isPending}
                >
                  {updateAddress.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar endereço
                </Button>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
