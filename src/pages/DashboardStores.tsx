import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { Plus, Store, Settings, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { useStores, useGetInstallUrl, useExchangeOAuthToken, useDeleteStore, StoreWithSettings } from "@/hooks/useStores";
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
import { useToast } from "@/hooks/use-toast";

export default function DashboardStores() {
  const { data: stores = [], isLoading } = useStores();
  const getInstallUrl = useGetInstallUrl();
  const exchangeToken = useExchangeOAuthToken();
  const deleteStore = useDeleteStore();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  // Listen for OAuth callback from popup window
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'nuvemshop-oauth-callback') {
        const { code, state } = event.data;
        
        if (code && state) {
          setIsConnecting(true);
          try {
            await exchangeToken.mutateAsync({ code, state });
          } catch (error) {
            // Error is handled by the mutation
          } finally {
            setIsConnecting(false);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [exchangeToken]);

  const handleConnectStore = async () => {
    setIsConnecting(true);
    try {
      const installUrl = await getInstallUrl.mutateAsync("Minha Loja");
      
      // Open NuvemShop authorization in a popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        installUrl,
        'nuvemshop-auth',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
      );
      
      // Keep the connecting state active until we receive the callback
      // The message listener will reset it
    } catch (error) {
      setIsConnecting(false);
    }
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
            <Button 
              variant="hero" 
              onClick={handleConnectStore}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Conectar loja
                </>
              )}
            </Button>
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
              <Button 
                variant="hero" 
                onClick={handleConnectStore}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Conectar loja
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Ao clicar, você será redirecionado para autorizar o app na Nuvem Shop
              </p>
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
