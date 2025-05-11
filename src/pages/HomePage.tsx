import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { format } from "date-fns";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function HomePage() {
  const expenses = useQuery(api.expenses.listExpenses) ?? [];
  const categories = useQuery(api.expenses.getCategories) ?? [];
  
  const categoryTotals = categories.reduce((acc, category) => {
    acc[category] = expenses
      .filter(e => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);
    return acc;
  }, {} as Record<string, number>);
  
  const chartData = {
    labels: categories,
    datasets: [
      {
        data: categories.map(c => categoryTotals[c]),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
      },
    ],
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="aspect-square max-w-xs mx-auto">
        <Doughnut data={chartData} />
      </div>
      
      <div className="flex flex-col gap-2">
        {expenses.map(expense => (
          <div
            key={expense._id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
          >
            <div>
              <div className="font-medium">{expense.category}</div>
              <div className="text-sm text-gray-500">{expense.description}</div>
              <div className="text-xs text-gray-400">
                {format(expense.date, 'MMM d, yyyy')}
              </div>
            </div>
            <div className="font-medium">
              ${expense.amount.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
