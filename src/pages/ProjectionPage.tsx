import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth0 } from "@auth0/auth0-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { ChartBarLineCombined } from "@/components/chart-bar-line-combined";

interface ProjectionItem {
  date: number;
  amount: number;
  description: string;
  type: "installment" | "recurring";
  originalExpenseId?: string;
  recurringTransactionId?: string;
  categoryId: string;
  paymentTypeId: string;
  transactionType?: string;
}

// Colors for the different transaction types
const typeColors = {
  installment: '#C554C4', // Scheduled Payments (bright magenta/violet)
  recurring: '#7C54C4',   // Recurring Expenses (purple)
  income: '#10b981'       // Income (green, as before)
};

export default function ProjectionPage() {
  const { user } = useAuth0();

  const projections = useQuery(api.projections.getProjectedPayments, {});

  const categories = useQuery(api.expenses.getCategoriesWithIdsIncludingDeleted) ?? [];

  // Helper to get category name from id
  const getCategoryName = (categoryId: string) => {
    const cat = categories.find((c: any) => c._id === categoryId);
    return cat ? cat.name : categoryId;
  };

  if (!projections) {
    return <div>Loading...</div>;
  }

  // Calculate summary statistics
  const totalExpenses = projections
    .filter((item) => item.transactionType === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalIncome = projections
    .filter((item) => item.transactionType === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  const netFlow = totalIncome - totalExpenses;

  // Prepare data for bar+line chart
  // Group by month for the chart
  const monthlyData: Record<string, { [key in 'installment' | 'recurring' | 'income']: number }> = {};
  
  projections.forEach((item) => {
    const date = new Date(item.date);
    const monthKey = format(date, 'yyyy-MM');
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        installment: 0,
        recurring: 0,
        income: 0
      };
    }
    
    if (item.transactionType === 'expense') {
      // Group by the type (installment or recurring) instead of category
      monthlyData[monthKey][item.type] += item.amount;
    } else if (item.transactionType === 'income') {
      monthlyData[monthKey].income += item.amount;
    }
  });

  // Transform data for the chart
  const monthKeys = Object.keys(monthlyData).sort();
  const barChartData = monthKeys.map(month => {
    const installment = monthlyData[month].installment;
    const recurring = monthlyData[month].recurring;
    const income = monthlyData[month].income;
    return {
      month: format(new Date(month + "-01"), 'MMM yyyy'),
      installment,
      recurring,
      total: installment + recurring,
      income,
    };
  });

  // Create chart config
  const chartConfig = {
    installment: {
      label: "Scheduled Payments",
      color: typeColors.installment,
    },
    recurring: {
      label: "Recurring Expenses",
      color: typeColors.recurring,
    },
    income: {
      label: "Income",
      color: typeColors.income,
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Financial Projections</h1>

      {/* 1. Summary Cards */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 w-full">
        <Card className="w-full sm:flex-1">
          <CardHeader>
            <CardTitle className="text-base md:text-lg lg:text-xl xl:text-2xl">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-red-500 text-xl sm:text-2xl md:text-3xl lg:text-3xl xl:text-3xl">
              ${Math.round(totalExpenses).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="w-full sm:flex-1">
          <CardHeader>
            <CardTitle className="text-base md:text-lg lg:text-xl xl:text-2xl">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-green-500 text-xl sm:text-2xl md:text-3xl lg:text-3xl xl:text-3xl">
              ${Math.round(totalIncome).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="w-full sm:flex-1">
          <CardHeader>
            <CardTitle className="text-base md:text-lg lg:text-xl xl:text-2xl">Net Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`font-bold ${netFlow >= 0 ? "text-green-500" : "text-red-500"} text-xl sm:text-2xl md:text-3xl lg:text-3xl xl:text-3xl`}>
              ${Math.round(netFlow).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Bar Chart */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="max-w-full md:max-w-3xl mx-auto aspect-[1.618/1]">
            <ChartBarLineCombined
              data={barChartData}
              config={chartConfig}
              title="Projected Income vs Expenses"
              description={`${format(new Date(monthKeys[0] + "-01"), 'MMM yyyy')} - ${format(new Date(monthKeys[monthKeys.length - 1] + "-01"), 'MMM yyyy')}`}
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. List View */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {projections.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{item.description}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(item.date), "PPP")}
                  </p>
                  <p className="text-sm text-gray-500">
                    Category: {getCategoryName(item.categoryId)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Type: {item.type} ({item.transactionType})
                  </p>
                </div>
                <p
                  className={`font-bold ${
                    item.transactionType === "expense"
                      ? "text-red-500"
                      : "text-green-500"
                  }`}
                >
                  ${Math.round(item.amount).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 