import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Helmet } from "react-helmet-async";
import { Plus, Store, Settings, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { useStores, useAddStore, useDeleteStore, StoreWithSettings } from "@/hooks/useStores";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DashboardStores() {
  const { data: stores = [], isLoading } = useStores();
  const addStore = useAddStore();
  const deleteStore = useDeleteStore();
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreApiKey, setNewStoreApiKey] = useState("");
  const [newStoreApiUrl, setNewStoreApiUrl] = useState("");

  const handleAddStore = async () => {
    if (!newStoreName || !newStoreApiKey || !newStoreApiUrl) {
      return;
    }

    await addStore.mutateAsync({
      name: newStoreName,
      apiKey: newStoreApiKey,
      apiUrl: newStoreApiUrl,
    });

    setNewStoreName("");
    setNewStoreApiKey("");
    setNewStoreApiUrl("");
    setIsAddingStore(false);
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
                    <Label htmlFor="apiKey">API Key (Access Token)</Label>
                    <Input
                      id="apiKey"
                      placeholder="Seu token de acesso"
                      value={newStoreApiKey}
                      onChange={(e) => setNewStoreApiKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Encontre em: Nuvem Shop → Configurações → Aplicativos → API
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiUrl">API URL</Label>
                    <Input
                      id="apiUrl"
                      placeholder="https://api.nuvemshop.com.br/v1/123456"
                      value={newStoreApiUrl}
                      onChange={(e) => setNewStoreApiUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Formato: https://api.nuvemshop.com.br/v1/SEU_STORE_ID
                    </p>
                  </div>
                  <Button 
                    onClick={handleAddStore} 
                    className="w-full"
                    disabled={addStore.isPending || !newStoreName || !newStoreApiKey || !newStoreApiUrl}
                  >
                    {addStore.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Validando...
                      </>
                    ) : (
                      "Conectar"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma loja conectada</h3>
              <p className="text-muted-foreground mb-4">
                Conecte sua primeira loja Nuvem Shop para começar
              </p>
              <Button variant="hero" onClick={() => setIsAddingStore(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Conectar loja
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <StoreCard 
                  key={store.id} 
                  store={store} 
                  onDelete={() => deleteStore.mutate(store.id)}
                  isDeleting={deleteStore.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}

function StoreCard({ 
  store, 
  onDelete, 
  isDeleting 
}: { 
  store: StoreWithSettings; 
  onDelete: () => void;
  isDeleting: boolean;
}) {
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
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => window.open(`/portal/${store.slug}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover loja?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Todos os dados de trocas e devoluções 
                  associados a esta loja serão removidos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} disabled={isDeleting}>
                  {isDeleting ? "Removendo..." : "Remover"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <h3 className="font-semibold text-lg mb-1">{store.name}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {store.slug}.trocas.app.br
      </p>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Janela de troca</span>
          <span>{store.settings?.return_window_days || 7} dias</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Bônus crédito</span>
          <span className="text-accent">+{store.settings?.store_credit_bonus || 5}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Conectada em</span>
          <span>{new Date(store.created_at).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
    </div>
  );
}
