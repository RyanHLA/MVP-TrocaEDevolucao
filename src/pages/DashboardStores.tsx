import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Helmet } from "react-helmet-async";
import { Plus, Store, Settings, ExternalLink, Trash2 } from "lucide-react";
import { mockStores, Store as StoreType } from "@/lib/mockData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function DashboardStores() {
  const [stores, setStores] = useState<StoreType[]>(mockStores);
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreApiKey, setNewStoreApiKey] = useState("");
  const [newStoreApiUrl, setNewStoreApiUrl] = useState("");
  const { toast } = useToast();

  const handleAddStore = () => {
    if (!newStoreName || !newStoreApiKey || !newStoreApiUrl) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const newStore: StoreType = {
      id: String(stores.length + 1),
      name: newStoreName,
      slug: newStoreName.toLowerCase().replace(/\s+/g, '-'),
      apiKey: newStoreApiKey,
      apiUrl: newStoreApiUrl,
      createdAt: new Date().toISOString().split('T')[0],
      settings: {
        returnWindowDays: 7,
        allowRefund: true,
        allowStoreCredit: true,
        storeCreditBonus: 5,
        creditFormat: 'coupon',
        requiresReason: true,
        allowPartialReturns: true,
      },
    };

    setStores([...stores, newStore]);
    setNewStoreName("");
    setNewStoreApiKey("");
    setNewStoreApiUrl("");
    setIsAddingStore(false);
    toast({
      title: "Loja conectada!",
      description: `${newStoreName} foi adicionada com sucesso.`,
    });
  };

  return (
    <>
      <Helmet>
        <title>Lojas - Trocas.app</title>
        <meta name="description" content="Gerencie suas lojas conectadas no Trocas.app." />
      </Helmet>
      <DashboardLayout>
        <div className="space-y-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Lojas</h1>
              <p className="text-muted-foreground">
                Gerencie suas lojas conectadas
              </p>
            </div>
            <Dialog open={isAddingStore} onOpenChange={setIsAddingStore}>
              <DialogTrigger asChild>
                <Button variant="hero">
                  <Plus className="w-4 h-4 mr-2" />
                  Conectar loja
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Conectar Nuvem Shop</DialogTitle>
                  <DialogDescription>
                    Insira as credenciais da API da sua loja Nuvem Shop
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Nome da loja</Label>
                    <Input
                      id="storeName"
                      placeholder="Minha Loja"
                      value={newStoreName}
                      onChange={(e) => setNewStoreName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      placeholder="nv_api_xxxxx"
                      value={newStoreApiKey}
                      onChange={(e) => setNewStoreApiKey(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiUrl">API URL</Label>
                    <Input
                      id="apiUrl"
                      placeholder="https://api.nuvemshop.com.br/v1/123456"
                      value={newStoreApiUrl}
                      onChange={(e) => setNewStoreApiUrl(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddStore} className="w-full">
                    Conectar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}

function StoreCard({ store }: { store: StoreType }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Store className="w-6 h-6 text-primary" />
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <h3 className="font-semibold text-lg mb-1">{store.name}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {store.slug}.trocas.app.br
      </p>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Janela de troca</span>
          <span>{store.settings.returnWindowDays} dias</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Bônus crédito</span>
          <span className="text-accent">+{store.settings.storeCreditBonus}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Conectada em</span>
          <span>{new Date(store.createdAt).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
    </div>
  );
}
