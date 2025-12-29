import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ShippingQuote {
  id: number;
  name: string;
  price: string;
  discount: string;
  delivery_time: number;
  delivery_range: {
    min: number;
    max: number;
  };
  company: {
    id: number;
    name: string;
    picture: string;
  };
}

export function useCalculateShipping() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ returnRequestId }: { returnRequestId: string }) => {
      const { data, error } = await supabase.functions.invoke('melhor-envio', {
        body: {
          action: 'calculate',
          returnRequestId,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Erro ao calcular frete');
      }

      return data.quotes as ShippingQuote[];
    },
    onError: (error) => {
      console.error('Error calculating shipping:', error);
      toast({
        title: "Erro ao calcular frete",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCreateShippingLabel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      returnRequestId, 
      serviceId 
    }: { 
      returnRequestId: string; 
      serviceId: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('melhor-envio', {
        body: {
          action: 'create-label',
          returnRequestId,
          serviceId,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Erro ao criar etiqueta');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['return-requests'] });
      toast({
        title: "Etiqueta criada",
        description: "Agora você pode comprar e imprimir a etiqueta.",
      });
    },
    onError: (error) => {
      console.error('Error creating label:', error);
      toast({
        title: "Erro ao criar etiqueta",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCheckoutShipping() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ returnRequestId }: { returnRequestId: string }) => {
      const { data, error } = await supabase.functions.invoke('melhor-envio', {
        body: {
          action: 'checkout',
          returnRequestId,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Erro ao comprar etiqueta');
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['return-requests'] });
      toast({
        title: "Etiqueta gerada!",
        description: data.trackingCode 
          ? `Código de rastreio: ${data.trackingCode}` 
          : "A etiqueta está pronta para impressão.",
      });
    },
    onError: (error) => {
      console.error('Error checking out shipping:', error);
      toast({
        title: "Erro ao gerar etiqueta",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useGetTracking() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ returnRequestId }: { returnRequestId: string }) => {
      const { data, error } = await supabase.functions.invoke('melhor-envio', {
        body: {
          action: 'tracking',
          returnRequestId,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Erro ao buscar rastreio');
      }

      return data;
    },
    onError: (error) => {
      console.error('Error getting tracking:', error);
      toast({
        title: "Erro ao buscar rastreio",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}