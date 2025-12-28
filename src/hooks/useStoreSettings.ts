import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface StoreSettings {
  id: string;
  store_id: string;
  return_window_days: number;
  allow_refund: boolean;
  allow_store_credit: boolean;
  store_credit_bonus: number;
  requires_reason: boolean;
  credit_format: 'coupon' | 'native';
  allow_partial_returns: boolean;
  created_at: string;
  updated_at: string;
}

export function useStoreSettings(storeId?: string) {
  return useQuery({
    queryKey: ['store-settings', storeId],
    queryFn: async () => {
      if (!storeId) return null;

      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching store settings:', error);
        throw error;
      }

      return data as StoreSettings | null;
    },
    enabled: !!storeId,
  });
}

export function useUpdateStoreSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      storeId, 
      settings 
    }: { 
      storeId: string; 
      settings: Partial<Omit<StoreSettings, 'id' | 'store_id' | 'created_at' | 'updated_at'>> 
    }) => {
      // Check if settings exist
      const { data: existing } = await supabase
        .from('store_settings')
        .select('id')
        .eq('store_id', storeId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('store_settings')
          .update({ ...settings, updated_at: new Date().toISOString() })
          .eq('store_id', storeId);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('store_settings')
          .insert({ store_id: storeId, ...settings });

        if (error) throw error;
      }
    },
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: ['store-settings', storeId] });
      toast({
        title: "Configurações salvas",
        description: "As novas regras já estão ativas.",
      });
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    },
  });
}
