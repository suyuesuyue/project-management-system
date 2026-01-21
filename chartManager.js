// 图表管理器
class ChartManager {
    constructor() {
        this.charts = {};
    }

    // 创建柱状图
    createBarChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // 默认配置
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: options.title || '柱状图'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label.includes('执行率') || label.includes('%')) {
                                return `${label}: ${context.parsed.y.toFixed(2)}%`;
                            }
                            return `${label}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: options.xTitle || '项目'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: options.yTitle || '数值'
                    },
                    ticks: options.yAxisConfig?.ticks || {}
                }
            }
        };

        // 合并配置
        const chartOptions = { ...defaultOptions, ...options };

        // 如果已存在图表，先销毁
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        // 创建新图表
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: chartOptions
        });

        return this.charts[canvasId];
    }

    // 创建折线图
    createLineChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: options.title || '折线图'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label.includes('执行率') || label.includes('%')) {
                                return `${label}: ${context.parsed.y.toFixed(2)}%`;
                            }
                            return `${label}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: options.xTitle || '项目'
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: options.yTitle || '执行率(%)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        },
                        ...(options.yAxisConfig?.ticks || {})
                    }
                }
            }
        };

        const chartOptions = { ...defaultOptions, ...options };

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: data,
            options: chartOptions
        });

        return this.charts[canvasId];
    }

    // 创建饼图（修改版，不使用ChartDataLabels插件）
    createPieChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'right'
                },
                title: {
                    display: true,
                    text: options.title || '饼状图'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        };

        const chartOptions = { ...defaultOptions, ...options };

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'pie',
            data: data,
            options: chartOptions
        });

        return this.charts[canvasId];
    }

    // 创建双柱状图（用于匹配资金）- 修改版，不使用ChartDataLabels插件
    createDualBarChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: options.title || '匹配资金分析'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: options.xTitle || '项目'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: options.yTitle || '金额(万元)'
                    }
                }
            }
        };

        const chartOptions = { ...defaultOptions, ...options };

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: chartOptions
        });

        return this.charts[canvasId];
    }

    // 创建分组柱状图（用于匹配资金对比）
    createGroupedBarChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: options.title || '分组柱状图'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: options.xTitle || '项目'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: options.yTitle || '数值'
                    }
                }
            }
        };

        const chartOptions = { ...defaultOptions, ...options };

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: chartOptions
        });

        return this.charts[canvasId];
    }

    // 创建执行率图表
    createExecutionRateChart(canvasId, labels, executionRates, options = {}) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // 准备数据
        const validData = [];
        const validLabels = [];
        
        // 过滤无效数据
        for (let i = 0; i < executionRates.length; i++) {
            const rate = executionRates[i];
            if (rate !== '' && rate !== 0 && !isNaN(parseFloat(rate))) {
                validData.push(parseFloat(rate));
                validLabels.push(labels[i] || `项目${i + 1}`);
            }
        }
        
        const data = {
            labels: validLabels,
            datasets: [{
                label: '执行率%',
                data: validData,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.1
            }]
        };

        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: options.title || '经费执行率'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `执行率: ${context.parsed.y.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: options.xTitle || '项目'
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: options.yTitle || '执行率(%)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        };

        const chartOptions = { ...defaultOptions, ...options };

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: data,
            options: chartOptions
        });

        return this.charts[canvasId];
    }

    // 创建组合图表（柱状图 + 折线图）
    createCombinationChart(canvasId, barData, lineData, options = {}) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const datasets = [];
        
        // 添加柱状图数据
        if (barData && barData.datasets) {
            barData.datasets.forEach(dataset => {
                datasets.push({
                    ...dataset,
                    type: 'bar'
                });
            });
        }
        
        // 添加折线图数据
        if (lineData && lineData.datasets) {
            lineData.datasets.forEach(dataset => {
                datasets.push({
                    ...dataset,
                    type: 'line',
                    yAxisID: 'y-line'
                });
            });
        }
        
        const data = {
            labels: barData.labels || lineData.labels,
            datasets: datasets
        };

        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            stacked: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: options.title || '组合图表'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            let value = context.parsed.y;
                            
                            // 如果是执行率数据，添加百分号
                            if (context.dataset.yAxisID === 'y-line' || label.includes('执行率') || label.includes('%')) {
                                return `${label}: ${value.toFixed(2)}%`;
                            }
                            return `${label}: ${value}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: options.xTitle || '项目'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: options.yTitle || '金额(万元)'
                    },
                    beginAtZero: true
                },
                'y-line': {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: options.yLineTitle || '执行率(%)'
                    },
                    beginAtZero: true,
                    max: 100,
                    // 确保右侧Y轴不重叠
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        };

        const chartOptions = { ...defaultOptions, ...options };

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: chartOptions
        });

        return this.charts[canvasId];
    }

    // 创建水平柱状图
    createHorizontalBarChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const defaultOptions = {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: options.title || '水平柱状图'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label.includes('执行率') || label.includes('%')) {
                                return `${label}: ${context.parsed.x.toFixed(2)}%`;
                            }
                            return `${label}: ${context.parsed.x}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: options.xTitle || '数值'
                    },
                    ticks: {
                        callback: function(value) {
                            if (options.xTitle && (options.xTitle.includes('执行率') || options.xTitle.includes('%'))) {
                                return value + '%';
                            }
                            return value;
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: options.yTitle || '项目'
                    }
                }
            }
        };

        const chartOptions = { ...defaultOptions, ...options };

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: chartOptions
        });

        return this.charts[canvasId];
    }

    // 创建堆叠柱状图
    createStackedBarChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: options.title || '堆叠柱状图'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: options.xTitle || '项目'
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: options.yTitle || '数值'
                    }
                }
            }
        };

        const chartOptions = { ...defaultOptions, ...options };

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: chartOptions
        });

        return this.charts[canvasId];
    }

    // 创建简单双柱状图（优化版，不需要插件）
    createSimpleDualBarChart(canvasId, labels, dataset1, dataset2, options = {}) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        const data = {
            labels: labels,
            datasets: [
                {
                    label: dataset1.label || '数据集1',
                    data: dataset1.data || [],
                    backgroundColor: dataset1.backgroundColor || 'rgba(255, 159, 64, 0.7)', // 浅橙色
                    borderColor: dataset1.borderColor || 'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                },
                {
                    label: dataset2.label || '数据集2',
                    data: dataset2.data || [],
                    backgroundColor: dataset2.backgroundColor || 'rgba(54, 162, 235, 0.7)', // 浅蓝色
                    borderColor: dataset2.borderColor || 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }
            ]
        };
        
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: options.title || '双柱状图'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: options.xTitle || '项目'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: options.yTitle || '数值'
                    }
                }
            }
        };

        const chartOptions = { ...defaultOptions, ...options };

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: chartOptions
        });

        return this.charts[canvasId];
    }

    // 销毁所有图表
    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    // 重置图表
    resetChart(canvasId) {
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
            delete this.charts[canvasId];
        }
    }

    // 更新图表数据
    updateChartData(canvasId, newData) {
        if (this.charts[canvasId]) {
            this.charts[canvasId].data = newData;
            this.charts[canvasId].update();
        }
    }

    // 更新图表选项
    updateChartOptions(canvasId, newOptions) {
        if (this.charts[canvasId]) {
            Object.assign(this.charts[canvasId].options, newOptions);
            this.charts[canvasId].update();
        }
    }
}

// 导出全局变量
window.ChartManager = ChartManager;