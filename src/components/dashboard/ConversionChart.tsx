import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ConversionChartProps {
  data: {
    month: string;
    refunds: number;
    storeCredits: number;
  }[];
}

export function ConversionChart({ data }: ConversionChartProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-base font-semibold mb-4">Tendência de Conversão</h3>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '16px' }}
              formatter={(value) => (
                <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '12px' }}>
                  {value === 'refunds' ? 'Reembolsos' : 'Créditos na loja'}
                </span>
              )}
            />
            <Bar 
              dataKey="refunds" 
              name="refunds"
              fill="hsl(var(--destructive))" 
              radius={[3, 3, 0, 0]}
              maxBarSize={32}
            />
            <Bar 
              dataKey="storeCredits" 
              name="storeCredits"
              fill="hsl(var(--success))" 
              radius={[3, 3, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
