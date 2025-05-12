import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doughnut, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, getYear, getMonth } from "date-fns";
import { useState } from "react";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, ChartDataLabels);

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
  const monthLabelsSet = new Set<string>();

  allExpenses.forEach(expense => {
    const dateObj = typeof expense.date === 'string' ? parseISO(expense.date) : new Date(expense.date);
    const monthYear = format(dateObj, 'yyyy-MM');
    monthLabelsSet.add(monthYear);

    if (!monthlyExpenses[monthYear]) {
      monthlyExpenses[monthYear] = {};
    }
    if (!monthlyExpenses[monthYear][expense.category]) {
      monthlyExpenses[monthYear][expense.category] = 0;
    }
    monthlyExpenses[monthYear][expense.category] += expense.amount;
  });

  const sortedMonthLabels = Array.from(monthLabelsSet).sort();
  const displayMonthLabels = sortedMonthLabels.map(my => format(parseISO(my + "-01"), 'MMM yyyy'));
  
  const activeCategoriesBar = allCategories.filter(category => 
    sortedMonthLabels.some(month => (monthlyExpenses[month]?.[category] ?? 0) > 0)
  );

  const barChartData = {
    labels: displayMonthLabels,
    datasets: activeCategoriesBar.map((category) => ({
      label: category,
      data: sortedMonthLabels.map(month => monthlyExpenses[month]?.[category] ?? 0),
      backgroundColor: categoryColors[allCategories.indexOf(category) % categoryColors.length],
    })),
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        display: false,
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
            filter: function(legendItem: any) {
                return activeCategoriesBar.includes(legendItem.text);
            }
        }
      },
      title: {
        display: true,
        text: 'Overall Monthly Expenses by Category',
      },
      datalabels: {
        display: function(context: any) {
          const isLastDataset = context.datasetIndex === context.chart.data.datasets.length - 1;
          if (!isLastDataset) return false;
          let total = 0;
          context.chart.data.datasets.forEach((dataset: any) => {
            total += dataset.data[context.dataIndex] ?? 0;
          });
          return total > 0;
        },
        formatter: function(value: number, context: any) {
          let total = 0;
          context.chart.data.datasets.forEach((dataset: any) => {
            total += dataset.data[context.dataIndex] ?? 0;
          });
          return total > 0 ? '$' + total.toFixed(2) : '';
        },
        color: '#333',
        anchor: 'end' as const,
        align: 'top' as const,
        offset: -5,
        font: {
            weight: 'bold' as const
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
                  text: [currentMonthFormatted, `Monthly Expenses - $${totalCurrentMonthAmount.toFixed(2)}`],
                  position: 'top' as const,
                }
              }
            }} 
          />
        ) : (
          <Bar data={barChartData} options={barChartOptions} />
        )}
      </div>
      <button
        onClick={() => setChartType(prev => prev === 'doughnut' ? 'bar' : 'doughnut')}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition-colors mx-auto mt-4"
      >
        Switch to {chartType === 'doughnut' ? 'Overall Bar' : 'Current Month Doughnut'} Chart
      </button>

      <div className="flex flex-col gap-2 mt-4">
        {(chartType === 'doughnut' ? currentMonthExpenses : allExpenses).map(expense => (
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
              ${expense.amount.toFixed(2)}
              <div className="text-sm text-gray-500 font-normal text-right">
                {expense.paymentType}
                {expense.cuotas && expense.cuotas > 1 && ` - ${expense.cuotas} cuota${expense.cuotas > 1 ? 's' : ''}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
