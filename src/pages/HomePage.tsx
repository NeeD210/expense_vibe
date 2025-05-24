import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Chart } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement, SubTitle } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, getYear, getMonth } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ExpenseDonutChart } from "@/components/chart-pie-donut-text";
import { ChartBarLineCombined } from "@/components/chart-bar-line-combined";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartDataLabels, LineElement, PointElement, SubTitle);

const categoryColors = [
  '#FF6384',
  '#36A2EB',
  '#FFCE56',
  '#4BC0C0',
  '#9966FF',
  '#FF9F40',
];

export default function HomePage() {
  const allExpenses = useQuery(api.expenses.listExpenses) ?? [];
  const allTransactions = useQuery(api.expenses.listAllTransactions) ?? [];
  const allCategories = useQuery(api.expenses.getCategoriesWithIdsIncludingDeleted) ?? [];
  const paymentTypes = useQuery(api.expenses.getHistoricPaymentTypes) ?? [];
  const [chartType, setChartType] = useState<'doughnut' | 'combined'>('doughnut');

  // Helper function to get payment type name
  const getPaymentTypeName = (paymentTypeId: string | undefined) => {
    if (!paymentTypeId) return "";
    const paymentType = paymentTypes.find(pt => pt._id === paymentTypeId);
    return paymentType?.name ?? "";
  };

  // Helper function to get category name
  const getCategoryName = (categoryId: string | undefined) => {
    if (!categoryId) return "";
    const category = allCategories.find(c => c._id === categoryId);
    return category?.name ?? "";
  };

  // --- Doughnut Chart: Current Month Data ---
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const currentMonthFormatted = format(now, 'MMMM yyyy');

  const currentMonthExpenses = allExpenses.filter(expense => {
    const expenseDate = typeof expense.date === 'string' ? parseISO(expense.date) : new Date(expense.date);
    return isWithinInterval(expenseDate, { start: currentMonthStart, end: currentMonthEnd });
  });

  const totalCurrentMonthAmount = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const categoryTotalsCurrentMonth = allCategories.reduce((acc, category) => {
    acc[category.name] = currentMonthExpenses
      .filter(e => e.categoryId === category._id)
      .reduce((sum, e) => sum + e.amount, 0);
    return acc;
  }, {} as Record<string, number>);

  const activeCategoriesDoughnut = allCategories.filter(category => categoryTotalsCurrentMonth[category.name] > 0);

  const doughnutChartData = activeCategoriesDoughnut.map((category, index) => ({
    category: category.name,
    amount: categoryTotalsCurrentMonth[category.name],
    fill: categoryColors[index % categoryColors.length]
  }));

  // --- Combined Chart: All Expenses Data ---
  const monthlyExpenses: Record<string, Record<string, number>> = {};
  const monthlyIncomes: Record<string, number> = {};
  const monthLabelsSet = new Set<string>();

  allTransactions.forEach(transaction => {
    const dateObj = typeof transaction.date === 'string' ? parseISO(transaction.date) : new Date(transaction.date);
    const monthYear = format(dateObj, 'yyyy-MM');
    monthLabelsSet.add(monthYear);

    if (transaction.transactionType === 'expense') {
      if (!monthlyExpenses[monthYear]) {
        monthlyExpenses[monthYear] = {};
      }
      const categoryName = getCategoryName(transaction.categoryId);
      if (!monthlyExpenses[monthYear][categoryName]) {
        monthlyExpenses[monthYear][categoryName] = 0;
      }
      monthlyExpenses[monthYear][categoryName] += transaction.amount;
    } else if (transaction.transactionType === 'income') {
      if (!monthlyIncomes[monthYear]) {
        monthlyIncomes[monthYear] = 0;
      }
      monthlyIncomes[monthYear] += transaction.amount;
    }
  });

  const sortedMonthLabels = Array.from(monthLabelsSet).sort();
  const displayMonthLabels = sortedMonthLabels.map(my => format(parseISO(my + "-01"), 'MMM yyyy'));
  
  const activeCategoriesBar = allCategories.filter(category => 
    sortedMonthLabels.some(month => (monthlyExpenses[month]?.[category.name] ?? 0) > 0)
  );

  // Calculate total expenses for each month
  const monthlyTotals: Record<string, number> = {};
  sortedMonthLabels.forEach(month => {
    monthlyTotals[month] = Object.values(monthlyExpenses[month] || {}).reduce((sum, amount) => sum + amount, 0);
  });

  // Transform data for the charts
  const barChartData = sortedMonthLabels.map(month => {
    const dataPoint: Record<string, any> = {
      month: format(parseISO(month + "-01"), 'MMM yyyy'),
      total: monthlyTotals[month],
      income: monthlyIncomes[month] ?? 0,
    };
    
    activeCategoriesBar.forEach(category => {
      dataPoint[category.name] = monthlyExpenses[month]?.[category.name] ?? 0;
    });
    
    return dataPoint;
  });

  // Create chart config
  const chartConfig = activeCategoriesBar.reduce((acc, category, index) => {
    acc[category.name] = {
      label: category.name,
      color: categoryColors[index % categoryColors.length],
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  // Add income to chart config for the combined chart
  const combinedChartConfig = {
    ...chartConfig,
    income: {
      label: "Income",
      color: "#10b981", // Green color for income
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-2xl mx-auto w-full">
        {chartType === 'doughnut' ? (
          <div className="aspect-square max-w-xs mx-auto">
            <ExpenseDonutChart 
              data={doughnutChartData}
              title={currentMonthFormatted}
              subtitle="Expenses"
              totalAmount={totalCurrentMonthAmount}
            />
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <ChartBarLineCombined
              data={barChartData}
              config={combinedChartConfig}
              title="Income vs Expenses"
              description={`${format(parseISO(sortedMonthLabels[0] + "-01"), 'MMM yyyy')} - ${format(parseISO(sortedMonthLabels[sortedMonthLabels.length - 1] + "-01"), 'MMM yyyy')}`}
            />
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-center">
        <Button
          onClick={() => setChartType('doughnut')}
          variant={chartType === 'doughnut' ? 'default' : 'outline'}
          className="mx-auto"
        >
          Current Month
        </Button>
        <Button
          onClick={() => setChartType('combined')}
          variant={chartType === 'combined' ? 'default' : 'outline'}
          className="mx-auto"
        >
          Income vs Expenses
        </Button>
      </div>

      {/* Transaction List Grouped by Date with Accordion */}
      <div className="flex flex-col gap-2 mt-4">
        {(() => {
          // Group transactions by date (yyyy-MM-dd)
          const grouped: Record<string, typeof allTransactions> = {};
          [...allTransactions].forEach(tx => {
            const dateObj = typeof tx.date === 'string' ? parseISO(tx.date) : new Date(tx.date);
            const key = format(dateObj, 'yyyy-MM-dd');
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(tx);
          });
          // Sort dates descending
          const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          return (
            <Accordion type="multiple" className="w-full">
              {sortedDates.map(dateKey => {
                const transactions = grouped[dateKey];
                const numTransactions = transactions.length;
                const balance = transactions.reduce((sum, tx) => sum + (tx.transactionType === 'income' ? tx.amount : -tx.amount), 0);
                return (
                  <AccordionItem value={dateKey} key={dateKey}>
                    <AccordionTrigger>
                      <div className="flex w-full items-center justify-between text-base font-semibold">
                        <span>{format(parseISO(dateKey), 'dd-MMM')}</span>
                        <span className="flex items-center gap-2">
                          <span>
                            Amount: <span className={cn(
                              'font-semibold',
                              balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-foreground'
                            )}>
                              {balance > 0 ? '+' : ''}${Math.round(balance).toLocaleString()}
                            </span>
                          </span>
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-2">
                        {transactions
                          .sort((a, b) => {
                            const dateA = typeof a.date === 'string' ? parseISO(a.date) : new Date(a.date);
                            const dateB = typeof b.date === 'string' ? parseISO(b.date) : new Date(b.date);
                            return dateB.getTime() - dateA.getTime();
                          })
                          .map(transaction => (
                            <Card key={transaction._id}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-foreground">{getCategoryName(transaction.categoryId)}</div>
                                    <div className="text-sm text-muted-foreground">{transaction.description}</div>
                                    <div className="text-xs text-muted-foreground/70">
                                      {format(typeof transaction.date === 'string' ? parseISO(transaction.date) : new Date(transaction.date), 'MMM d, yyyy')}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className={cn(
                                      "font-medium",
                                      transaction.transactionType === 'income' ? 'text-green-600' : 'text-foreground'
                                    )}>
                                      {transaction.transactionType === 'income' ? '+' : ''}${Math.round(transaction.amount).toLocaleString()}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {transaction.transactionType === 'expense' && getPaymentTypeName(transaction.paymentTypeId)}
                                      {transaction.cuotas && transaction.cuotas > 1 && ` - ${transaction.cuotas} cuota${transaction.cuotas > 1 ? 's' : ''}`}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          );
        })()}
      </div>
    </div>
  );
}
