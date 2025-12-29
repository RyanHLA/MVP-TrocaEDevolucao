import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

export interface ReturnRequestItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  reason?: string;
}

export interface ReturnRequest {
  id: string;
  store_id: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  items: ReturnRequestItem[];
  total_value: number;
  credit_value: number | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  resolution_type: 'refund' | 'store_credit' | null;
  reason: string | null;
  created_at: string;
  updated_at: string;
  // Shipping fields
  shipping_provider: string | null;
  shipping_id: string | null;
  tracking_code: string | null;
  label_url: string | null;
  shipping_cost: number | null;
  // Customer address
  customer_phone: string | null;
  customer_postal_code: string | null;
  customer_address: string | null;
  customer_address_number: string | null;
  customer_district: string | null;
  customer_city: string | null;
  customer_state: string | null;
}

export interface DashboardMetrics {
  totalRequests: number;
  storeCreditConversion: number;
  totalRefundedValue: number;
  retainedRevenue: number;
  bonusCost: number;
  pendingRequests: number;
}

// Parse JSON items from database
function parseItems(items: Json): ReturnRequestItem[] {
  if (Array.isArray(items)) {
    return items as unknown as ReturnRequestItem[];
  }
  return [];
}

export function useReturnRequests(storeId?: string) {
  return useQuery({
    queryKey: ['return-requests', storeId],
    queryFn: async () => {
      let query = supabase
        .from('return_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching return requests:', error);
        throw error;
      }

      return (data || []).map(r => ({
        ...r,
        items: parseItems(r.items),
        status: r.status as ReturnRequest['status'],
        resolution_type: r.resolution_type as ReturnRequest['resolution_type'],
      })) as ReturnRequest[];
    },
  });
}

export function useDashboardMetrics(storeId?: string) {
  return useQuery({
    queryKey: ['dashboard-metrics', storeId],
    queryFn: async () => {
      let query = supabase
        .from('return_requests')
        .select('*');

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching metrics:', error);
        throw error;
      }

      const requests = data || [];
      
      const totalRequests = requests.length;
      const storeCreditRequests = requests.filter(r => r.resolution_type === 'store_credit');
      const refundRequests = requests.filter(r => r.resolution_type === 'refund');
      const pendingRequests = requests.filter(r => r.status === 'pending').length;
      
      const storeCreditConversion = totalRequests > 0 
        ? Math.round((storeCreditRequests.length / totalRequests) * 100) 
        : 0;
      
      const totalRefundedValue = refundRequests
        .filter(r => r.status === 'approved' || r.status === 'completed')
        .reduce((sum, r) => sum + Number(r.total_value), 0);
      
      const retainedRevenue = storeCreditRequests
        .filter(r => r.status === 'approved' || r.status === 'completed')
        .reduce((sum, r) => sum + Number(r.total_value), 0);
      
      const bonusCost = storeCreditRequests
        .filter(r => r.status === 'approved' || r.status === 'completed')
        .reduce((sum, r) => sum + (Number(r.credit_value || 0) - Number(r.total_value)), 0);

      return {
        totalRequests,
        storeCreditConversion,
        totalRefundedValue,
        retainedRevenue,
        bonusCost,
        pendingRequests,
      } as DashboardMetrics;
    },
  });
}

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      customerEmail, 
      customerName, 
      orderNumber, 
      storeName 
    }: { 
      id: string; 
      status: 'approved' | 'rejected' | 'completed';
      customerEmail: string;
      customerName: string;
      orderNumber: string;
      storeName: string;
    }) => {
      // Update status in database
      const { error } = await supabase
        .from('return_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Send email notification
      try {
        const { error: emailError } = await supabase.functions.invoke('send-return-notification', {
          body: {
            customerEmail,
            customerName,
            orderNumber,
            status,
            storeName,
          },
        });

        if (emailError) {
          console.error('Error sending email notification:', emailError);
        }
      } catch (emailErr) {
        console.error('Failed to send email notification:', emailErr);
      }
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['return-requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      
      const messages = {
        approved: { title: "Solicitação aprovada", description: "O cliente foi notificado por email." },
        rejected: { title: "Solicitação rejeitada", description: "O cliente foi notificado por email." },
        completed: { title: "Solicitação concluída", description: "O cliente foi notificado por email." },
      };
      
      toast(messages[status]);
    },
    onError: (error) => {
      console.error('Error updating request:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a solicitação.",
        variant: "destructive",
      });
    },
  });
}
