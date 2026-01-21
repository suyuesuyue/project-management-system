// 模态窗口管理器
class ModalManager {
    constructor() {
        this.currentModal = null;
        this.modalQueue = [];
    }

    // 创建模态窗口
    createModal(options = {}) {
        // 销毁现有模态窗口
        if (this.currentModal) {
            this.closeModal();
        }

        const modalId = 'customModal_' + Date.now();
        
        // 创建模态窗口HTML
        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true">
                <div class="modal-dialog ${options.size || 'modal-xl'} modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="${modalId}Label">
                                <i class="${options.icon || 'fas fa-chart-bar'}"></i>
                                ${options.title || '数据分析窗口'}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="关闭"></button>
                        </div>
                        <div class="modal-body">
                            <div id="${modalId}-content">
                                ${options.content || '正在加载...'}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times"></i> 关闭
                            </button>
                            ${options.showFullscreen ? `
                            <button type="button" class="btn btn-primary" id="${modalId}-fullscreen">
                                <i class="fas fa-expand"></i> 全屏
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加到body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer.firstElementChild);

        // 获取模态窗口实例
        const modalElement = document.getElementById(modalId);
        const modal = new bootstrap.Modal(modalElement);
        
        // 存储当前模态窗口
        this.currentModal = {
            id: modalId,
            element: modalElement,
            instance: modal
        };

        // 添加全屏功能
        if (options.showFullscreen) {
            const fullscreenBtn = document.getElementById(`${modalId}-fullscreen`);
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen(modalElement.querySelector('.modal-dialog'));
            });
        }

        // 添加关闭事件监听
        modalElement.addEventListener('hidden.bs.modal', () => {
            this.cleanupModal(modalId);
        });

        return {
            id: modalId,
            element: modalElement,
            instance: modal,
            contentElement: document.getElementById(`${modalId}-content`)
        };
    }

    // 创建图表模态窗口
    createChartModal(title, chartType, data, options = {}) {
        const modalId = 'chartModal_' + Date.now();
        const canvasId = modalId + '_canvas';
        
        const content = `
            <div class="chart-container-large">
                <canvas id="${canvasId}"></canvas>
            </div>
            <div class="mt-3">
                <div class="row">
                    <div class="col-md-6">
                        <h6>数据统计</h6>
                        <div id="${modalId}-stats" class="stats-panel">
                            <!-- 统计数据将在这里显示 -->
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6>数据表格</h6>
                        <div class="table-responsive">
                            <table class="table table-sm" id="${modalId}-table">
                                <!-- 数据表格将在这里显示 -->
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modal = this.createModal({
            title: title,
            icon: this.getChartIcon(chartType),
            content: content,
            showFullscreen: true,
            size: 'modal-xl'
        });

        // 延迟创建图表，确保DOM已加载
        setTimeout(() => {
            this.renderChartInModal(modalId, canvasId, chartType, data, options);
        }, 100);

        return modal;
    }

    // 创建表格模态窗口
    createTableModal(title, headers, rows, options = {}) {
        const modalId = 'tableModal_' + Date.now();
        
        let tableHtml = '<table class="table table-striped table-hover">';
        
        // 表头
        tableHtml += '<thead><tr>';
        headers.forEach(header => {
            tableHtml += `<th>${header}</th>`;
        });
        tableHtml += '</tr></thead>';
        
        // 数据行
        tableHtml += '<tbody>';
        rows.forEach(row => {
            tableHtml += '<tr>';
            row.forEach(cell => {
                tableHtml += `<td>${cell}</td>`;
            });
            tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table>';
        
        const content = `
            <div class="table-responsive">
                ${tableHtml}
            </div>
            <div class="mt-3 text-muted">
                <small>共 ${rows.length} 条记录</small>
            </div>
        `;

        return this.createModal({
            title: title,
            icon: 'fas fa-table',
            content: content,
            showFullscreen: true,
            size: 'modal-xl'
        });
    }

    // 创建PDF查看器模态窗口
    createPDFModal(pdfUrl) {
        const modalId = 'pdfModal_' + Date.now();
        
        const content = `
            <div class="pdf-viewer">
                <iframe src="${pdfUrl}" width="100%" height="600px" frameborder="0"></iframe>
            </div>
            <div class="mt-3">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    如果PDF无法显示，请确保浏览器支持PDF查看功能
                </div>
            </div>
        `;

        return this.createModal({
            title: 'PDF文档查看',
            icon: 'fas fa-file-pdf',
            content: content,
            showFullscreen: true,
            size: 'modal-xl'
        });
    }

    // 在模态窗口中渲染图表 - 修复版本
    renderChartInModal(modalId, canvasId, chartType, data, options) {
        const chartManager = new ChartManager();
        
        // 修复：确保data结构正确
        let chartData = data;
        
        switch (chartType) {
            case 'bar':
                // 柱状图数据处理
                chartManager.createBarChart(canvasId, chartData, options);
                break;
            case 'line':
                // 折线图数据处理
                chartManager.createLineChart(canvasId, chartData, options);
                break;
            case 'pie':
                // 饼图数据格式检查
                if (!chartData.labels || !chartData.datasets || !chartData.datasets[0]) {
                    console.error('饼图数据格式不正确:', chartData);
                    this.updateChartStats(modalId, chartData, chartType);
                    return;
                }
                chartManager.createPieChart(canvasId, chartData, options);
                break;
            case 'dualBar':
                // 处理双柱状图数据 - 修复版本
                if (!data.labels || !data.datasets) {
                    console.error('双柱状图数据格式不正确:', data);
                    this.updateChartStats(modalId, data, chartType);
                    return;
                }
                
                // 确保数据集中有两个数据集
                if (data.datasets.length >= 2) {
                    // 修复：创建正确的数据集格式
                    const dualBarData = {
                        labels: data.labels,
                        datasets: [
                            {
                                label: data.datasets[0].label || '数据集1',
                                data: data.datasets[0].data || [],
                                backgroundColor: 'rgba(255, 159, 64, 0.7)' // 浅橙色
                            },
                            {
                                label: data.datasets[1].label || '数据集2',
                                data: data.datasets[1].data || [],
                                backgroundColor: 'rgba(54, 162, 235, 0.7)' // 浅蓝色
                            }
                        ]
                    };
                    
                    // 添加执行率数据到选项
                    const chartOptions = {
                        ...options,
                        executionRates: data.executionRates || []
                    };
                    
                    chartManager.createDualBarChart(canvasId, dualBarData, chartOptions);
                } else {
                    console.error('双柱状图需要至少两个数据集');
                }
                break;
            default:
                console.error('未知的图表类型:', chartType);
                return;
        }

        // 显示统计数据 - 修复版本
        this.updateChartStats(modalId, chartData, chartType);
    }

    // 更新图表统计数据 - 修复版本
    updateChartStats(modalId, data, chartType = 'bar') {
        const statsElement = document.getElementById(`${modalId}-stats`);
        if (!statsElement) return;

        let statsHtml = '';
        
        // 修复：处理不同的图表数据类型
        if (data && data.datasets && Array.isArray(data.datasets) && data.datasets.length > 0) {
            data.datasets.forEach((dataset, index) => {
                // 修复：安全地访问dataset属性
                if (!dataset || !Array.isArray(dataset.data)) {
                    console.warn(`数据集 ${index} 格式不正确`);
                    return;
                }
                
                const values = dataset.data.filter(v => !isNaN(v) && v !== null && v !== undefined);
                if (values.length > 0) {
                    const sum = values.reduce((a, b) => a + b, 0);
                    const avg = sum / values.length;
                    const max = Math.max(...values);
                    const min = Math.min(...values);
                    
                    // 修复：安全地获取标签
                    const label = dataset.label || `数据集${index + 1}`;
                    
                    statsHtml += `
                        <div class="stat-item mb-2">
                            <strong>${label}:</strong><br>
                            <small>数量: ${values.length} | 平均: ${avg.toFixed(2)} | 最大: ${max} | 最小: ${min}</small>
                        </div>
                    `;
                }
            });
        } else if (chartType === 'pie' && data && data.labels && data.datasets && data.datasets[0] && data.datasets[0].data) {
            // 饼图特殊处理 - 修复版本
            const pieData = data.datasets[0].data;
            const labels = data.labels;
            const total = pieData.reduce((a, b) => a + b, 0);
            
            statsHtml += '<div class="stat-item mb-2">';
            statsHtml += `<strong>饼图数据分布:</strong><br>`;
            
            labels.forEach((label, index) => {
                const value = pieData[index] || 0;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : 0;
                // 修复：使用安全的标签访问
                const labelText = label || `数据${index + 1}`;
                statsHtml += `<small>${labelText}: ${value} (${percentage}%)</small><br>`;
            });
            
            statsHtml += `<small>总计: ${total}</small>`;
            statsHtml += '</div>';
        } else {
            statsHtml = '<div class="alert alert-info">暂无统计信息</div>';
        }

        statsElement.innerHTML = statsHtml;
        
        // 更新数据表格
        this.updateDataTable(modalId, data, chartType);
    }
    
    // 更新数据表格
    updateDataTable(modalId, data, chartType) {
        const tableElement = document.getElementById(`${modalId}-table`);
        if (!tableElement) return;
        
        let tableHtml = '';
        
        if (chartType === 'bar' || chartType === 'line' || chartType === 'dualBar') {
            if (data && data.labels && data.datasets) {
                tableHtml += '<thead><tr><th>项目</th>';
                data.datasets.forEach(dataset => {
                    tableHtml += `<th>${dataset.label || '数据'}</th>`;
                });
                tableHtml += '</tr></thead><tbody>';
                
                data.labels.forEach((label, index) => {
                    tableHtml += '<tr>';
                    tableHtml += `<td>${label || `项目${index + 1}`}</td>`;
                    data.datasets.forEach(dataset => {
                        const value = dataset.data && dataset.data[index] !== undefined ? dataset.data[index] : '-';
                        tableHtml += `<td>${value}</td>`;
                    });
                    tableHtml += '</tr>';
                });
                
                tableHtml += '</tbody>';
            }
        } else if (chartType === 'pie' && data && data.labels && data.datasets && data.datasets[0]) {
            tableHtml += '<thead><tr><th>类别</th><th>数值</th><th>百分比</th></tr></thead><tbody>';
            
            const pieData = data.datasets[0].data;
            const total = pieData.reduce((a, b) => a + b, 0);
            
            data.labels.forEach((label, index) => {
                const value = pieData[index] || 0;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : 0;
                tableHtml += `<tr>
                    <td>${label || `类别${index + 1}`}</td>
                    <td>${value}</td>
                    <td>${percentage}%</td>
                </tr>`;
            });
            
            tableHtml += `<tr class="table-info">
                <td><strong>总计</strong></td>
                <td><strong>${total}</strong></td>
                <td><strong>100%</strong></td>
            </tr>`;
            tableHtml += '</tbody>';
        }
        
        tableElement.innerHTML = tableHtml || '<tr><td colspan="3" class="text-center">暂无数据</td></tr>';
    }

    // 切换全屏
    toggleFullscreen(element) {
        if (!document.fullscreenElement) {
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    // 获取图表图标
    getChartIcon(chartType) {
        switch (chartType) {
            case 'bar':
                return 'fas fa-chart-bar';
            case 'line':
                return 'fas fa-chart-line';
            case 'pie':
                return 'fas fa-chart-pie';
            case 'dualBar':
                return 'fas fa-chart-bar';
            default:
                return 'fas fa-chart-bar';
        }
    }

    // 关闭当前模态窗口
    closeModal() {
        if (this.currentModal) {
            this.currentModal.instance.hide();
            this.cleanupModal(this.currentModal.id);
        }
    }

    // 清理模态窗口
    cleanupModal(modalId) {
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            modalElement.remove();
        }
        
        if (this.currentModal && this.currentModal.id === modalId) {
            this.currentModal = null;
        }
    }

    // 显示消息
    showMessage(title, message, type = 'info') {
        const iconMap = {
            'info': 'fas fa-info-circle',
            'success': 'fas fa-check-circle',
            'warning': 'fas fa-exclamation-triangle',
            'error': 'fas fa-times-circle'
        };

        const content = `
            <div class="alert alert-${type}">
                <i class="${iconMap[type]}"></i>
                ${message}
            </div>
        `;

        const modal = this.createModal({
            title: title,
            icon: iconMap[type],
            content: content,
            size: 'modal-md'
        });
        
        modal.instance.show();
        
        // 3秒后自动关闭信息窗口
        setTimeout(() => {
            this.closeModal();
        }, 3000);
    }
}

// 导出全局变量
window.ModalManager = ModalManager;