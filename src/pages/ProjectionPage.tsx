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
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

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

  // Now returns a simple array
  const projections = useQuery(api.projections.getProjectedPayments, {}) ?? [];
  const categories = useQuery(api.expenses.getCategoriesWithIdsIncludingDeleted) ?? [];

  // Helper to get category name from id
  const getCategoryName = (categoryId: string) => {
    const cat = categories.find((c: any) => c._id === categoryId);
    return cat ? cat.name : categoryId;
  };

  // Show loading state while data is being fetched
  if (!projections || !categories) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading projections...</div>
        </div>
      </div>
    );
  }

  // Validate each projection item has required fields
  const invalidItems = projections.filter(item => {
    return !item.date || !item.amount || !item.description || !item.type || !item.categoryId;
  });

  if (invalidItems.length > 0) {
    console.error("Invalid projection items:", invalidItems);
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-500">
            Error: Invalid projection items found
            <div className="text-sm mt-2">Found {invalidItems.length} items with missing required fields</div>
          </div>
        </div>
      </div>
    );
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
  const monthlyData: Record<string, { [key in 'credit' | 'expense' | 'income']: number }> = {};
  
  projections.forEach((item) => {
    const date = new Date(item.date);
    const monthKey = format(date, 'yyyy-MM');
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        credit: 0,
        expense: 0,
        income: 0
      };
    }
    
    if (item.type === 'installment') {
      monthlyData[monthKey].credit += item.amount;
    } else if (item.type === 'recurring') {
      if (item.transactionType === 'expense') {
        monthlyData[monthKey].expense += item.amount;
      } else if (item.transactionType === 'income') {
        monthlyData[monthKey].income += item.amount;
      }
    }
  });

  // Transform data for the chart
  const monthKeys = Object.keys(monthlyData).sort();
  const barChartData = monthKeys.map(month => {
    const credit = monthlyData[month].credit;
    const expense = monthlyData[month].expense;
    const income = monthlyData[month].income;
    return {
      month: format(new Date(month + "-01"), 'MMM yyyy'),
      credit,
      expense,
      income,
      total: credit + expense,
    };
  });

  // Create chart config
  const chartConfig = {
    credit: {
      label: "Credit",
      color: typeColors.installment,
    },
    expense: {
      label: "Expense",
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
          {(() => {
            // Group projections by month (yyyy-MM)
            const grouped: Record<string, typeof projections> = {};
            projections.forEach(item => {
              const date = new Date(item.date);
              const key = format(date, 'yyyy-MM');
              if (!grouped[key]) grouped[key] = [];
              grouped[key].push(item);
            });
            const sortedMonths = Object.keys(grouped).sort((a, b) => new Date(b + '-01').getTime() - new Date(a + '-1').getTime());
            return (
              <Accordion type="multiple" className="w-full">
                {sortedMonths.map(monthKey => {
                  const items = grouped[monthKey];
                  const monthLabel = format(new Date(monthKey + '-01'), 'MMM yyyy');
                  const balance = items.reduce((sum, item) => sum + (item.transactionType === 'income' ? item.amount : -item.amount), 0);
                  return (
                    <AccordionItem value={monthKey} key={monthKey}>
                      <AccordionTrigger>
                        <div className="flex w-full items-center justify-between text-base font-semibold">
                          <span>{monthLabel}</span>
                          <span className="flex items-center gap-2">
                            <span>
                              Amount: <span className={
                                balance > 0 ? 'text-green-600 font-semibold' : balance < 0 ? 'text-red-600 font-semibold' : 'font-semibold text-foreground'
                              }>
                                {balance > 0 ? '+' : ''}${Math.round(balance).toLocaleString()}
                              </span>
                            </span>
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <Accordion type="multiple" className="w-full">
                            {/* Credit: type: 'installment' */}
                            {(() => {
                              const creditItems = items.filter(item => item.type === 'installment');
                              const creditTotal = creditItems.reduce((sum, item) => sum + item.amount, 0);
                              return (
                                <AccordionItem value="credit">
                                  <AccordionTrigger>
                                    <div className="flex w-full items-center justify-between text-base font-semibold">
                                      <span>Credit</span>
                                      <span className={
                                        creditTotal > 0 ? 'text-red-600 font-semibold' : creditTotal < 0 ? 'text-green-600 font-semibold' : 'font-semibold text-foreground'
                                      }>
                                        ${Math.round(creditTotal).toLocaleString()}
                                      </span>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="space-y-4">
                                      {creditItems.length === 0 ? <div className="text-muted-foreground">No credit transactions</div> : creditItems.sort((a, b) => b.date - a.date).map((item, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                          <div>
                                            <p className="font-medium">{item.description}</p>
                                            <p className="text-sm text-gray-500">{format(new Date(item.date), "PPP")}</p>
                                            <p className="text-sm text-gray-500">Category: {getCategoryName(item.categoryId)}</p>
                                            <p className="text-sm text-gray-500">Type: {item.type} ({item.transactionType})</p>
                                          </div>
                                          <p className="font-bold text-red-500">${Math.round(item.amount).toLocaleString()}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            })()}
                            {/* Expense: type: 'recurring', transactionType: 'expense' */}
                            {(() => {
                              const expenseItems = items.filter(item => item.type === 'recurring' && item.transactionType === 'expense');
                              const expenseTotal = expenseItems.reduce((sum, item) => sum + item.amount, 0);
                              return (
                                <AccordionItem value="expense">
                                  <AccordionTrigger>
                                    <div className="flex w-full items-center justify-between text-base font-semibold">
                                      <span>Expense</span>
                                      <span className="text-red-600 font-semibold">
                                        -${Math.round(expenseTotal).toLocaleString()}
                                      </span>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="space-y-4">
                                      {expenseItems.length === 0 ? <div className="text-muted-foreground">No expense transactions</div> : expenseItems.sort((a, b) => b.date - a.date).map((item, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                          <div>
                                            <p className="font-medium">{item.description}</p>
                                            <p className="text-sm text-gray-500">{format(new Date(item.date), "PPP")}</p>
                                            <p className="text-sm text-gray-500">Category: {getCategoryName(item.categoryId)}</p>
                                            <p className="text-sm text-gray-500">Type: {item.type} ({item.transactionType})</p>
                                          </div>
                                          <p className="font-bold text-red-500">-${Math.round(item.amount).toLocaleString()}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            })()}
                            {/* Income: type: 'recurring', transactionType: 'income' */}
                            {(() => {
                              const incomeItems = items.filter(item => item.type === 'recurring' && item.transactionType === 'income');
                              const incomeTotal = incomeItems.reduce((sum, item) => sum + item.amount, 0);
                              return (
                                <AccordionItem value="income">
                                  <AccordionTrigger>
                                    <div className="flex w-full items-center justify-between text-base font-semibold">
                                      <span>Income</span>
                                      <span className="text-green-600 font-semibold">
                                        +${Math.round(incomeTotal).toLocaleString()}
                                      </span>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="space-y-4">
                                      {incomeItems.length === 0 ? <div className="text-muted-foreground">No income transactions</div> : incomeItems.sort((a, b) => b.date - a.date).map((item, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                          <div>
                                            <p className="font-medium">{item.description}</p>
                                            <p className="text-sm text-gray-500">{format(new Date(item.date), "PPP")}</p>
                                            <p className="text-sm text-gray-500">Category: {getCategoryName(item.categoryId)}</p>
                                            <p className="text-sm text-gray-500">Type: {item.type} ({item.transactionType})</p>
                                          </div>
                                          <p className="font-bold text-green-500">+${Math.round(item.amount).toLocaleString()}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            })()}
                          </Accordion>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
} 