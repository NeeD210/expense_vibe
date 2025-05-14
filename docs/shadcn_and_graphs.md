# Shadcn/UI and Graphs Integration Guide

## Shadcn/UI Setup

### Installation

1. First, install shadcn/ui in your project:

```bash
npx shadcn-ui@latest init
```

When prompted, choose the following options:
- Style: Default
- Base color: Slate
- CSS variables: Yes
- React Server Components: No (since we're using Vite)
- Tailwind CSS: Yes
- Components directory: @/components
- Utils directory: @/lib/utils
- Include example components: No

2. Update your `tailwind.config.js` to include the new paths:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

3. Create the utils file at `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Installing Components

To install a component, use the following command:

```bash
npx shadcn-ui@latest add button
```

Replace `button` with any component you want to add. Available components include:
- button
- card
- dialog
- dropdown-menu
- input
- select
- tabs
- toast
- and many more...

## Graph Integration with Recharts

For graphs, we'll use Recharts, which works well with shadcn/ui and provides beautiful, responsive charts.

### Installation

```bash
npm install recharts
```

### Example Usage

Here's an example of how to create a line chart using Recharts:

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  { name: 'Jan', expenses: 4000, income: 2400 },
  { name: 'Feb', expenses: 3000, income: 1398 },
  { name: 'Mar', expenses: 2000, income: 9800 },
  { name: 'Apr', expenses: 2780, income: 3908 },
  { name: 'May', expenses: 1890, income: 4800 },
  { name: 'Jun', expenses: 2390, income: 3800 },
];

export function ExpenseIncomeChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses vs Income</CardTitle>
      </CardHeader>
      <CardContent>
        <LineChart
          width={600}
          height={300}
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="expenses" stroke="#ef4444" />
          <Line type="monotone" dataKey="income" stroke="#22c55e" />
        </LineChart>
      </CardContent>
    </Card>
  );
}
```

### Pie Chart Example

```tsx
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  { name: 'Food', value: 400 },
  { name: 'Transport', value: 300 },
  { name: 'Entertainment', value: 300 },
  { name: 'Bills', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function ExpensePieChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <PieChart width={400} height={400}>
          <Pie
            data={data}
            cx={200}
            cy={200}
            labelLine={false}
            outerRadius={150}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </CardContent>
    </Card>
  );
}
```

## Best Practices

1. **Component Organization**
   - Keep shadcn components in `src/components/ui`
   - Create custom components that use shadcn components in `src/components`
   - Use the `cn()` utility for combining Tailwind classes

2. **Graph Components**
   - Create reusable graph components in `src/components/graphs`
   - Use TypeScript interfaces for data structures
   - Implement responsive designs using container queries or media queries

3. **Styling**
   - Use shadcn's built-in theming system
   - Customize colors in `tailwind.config.js`
   - Use CSS variables for consistent styling

4. **Performance**
   - Memoize graph components when necessary
   - Use `useMemo` for data transformations
   - Implement proper loading states

## Common Patterns

### Loading State

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export function GraphSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-[200px]" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[400px] w-full" />
      </CardContent>
    </Card>
  );
}
```

### Error State

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function GraphError() {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Failed to load graph data. Please try again later.
      </AlertDescription>
    </Alert>
  );
}
```

## Resources

- [Shadcn/UI Documentation](https://ui.shadcn.com)
- [Recharts Documentation](https://recharts.org)
- [Tailwind CSS Documentation](https://tailwindcss.com) 