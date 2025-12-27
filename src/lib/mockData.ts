// Mock data for the MVP demonstration

export interface Store {
  id: string;
  name: string;
  slug: string;
  apiKey: string;
  apiUrl: string;
  createdAt: string;
  settings: StoreSettings;
}

export interface StoreSettings {
  returnWindowDays: number;
  allowRefund: boolean;
  allowStoreCredit: boolean;
  storeCreditBonus: number;
  creditFormat: 'coupon' | 'native';
  requiresReason: boolean;
  allowPartialReturns: boolean;
}

export interface ReturnRequest {
  id: string;
  storeId: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  resolution: 'refund' | 'store_credit';
  items: ReturnItem[];
  totalValue: number;
  bonusValue: number;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnItem {
  id: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  reason: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  customerCpf: string;
  items: OrderItem[];
  total: number;
  createdAt: string;
  status: 'delivered' | 'shipped' | 'processing';
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  eligible: boolean;
}

export interface DashboardMetrics {
  totalRequests: number;
  storeCreditConversion: number;
  totalRefundedValue: number;
  totalRetainedValue: number;
  bonusCost: number;
  retainedRevenue: number;
  requestsByStatus: {
    pending: number;
    approved: number;
    rejected: number;
    completed: number;
  };
  monthlyTrend: {
    month: string;
    refunds: number;
    storeCredits: number;
  }[];
}

// Mock stores
export const mockStores: Store[] = [
  {
    id: '1',
    name: 'Fashion Store BR',
    slug: 'fashion-store-br',
    apiKey: 'nv_api_xxxxx',
    apiUrl: 'https://api.nuvemshop.com.br/v1/123456',
    createdAt: '2024-01-15',
    settings: {
      returnWindowDays: 7,
      allowRefund: true,
      allowStoreCredit: true,
      storeCreditBonus: 5,
      creditFormat: 'coupon',
      requiresReason: true,
      allowPartialReturns: true,
    },
  },
  {
    id: '2',
    name: 'Tech Gadgets',
    slug: 'tech-gadgets',
    apiKey: 'nv_api_yyyyy',
    apiUrl: 'https://api.nuvemshop.com.br/v1/789012',
    createdAt: '2024-02-20',
    settings: {
      returnWindowDays: 14,
      allowRefund: false,
      allowStoreCredit: true,
      storeCreditBonus: 10,
      creditFormat: 'coupon',
      requiresReason: true,
      allowPartialReturns: false,
    },
  },
];

// Mock return requests
export const mockReturnRequests: ReturnRequest[] = [
  {
    id: '1',
    storeId: '1',
    orderId: 'ord_001',
    orderNumber: '#12345',
    customerEmail: 'maria@email.com',
    customerName: 'Maria Silva',
    status: 'pending',
    resolution: 'store_credit',
    items: [
      {
        id: 'item_1',
        productName: 'Vestido Floral Verão',
        productImage: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=100&h=100&fit=crop',
        quantity: 1,
        price: 189.90,
        reason: 'Tamanho errado',
      },
    ],
    totalValue: 189.90,
    bonusValue: 9.50,
    reason: 'Tamanho errado',
    createdAt: '2024-12-26T10:30:00Z',
    updatedAt: '2024-12-26T10:30:00Z',
  },
  {
    id: '2',
    storeId: '1',
    orderId: 'ord_002',
    orderNumber: '#12346',
    customerEmail: 'joao@email.com',
    customerName: 'João Santos',
    status: 'approved',
    resolution: 'refund',
    items: [
      {
        id: 'item_2',
        productName: 'Camisa Polo Premium',
        productImage: 'https://images.unsplash.com/photo-1625910513413-5fc530e24b77?w=100&h=100&fit=crop',
        quantity: 2,
        price: 79.90,
        reason: 'Produto com defeito',
      },
    ],
    totalValue: 159.80,
    bonusValue: 0,
    reason: 'Produto com defeito',
    createdAt: '2024-12-25T14:20:00Z',
    updatedAt: '2024-12-26T09:00:00Z',
  },
  {
    id: '3',
    storeId: '1',
    orderId: 'ord_003',
    orderNumber: '#12347',
    customerEmail: 'ana@email.com',
    customerName: 'Ana Oliveira',
    status: 'completed',
    resolution: 'store_credit',
    items: [
      {
        id: 'item_3',
        productName: 'Bolsa de Couro',
        productImage: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=100&h=100&fit=crop',
        quantity: 1,
        price: 299.00,
        reason: 'Mudei de ideia',
      },
    ],
    totalValue: 299.00,
    bonusValue: 14.95,
    reason: 'Mudei de ideia',
    createdAt: '2024-12-24T16:45:00Z',
    updatedAt: '2024-12-26T11:00:00Z',
  },
];

// Mock order for customer portal
export const mockOrder: Order = {
  id: 'ord_demo',
  orderNumber: '54321',
  customerEmail: 'cliente@email.com',
  customerName: 'Cliente Demo',
  customerCpf: '123.456.789-00',
  items: [
    {
      id: 'item_a',
      productId: 'prod_1',
      productName: 'Tênis Esportivo Runner Pro',
      productImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop',
      quantity: 1,
      price: 349.90,
      eligible: true,
    },
    {
      id: 'item_b',
      productId: 'prod_2',
      productName: 'Mochila Urban Style',
      productImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=200&fit=crop',
      quantity: 1,
      price: 189.00,
      eligible: true,
    },
    {
      id: 'item_c',
      productId: 'prod_3',
      productName: 'Boné Snapback Classic',
      productImage: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=200&h=200&fit=crop',
      quantity: 2,
      price: 59.90,
      eligible: false,
    },
  ],
  total: 658.70,
  createdAt: '2024-12-20T08:00:00Z',
  status: 'delivered',
};

// Mock dashboard metrics
export const mockMetrics: DashboardMetrics = {
  totalRequests: 156,
  storeCreditConversion: 68,
  totalRefundedValue: 12450.00,
  totalRetainedValue: 26780.00,
  bonusCost: 1339.00,
  retainedRevenue: 25441.00,
  requestsByStatus: {
    pending: 12,
    approved: 45,
    rejected: 8,
    completed: 91,
  },
  monthlyTrend: [
    { month: 'Jul', refunds: 15, storeCredits: 28 },
    { month: 'Ago', refunds: 12, storeCredits: 32 },
    { month: 'Set', refunds: 18, storeCredits: 41 },
    { month: 'Out', refunds: 14, storeCredits: 38 },
    { month: 'Nov', refunds: 11, storeCredits: 45 },
    { month: 'Dez', refunds: 8, storeCredits: 52 },
  ],
};

export const returnReasons = [
  'Tamanho errado',
  'Produto com defeito',
  'Produto diferente do anunciado',
  'Mudei de ideia',
  'Produto chegou danificado',
  'Atraso na entrega',
  'Outro',
];
