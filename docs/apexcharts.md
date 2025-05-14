# ApexCharts Documentation

## Installation
```bash
npm install react-apexcharts apexcharts
```

## Basic Usage
```jsx
import React from 'react';
import ReactApexChart from 'react-apexcharts';

const Chart = () => {
  const options = {
    chart: {
      type: 'bar'
    },
    series: [{
      name: 'sales',
      data: [30, 40, 35, 50, 49, 60, 70, 91, 125]
    }],
    xaxis: {
      categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999]
    }
  };

  return (
    <div>
      <ReactApexChart 
        options={options}
        series={options.series}
        type="bar"
        height={350}
      />
    </div>
  );
};
```

## Chart Types
- Line
- Area
- Bar
- Histogram
- Pie
- Donut
- Radial Bar
- Scatter
- Bubble
- Heatmap
- Candlestick
- Box Plot
- Radar
- Polar Area
- Range Bar
- Range Area
- Treemap

## Title Configuration
```javascript
options: {
  title: {
    text: 'Monthly Sales',
    align: 'left',
    margin: 10,
    offsetX: 0,
    offsetY: 0,
    floating: false,
    style: {
      fontSize:  '14px',
      fontWeight:  'bold',
      fontFamily:  undefined,
      color:  '#263238'
    },
  },
  subtitle: {
    text: 'Price Movements',
    align: 'left',
    margin: 10,
    offsetX: 0,
    offsetY: 30,
    floating: false,
    style: {
      fontSize:  '12px',
      fontWeight:  'normal',
      fontFamily:  undefined,
      color:  '#9699a2'
    },
  }
}
```

## Legend Configuration
```javascript
options: {
  legend: {
    show: true,
    showForSingleSeries: false,
    showForNullSeries: true,
    showForZeroSeries: true,
    position: 'bottom',
    horizontalAlign: 'center',
    floating: false,
    fontSize: '14px',
    fontFamily: 'Helvetica, Arial',
    fontWeight: 400,
    formatter: undefined,
    inverseOrder: false,
    width: undefined,
    height: undefined,
    tooltipHoverFormatter: undefined,
    customLegendItems: [],
    offsetX: 0,
    offsetY: 0,
    labels: {
      colors: undefined,
      useSeriesColors: false
    },
    markers: {
      width: 12,
      height: 12,
      strokeWidth: 0,
      strokeColor: '#fff',
      fillColors: undefined,
      radius: 12,
      customHTML: undefined,
      onClick: undefined,
      offsetX: 0,
      offsetY: 0
    },
    itemMargin: {
      horizontal: 5,
      vertical: 0
    },
    onItemClick: {
      toggleDataSeries: true
    },
    onItemHover: {
      highlightDataSeries: true
    },
  }
}
```

## Colors and Theme
```javascript
options: {
  theme: {
    mode: 'light',
    palette: 'palette1',
    monochrome: {
      enabled: false,
      color: '#255aee',
      shadeTo: 'light',
      shadeIntensity: 0.65
    },
  },
  colors: ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0']
}
```

## Responsive Configuration
```javascript
options: {
  chart: {
    height: 350,
    type: 'line',
    toolbar: {
      show: true
    }
  },
  responsive: [{
    breakpoint: 480,
    options: {
      chart: {
        width: 200
      },
      legend: {
        position: 'bottom'
      }
    }
  }]
}
```

## Data Labels
```javascript
options: {
  dataLabels: {
    enabled: true,
    enabledOnSeries: undefined,
    formatter: function (val, opts) {
      return val
    },
    textAnchor: 'middle',
    distributed: false,
    offsetX: 0,
    offsetY: 0,
    style: {
      fontSize: '14px',
      fontFamily: 'Helvetica, Arial, sans-serif',
      fontWeight: 'bold',
      colors: undefined
    },
    background: {
      enabled: true,
      foreColor: '#fff',
      padding: 4,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: '#fff',
      opacity: 0.9,
    },
    dropShadow: {
      enabled: false,
      top: 1,
      left: 1,
      blur: 1,
      color: '#000',
      opacity: 0.45
    }
  }
}
```

## Tooltip Configuration
```javascript
options: {
  tooltip: {
    enabled: true,
    enabledOnSeries: undefined,
    shared: true,
    followCursor: false,
    intersect: false,
    inverseOrder: false,
    custom: undefined,
    fillSeriesColor: false,
    theme: false,
    style: {
      fontSize: '12px',
      fontFamily: undefined
    },
    onDatasetHover: {
      highlightDataSeries: false,
    },
    x: {
      show: true,
      format: 'dd MMM',
      formatter: undefined,
    },
    y: {
      formatter: undefined,
      title: {
        formatter: (seriesName) => seriesName,
      },
    },
    marker: {
      show: true,
    },
    items: {
      display: "flex",
    },
    fixed: {
      enabled: false,
      position: "topRight",
      offsetX: 0,
      offsetY: 0,
    },
  }
}
```

## Grid Configuration
```javascript
options: {
  grid: {
    show: true,
    borderColor: '#90A4AE',
    strokeDashArray: 0,
    position: 'back',
    xaxis: {
      lines: {
        show: false
      }
    },
    yaxis: {
      lines: {
        show: true
      }
    },
    row: {
      colors: undefined,
      opacity: 0.5
    },
    column: {
      colors: undefined,
      opacity: 0.5
    },
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    },
  }
}
```

## Animation Configuration
```javascript
options: {
  chart: {
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 800,
      animateGradually: {
        enabled: true,
        delay: 150
      },
      dynamicAnimation: {
        enabled: true,
        speed: 350
      }
    }
  }
}
```

## Events
```javascript
options: {
  chart: {
    events: {
      animationEnd: function(chartContext, config) {
        // Animation ended
      },
      beforeMount: function(chartContext, config) {
        // Chart is about to be mounted
      },
      mounted: function(chartContext, config) {
        // Chart is mounted
      },
      updated: function(chartContext, config) {
        // Chart is updated
      },
      click: function(event, chartContext, config) {
        // Chart is clicked
      },
      mouseMove: function(event, chartContext, config) {
        // Mouse moved over chart
      },
      legendClick: function(chartContext, seriesIndex, config) {
        // Legend item clicked
      },
      markerClick: function(event, chartContext, config) {
        // Marker clicked
      },
      selection: function(chartContext, config) {
        // Selection made
      },
      dataPointSelection: function(event, chartContext, config) {
        // Data point selected
      },
      dataPointMouseEnter: function(event, chartContext, config) {
        // Mouse entered data point
      },
      dataPointMouseLeave: function(event, chartContext, config) {
        // Mouse left data point
      },
      beforeZoom: function(chartContext, config) {
        // Before zoom
      },
      beforeResetZoom: function(chartContext, config) {
        // Before reset zoom
      },
      zoomed: function(chartContext, config) {
        // After zoom
      },
      scrolled: function(chartContext, config) {
        // After scroll
      }
    }
  }
}
```

## Methods
```javascript
// Get chart instance
const chart = ApexCharts.getChartByID('chartId');

// Update options
chart.updateOptions({
  chart: {
    animations: {
      enabled: false
    }
  }
});

// Update series
chart.updateSeries([{
  data: [21, 22, 10, 28, 16, 21, 13, 30]
}]);

// Append data to series
chart.appendData([{
  data: [21, 22, 10, 28]
}]);

// Toggle series
chart.toggleSeries('Series 1');

// Show series
chart.showSeries('Series 1');

// Hide series
chart.hideSeries('Series 1');

// Reset zoom
chart.resetZoom();

// Zoom to specific points
chart.zoomX(
  new Date('28 Jan 2013').getTime(),
  new Date('27 Feb 2013').getTime()
);

// Destroy chart
chart.destroy();
```

## Common Patterns

### Dynamic Updates
```javascript
const [series, setSeries] = useState([{
  name: 'Series 1',
  data: [45, 52, 38, 45, 19, 23, 20]
}]);

const updateData = () => {
  setSeries([{
    name: 'Series 1',
    data: series[0].data.map(() => Math.floor(Math.random() * 100))
  }]);
};
```

### Loading State
```javascript
const [loading, setLoading] = useState(true);

useEffect(() => {
  // Fetch data
  setLoading(false);
}, []);

return (
  <div>
    {loading ? (
      <div>Loading...</div>
    ) : (
      <ReactApexChart
        options={options}
        series={series}
        type="line"
        height={350}
      />
    )}
  </div>
);
```

### Multiple Y-Axis
```javascript
const options = {
  chart: {
    type: 'line',
    stacked: false
  },
  series: [{
    name: 'Series 1',
    type: 'column',
    data: [1.4, 2, 2.5, 1.5, 2.5, 2.8, 3.8, 4.6]
  }, {
    name: 'Series 2',
    type: 'column',
    data: [2, 3, 3, 4, 4, 4, 3, 2]
  }, {
    name: 'Series 3',
    type: 'line',
    data: [20, 29, 37, 36, 44, 45, 50, 58]
  }],
  yaxis: [{
    title: {
      text: 'Series 1 & 2',
    },
  }, {
    opposite: true,
    title: {
      text: 'Series 3'
    }
  }]
};
```

### Mixed Charts
```javascript
const options = {
  chart: {
    type: 'line'
  },
  series: [{
    name: 'Column',
    type: 'column',
    data: [23, 42, 35, 27, 43, 22, 17, 31, 22, 22, 12, 16]
  }, {
    name: 'Line',
    type: 'line',
    data: [30, 25, 36, 30, 45, 35, 64, 52, 59, 36, 39, 51]
  }]
};
```

### Custom Tooltips
```javascript
const options = {
  tooltip: {
    custom: function({series, seriesIndex, dataPointIndex, w}) {
      return '<div class="custom-tooltip">' +
        '<span>' + series[seriesIndex][dataPointIndex] + '</span>' +
        '</div>'
    }
  }
};
```

### Annotations
```javascript
const options = {
  annotations: {
    points: [{
      x: new Date('14 Nov 2012').getTime(),
      y: 8900,
      marker: {
        size: 6,
        fillColor: '#fff',
        strokeColor: 'red',
        radius: 2
      },
      label: {
        borderColor: 'red',
        offsetY: 0,
        style: {
          color: '#fff',
          background: 'red',
        },
        text: 'Point Annotation'
      }
    }]
  }
};
```

## Best Practices

1. **Performance**
   - Use `animations: { enabled: false }` for better performance with large datasets
   - Consider using `chart.redrawPaths()` for dynamic updates
   - Use `chart.updateOptions()` instead of recreating the chart

2. **Responsive Design**
   - Always set a container width
   - Use responsive options for different breakpoints
   - Consider using `parentHeightOffset` for proper sizing

3. **Data Updates**
   - Use `updateSeries()` for smooth updates
   - Consider using `appendData()` for real-time charts
   - Use `toggleSeries()` for showing/hiding series

4. **Styling**
   - Use consistent colors across charts
   - Consider using a theme
   - Use proper spacing and padding

5. **Accessibility**
   - Add proper ARIA labels
   - Ensure sufficient color contrast
   - Provide alternative text for charts

## Troubleshooting

1. **Chart not rendering**
   - Check if container has dimensions
   - Verify data format
   - Check console for errors

2. **Performance issues**
   - Disable animations
   - Reduce data points
   - Use proper update methods

3. **Styling issues**
   - Check CSS specificity
   - Verify theme settings
   - Check container styles

4. **Update issues**
   - Use proper update methods
   - Check data format
   - Verify series structure 