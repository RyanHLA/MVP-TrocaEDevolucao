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

export function useAddStore() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, apiKey, apiUrl }: { name: string; apiKey: string; apiUrl: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // First validate the API credentials
      const { data: validationResult, error: validationError } = await supabase.functions.invoke('nuvemshop', {
        body: {
          action: 'validate',
          apiKey,
          apiUrl,
        },
      });

      if (validationError) {
        throw new Error("Erro ao validar credenciais: " + validationError.message);
      }

      if (!validationResult?.success) {
        throw new Error(validationResult?.error || "Credenciais inválidas");
      }

      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      // Create the store
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert({
          user_id: user.id,
          name,
          slug,
          api_key: apiKey,
          api_url: apiUrl,
          nuvemshop_store_id: validationResult.store?.id?.toString() || null,
        })
        .select()
        .single();

      if (storeError) {
        if (storeError.code === '23505') {
          throw new Error("Já existe uma loja com esse nome");
        }
        throw storeError;
      }

      // Create default settings
      const { error: settingsError } = await supabase
        .from('store_settings')
        .insert({
          store_id: store.id,
          return_window_days: 7,
          allow_refund: true,
          allow_store_credit: true,
          store_credit_bonus: 5,
          credit_format: 'coupon',
          requires_reason: true,
          allow_partial_returns: true,
        });

      if (settingsError) throw settingsError;

      return store;
    },
    onSuccess: (store) => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast({
        title: "Loja conectada!",
        description: `${store.name} foi adicionada com sucesso.`,
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
