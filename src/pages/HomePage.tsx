import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doughnut, Chart } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement, SubTitle } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, getYear, getMonth } from "date-fns";
import { useState } from "react";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, ChartDataLabels, LineElement, PointElement, SubTitle);

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
  const allCategories = useQuery(api.expenses.getCategories) ?? [];
  const [chartType, setChartType] = useState<'doughnut' | 'bar'>('doughnut');

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
    acc[category] = currentMonthExpenses
      .filter(e => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);
    return acc;
  }, {} as Record<string, number>);

  const activeCategoriesDoughnut = allCategories.filter(category => categoryTotalsCurrentMonth[category] > 0);

  const doughnutChartData = {
    labels: activeCategoriesDoughnut,
    datasets: [
      {
        data: activeCategoriesDoughnut.map(c => categoryTotalsCurrentMonth[c]),
        backgroundColor: activeCategoriesDoughnut.map((category) => categoryColors[allCategories.indexOf(category) % categoryColors.length]),
      },
    ],
  };
  // --- End Doughnut Chart Logic ---

  // --- Bar Chart: All Expenses Data ---
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
      if (!monthlyExpenses[monthYear][transaction.category]) {
        monthlyExpenses[monthYear][transaction.category] = 0;
      }
      monthlyExpenses[monthYear][transaction.category] += transaction.amount;
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
    sortedMonthLabels.some(month => (monthlyExpenses[month]?.[category] ?? 0) > 0)
  );

  // Calculate max values for proper scaling
  const maxExpense = sortedMonthLabels.reduce((max, month) => {
    const monthTotal = Object.values(monthlyExpenses[month] || {}).reduce((sum, amount) => sum + amount, 0);
    return Math.max(max, monthTotal);
  }, 0);

  const maxIncome = sortedMonthLabels.reduce((max, month) => {
    return Math.max(max, monthlyIncomes[month] || 0);
  }, 0);

  const maxValue = Math.max(maxExpense, maxIncome);
  const yAxisMax = Math.ceil(maxValue / 100) * 100; // Round up to nearest hundred

  const barChartData = {
    labels: displayMonthLabels,
    datasets: [
      ...activeCategoriesBar.map((category) => ({
        type: 'bar' as const,
        label: category,
        data: sortedMonthLabels.map(month => monthlyExpenses[month]?.[category] ?? 0),
        backgroundColor: categoryColors[allCategories.indexOf(category) % categoryColors.length],
        stack: 'stack0',
      })),
      {
        type: 'line' as const,
        label: 'Income',
        data: sortedMonthLabels.map(month => monthlyIncomes[month] ?? 0),
        borderColor: '#4CAF50',
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
      }
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false
        }
      },
      y: {
        stacked: true,
        display: false,
        beginAtZero: true,
        suggestedMax: yAxisMax,
        type: 'linear' as const,
        grid: {
          display: false
        },
        ticks: {
          display: false
        }
      },
      y1: {
        display: false,
        grid: {
          display: false
        },
        ticks: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          filter: function(legendItem: any) {
            return activeCategoriesBar.includes(legendItem.text) || legendItem.text === 'Income';
          }
        }
      },
      title: {
        display: true,
        text: 'Monthly Expenses and Income',
        font: {
          size: 20,
          weight: 'bold' as const
        },
        color: '#000000'
      },
      datalabels: {
        display: function(context: any) {
          const dataset = context.dataset;
          const value = dataset.data[context.dataIndex];
          // Show label for income line or for the last bar dataset (total expenses)
          return value > 0 && (dataset.type === 'line' || context.datasetIndex === context.chart.data.datasets.length - 2);
        },
        formatter: function(value: number, context: any) {
          const dataset = context.dataset;
          if (dataset.type === 'line') {
            return '$' + Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
          }
          // For bars, calculate total expenses for this month
          let total = 0;
          context.chart.data.datasets.forEach((ds: any) => {
            if (ds.type === 'bar') {
              total += ds.data[context.dataIndex] ?? 0;
            }
          });
          return '$' + Math.round(total).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        },
        color: '#333',
        anchor: 'end' as const,
        align: 'top' as const,
        offset: 4,
        font: {
          weight: 'bold' as const,
          size: 11
        }
      },
    },
  };
 // --- End Bar Chart Logic ---

  return (
    <div className="flex flex-col gap-6">
      <div className="aspect-square max-w-xs mx-auto">
        {chartType === 'doughnut' ? (
          <Doughnut 
            data={doughnutChartData} 
            options={{ 
              maintainAspectRatio: false,
              plugins: { 
                legend: { 
                  position: 'bottom' as const, 
                  labels: { 
                    filter: (legendItem: any) => activeCategoriesDoughnut.includes(legendItem.text)
                  }
                },
                title: {
                  display: true,
                  text: `${currentMonthFormatted}\nMonthly Expenses - $${totalCurrentMonthAmount.toFixed(2)}`,
                  position: 'top' as const,
                  font: {
                    size: 16,
                    weight: 'bold' as const
                  },
                  color: '#000000'
                }
              }
            }} 
          />
        ) : (
          <Chart type="bar" data={barChartData} options={barChartOptions} />
        )}
      </div>
      <button
        onClick={() => setChartType(prev => prev === 'doughnut' ? 'bar' : 'doughnut')}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition-colors mx-auto mt-4"
      >
        Switch to {chartType === 'doughnut' ? 'Overall Bar' : 'Current Month Doughnut'} Chart
      </button>

      <div className="flex flex-col gap-2 mt-4">
        {[...allTransactions]
          .sort((a, b) => {
            const dateA = typeof a.date === 'string' ? parseISO(a.date) : new Date(a.date);
            const dateB = typeof b.date === 'string' ? parseISO(b.date) : new Date(b.date);
            return dateB.getTime() - dateA.getTime();
          })
          .map(expense => (
          <div
            key={expense._id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
          >
            <div>
              <div className="font-medium">{expense.category}</div>
              <div className="text-sm text-gray-500">{expense.description}</div>
              <div className="text-xs text-gray-400">
                {format(typeof expense.date === 'string' ? parseISO(expense.date) : new Date(expense.date), 'MMM d, yyyy')}
              </div>
            </div>
            <div className="font-medium text-right">
              <span className={expense.transactionType === 'income' ? 'text-green-600' : ''}>
                {expense.transactionType === 'income' ? '+' : ''}${expense.amount.toFixed(2)}
              </span>
              <div className="text-sm text-gray-500 font-normal text-right">
                {expense.transactionType === 'expense' && expense.paymentType}
                {expense.cuotas && expense.cuotas > 1 && ` - ${expense.cuotas} cuota${expense.cuotas > 1 ? 's' : ''}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
