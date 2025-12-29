import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface StoreWithSettings {
  id: string;
  name: string;
  slug: string;
  api_key: string;
  api_url: string;
  nuvemshop_store_id: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  // Address fields for shipping
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_district: string | null;
  address_city: string | null;
  address_state: string | null;
  address_postal_code: string | null;
  phone: string | null;
  document: string | null;
  settings?: {
    id: string;
    return_window_days: number;
    allow_refund: boolean;
    allow_store_credit: boolean;
    store_credit_bonus: number;
    credit_format: string;
    requires_reason: boolean;
    allow_partial_returns: boolean;
  };
}

export function useStores() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stores', user?.id],
    queryFn: async (): Promise<StoreWithSettings[]> => {
      if (!user) return [];

      const { data: stores, error } = await supabase
        .from('stores')
        .select(`
          *,
          store_settings (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return stores.map(store => ({
        ...store,
        settings: store.store_settings?.[0] || undefined,
      }));
    },
    enabled: !!user,
  });
}

export function useGetInstallUrl() {
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (storeName: string): Promise<string> => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase.functions.invoke('nuvemshop-oauth', {
        body: {
          action: 'get-install-url',
          userId: user.id,
          storeName,
        },
      });

      if (error) {
        throw new Error("Erro ao gerar URL de instalação: " + error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || "Falha ao gerar URL de instalação");
      }

      return data.installUrl;
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useExchangeOAuthToken() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, state }: { code: string; state: string }) => {
      const { data, error } = await supabase.functions.invoke('nuvemshop-oauth', {
        body: {
          action: 'exchange-token',
          code,
          state,
        },
      });

      if (error) {
        throw new Error("Erro ao conectar loja: " + error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || "Falha ao conectar loja");
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast({
        title: data.updated ? "Loja atualizada!" : "Loja conectada!",
        description: `${data.storeName} foi ${data.updated ? 'atualizada' : 'adicionada'} com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao conectar loja",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteStore() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storeId: string) => {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast({
        title: "Loja removida",
        description: "A loja foi desconectada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover loja",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export interface StoreAddressData {
  address_street: string;
  address_number: string;
  address_complement?: string;
  address_district: string;
  address_city: string;
  address_state: string;
  address_postal_code: string;
  phone: string;
  document: string;
}

export function useUpdateStoreAddress() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId, address }: { storeId: string; address: StoreAddressData }) => {
      const { error } = await supabase
        .from('stores')
        .update({
          address_street: address.address_street,
          address_number: address.address_number,
          address_complement: address.address_complement || null,
          address_district: address.address_district,
          address_city: address.address_city,
          address_state: address.address_state,
          address_postal_code: address.address_postal_code,
          phone: address.phone,
          document: address.document,
        })
        .eq('id', storeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast({
        title: "Endereço atualizado",
        description: "O endereço da loja foi salvo com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar endereço",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
