// 主应用类
class ProjectSystemApp {
    constructor() {
        this.excelProcessor = new ExcelProcessor();
        this.chartManager = new ChartManager();
        this.modalManager = new ModalManager();
        this.currentProject = null;

        this.init();
    }

    // 初始化应用
    init() {
        console.log('项目管理系统初始化...');

        // 绑定事件
        this.bindEvents();

        // 初始化时间显示
        this.updateTime();
        setInterval(() => this.updateTime(), 60000);

        // 更新状态
        this.updateStatus('系统已就绪，请加载Excel文件');
    }

    // 绑定事件
    bindEvents() {
        // 加载Excel文件按钮
        document.getElementById('pushButton_1').addEventListener('click', () => {
            document.getElementById('excelFileInput').click();
        });

        // Excel文件选择
        document.getElementById('excelFileInput').addEventListener('change', (e) => {
            this.handleExcelFileUpload(e.target.files[0]);
        });

        // PDF文件选择
        document.getElementById('pdfFileInput').addEventListener('change', (e) => {
            this.handlePDFFileUpload(e.target.files[0]);
        });

        // 总分析按钮
        document.getElementById('pushButton_2').addEventListener('click', () => {
            this.showTotalBudgetAnalysis();
        });

        document.getElementById('pushButton_3').addEventListener('click', () => {
            this.showTotalExecutionRateAnalysis();
        });

        document.getElementById('pushButton_4').addEventListener('click', () => {
            this.showMatchingFundsAnalysis();
        });

        document.getElementById('pushButton_5').addEventListener('click', () => {
            this.showInstituteRatioAnalysis();
        });

        document.getElementById('pushButton_6').addEventListener('click', () => {
            this.showInstituteBudgetRatioAnalysis();
        });

        document.getElementById('pushButton_7').addEventListener('click', () => {
            this.showWarningInfo();
        });

        document.getElementById('pushButton_8').addEventListener('click', () => {
            document.getElementById('pdfFileInput').click();
        });

        // 项目分析按钮
        document.getElementById('pushButton_9').addEventListener('click', () => {
            this.showProjectOverview();
        });

        document.getElementById('pushButton_10').addEventListener('click', () => {
            this.showProjectExecutionRate();
        });

        document.getElementById('pushButton_11').addEventListener('click', () => {
            this.showProjectMatchingFunds();
        });

        document.getElementById('pushButton_12').addEventListener('click', () => {
            this.showProjectInstituteRatio();
        });

        document.getElementById('pushButton_13').addEventListener('click', () => {
            this.showProjectInstituteBudgetRatio();
        });

        // 项目选择框
        document.getElementById('Combobox_gf').addEventListener('change', (e) => {
            this.onProjectSelected(e.target.value);
        });
    }

    // 根据控件信息获取正确的数据索引
    getColumnIndexBySheet(sheetData, columnName) {
        // 根据表头确定列索引
        const headers = sheetData[0] || [];
        for (let i = 0; i < headers.length; i++) {
            if (headers[i] && headers[i].includes(columnName)) {
                return i;
            }
        }
        return -1;
    }

    // 处理Excel文件上传
    async handleExcelFileUpload(file) {
        if (!file) return;

        // 验证文件类型
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];

        if (!allowedTypes.includes(file.type)) {
            this.modalManager.showMessage('错误', '请上传Excel文件 (.xlsx 或 .xls 格式)', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB限制
            this.modalManager.showMessage('错误', '文件大小不能超过10MB', 'error');
            return;
        }

        // 显示加载状态
        this.updateStatus('正在加载Excel文件...');

        try {
            const result = await this.excelProcessor.loadExcelFile(file);

            if (result.success) {
                this.updateStatus(`Excel文件加载成功: ${result.filename}`);
                this.updateProjectSelector(result.projectNames);
                this.updateDataPreview();

                this.modalManager.showMessage('成功',
                    `Excel文件加载成功！<br>共 ${result.sheets.length} 个Sheet<br>请选择项目进行分析`,
                    'success');
            }
        } catch (error) {
            console.error('Excel处理错误:', error);
            this.updateStatus('Excel文件加载失败');
            this.modalManager.showMessage('错误', error.message, 'error');
        }
    }

    // 处理PDF文件上传
    handlePDFFileUpload(file) {
        if (!file) return;

        if (!file.type.includes('pdf')) {
            this.modalManager.showMessage('错误', '请上传PDF文件', 'error');
            return;
        }

        // 创建本地URL
        const fileURL = URL.createObjectURL(file);

        // 创建PDF查看器模态窗口
        this.modalManager.createPDFModal(fileURL).instance.show();

        this.updateStatus(`PDF文件已加载: ${file.name}`);
    }

    // 更新项目选择器
    updateProjectSelector(projectNames) {
        const selector = document.getElementById('Combobox_gf');
        selector.innerHTML = '<option value="">请选择项目</option>';

        projectNames.forEach(project => {
            const option = document.createElement('option');
            option.value = project.projectName;
            option.textContent = `${project.projectName} (${project.sheetName})`;
            selector.appendChild(option);
        });

        // 如果有项目，选择第一个
        if (projectNames.length > 0) {
            selector.value = projectNames[0].projectName;
            this.onProjectSelected(projectNames[0].projectName);
        }
    }

    // 项目选择变化
    onProjectSelected(projectName) {
        this.currentProject = projectName;

        if (projectName) {
            this.updateStatus(`当前选择项目: ${projectName}`);
            // 更新数据预览
            this.updateDataPreview();
        }
    }

    // 更新数据预览 - 修改执行率显示为百分比，空白区域显示"-"
    updateDataPreview() {
        const tableBody = document.querySelector('#dataPreview tbody');

        if (!this.currentProject || !this.excelProcessor.sheets.length) {
            tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">请先加载Excel文件并选择项目</td>
            </tr>
        `;
            return;
        }

        // 获取当前项目的sheet数据
        const sheetData = this.excelProcessor.getSheetByProjectName(this.currentProject);
        if (!sheetData || sheetData.length < 3) {
            tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">数据格式不正确</td>
            </tr>
        `;
            return;
        }

        let html = '';

        // 显示前5行数据（从第3行开始，跳过表头和第1行汇总）
        for (let i = 2; i < Math.min(sheetData.length, 7); i++) {
            const row = sheetData[i];
            if (row && row.length >= 8) {
                // 计算执行率（H列，索引7）并以百分比形式显示
                let executionRate = '';
                if (row[7] !== undefined && row[3] !== undefined) {
                    const numerator = parseFloat(row[7]) || 0; // H列
                    const denominator = parseFloat(row[3]) || 0; // D列

                    if (denominator !== 0) {
                        // 计算百分比并格式化为两位小数
                        const rate = (numerator / denominator) * 100;
                        if (!isNaN(rate)) {
                            executionRate = rate.toFixed(2) + '%';
                        } else {
                            executionRate = '-';
                        }
                    } else {
                        executionRate = '0.00%';
                    }
                } else {
                    executionRate = '-';
                }

                // 格式化数字，添加千分位分隔符，空白显示"-"
                const formatNumber = (num) => {
                    if (num === undefined || num === null || num === '') return '-';
                    const number = parseFloat(num);
                    return isNaN(number) ? num : number.toLocaleString('zh-CN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                };

                // 格式化文本，空白显示"-"
                const formatText = (text) => {
                    if (text === undefined || text === null || text === '') return '-';
                    return text;
                };

                html += `
                <tr>
                    <td>${i - 1}</td>
                    <td>${formatText(row[0])}</td>
                    <td>${formatText(row[1])}</td>
                    <td>${formatText(row[2])}</td>
                    <td>${formatNumber(row[3])}</td>
                    <td>${formatNumber(row[4])}</td>
                    <td class="execution-rate-cell">${executionRate}</td>
                </tr>
            `;
            }
        }

        tableBody.innerHTML = html || `
        <tr>
            <td colspan="7" class="text-center">暂无数据</td>
        </tr>
    `;
    }

    // 1. 总经费分析（pushButton_2）
    showTotalBudgetAnalysis() {
        if (!this.excelProcessor.sheets.length) {
            this.modalManager.showMessage('提示', '请先加载Excel文件', 'info');
            return;
        }

        const labels = [];
        const data = [];

        this.excelProcessor.sheets.forEach(sheet => {
            const sheetData = sheet.data;

            // 获取B2（负责人）作为标签
            const b2Value = this.excelProcessor.getCellValue(sheet.name, 'B2');
            labels.push(b2Value || sheet.name);

            // 获取D2数据（总中央经费）
            const d2Value = this.excelProcessor.getCellValue(sheet.name, 'D2');
            data.push(parseFloat(d2Value) || 0);
        });

        const chartData = {
            labels: labels,
            datasets: [{
                label: '中央经费（万元）',
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        };

        const modal = this.modalManager.createChartModal(
            '总经费分析 - 中央经费分布',
            'bar',
            chartData,
            {
                xTitle: '项目',
                yTitle: '中央经费（万元）',
                title: '各项目中央经费对比'
            }
        );

        modal.instance.show();
    }


    // 2. 总执行率分析（pushButton_3）
    showTotalExecutionRateAnalysis() {
        if (!this.excelProcessor.sheets.length) {
            this.modalManager.showMessage('提示', '请先加载Excel文件', 'info');
            return;
        }

        // 获取所有sheet的I2数据（执行率）
        const executionData = this.excelProcessor.getAllSheetCellData('I2');

        const labels = executionData.map(item => item.projectName || item.sheetName);
        const data = executionData.map(item => {
            const value = this.excelProcessor.parseExecutionRate(item.value);
            // 确保执行率是百分比数值
            return value;
        });

        const chartData = {
            labels: labels,
            datasets: [{
                label: '总执行率%',
                data: data,
                borderColor: 'rgb(54, 162, 235)', // 蓝色线条
                backgroundColor: 'transparent', // 透明背景，不填充
                borderWidth: 3, // 线条宽度
                pointBackgroundColor: 'rgb(54, 162, 235)', // 数据点颜色
                pointBorderColor: '#fff', // 数据点边框颜色
                pointBorderWidth: 2, // 数据点边框宽度
            }]
        };

        // 创建数据表格（保留两位小数）
        const tableData = labels.map((label, index) => [
            label,
            data[index].toFixed(2) + '%'
        ]);

        // 创建模态窗口
        const modalId = 'totalExecutionRateModal';
        const canvasId = modalId + '_canvas';
        
        const content = `
            <div class="chart-container-large">
                <canvas id="${canvasId}"></canvas>
            </div>
            <div class="mt-3">
                <h6>执行率数据表（单位：%）</h6>
                <div class="table-responsive">
                    <table class="table table-striped execution-rate-table">
                        <thead>
                            <tr>
                                <th>项目名称</th>
                                <th>总执行率</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableData.map(row => `
                                <tr>
                                    <td>${row[0]}</td>
                                    <td>${row[1]}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        const modal = this.modalManager.createModal({
            title: '总执行率分析',
            icon: 'fas fa-chart-line',
            content: content,
            showFullscreen: true,
            size: 'modal-xl'
        });

        modal.instance.show();

        // 延迟渲染图表
        setTimeout(() => {
            this.chartManager.createLineChart(canvasId, chartData, {
                xTitle: '项目',
                yTitle: '总执行率%',
                title: '各项目执行率趋势',
                yAxisConfig: {
                    ticks: {
                        callback: function (value) {
                            return value.toFixed(2) + '%';
                        }
                    }
                }
            });
        }, 100);
    }

    // 3. 匹配资金到位情况（pushButton_4）
    showMatchingFundsAnalysis() {
        if (!this.excelProcessor.sheets.length) {
            this.modalManager.showMessage('提示', '请先加载Excel文件', 'info');
            return;
        }

        // 获取F2（匹配资金总额）和G2（到位匹配资金）数据
        const totalData = this.excelProcessor.getAllSheetCellData('F2');
        const receivedData = this.excelProcessor.getAllSheetCellData('G2');
        const executionData = this.excelProcessor.getAllSheetCellData('I2');

        const labels = totalData.map(item => item.projectName || item.sheetName);
        const totalAmounts = totalData.map(item => parseFloat(item.value) || 0);
        const receivedAmounts = receivedData.map(item => parseFloat(item.value) || 0);

        // 创建双柱状图数据
        const chartData = {
            labels: labels,
            datasets: [
                {
                    label: '匹配资金总额',
                    data: totalAmounts,
                    backgroundColor: 'rgba(255, 159, 64, 0.7)' // 浅橙色
                },
                {
                    label: '到位匹配资金',
                    data: receivedAmounts,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)' // 浅蓝色
                }
            ]
        };

        const modal = this.modalManager.createChartModal(
            '匹配资金到位情况',
            'dualBar',
            chartData,
            {
                xTitle: '项目',
                yTitle: '匹配资金（万元）',
                title: '匹配资金到位情况分析'
            }
        );

        modal.instance.show();
    }

    // 4. 院内外课题比例（pushButton_5）
    showInstituteRatioAnalysis() {
        if (!this.excelProcessor.sheets.length) {
            this.modalManager.showMessage('提示', '请先加载Excel文件', 'info');
            return;
        }

        let totalCount = 0;
        let instituteCount = 0;

        // 统计所有sheet中C3到C10的数据
        this.excelProcessor.sheets.forEach(sheet => {
            const sheetData = sheet.data;

            for (let row = 2; row <= 9; row++) {
                if (sheetData[row] && sheetData[row][2] !== undefined && sheetData[row][2] !== '') {
                    totalCount++;

                    const unit = String(sheetData[row][2]).toLowerCase();
                    if (unit.includes('地科院')) {
                        instituteCount++;
                    }
                }
            }
        });

        const otherCount = totalCount - instituteCount;
        const institutePercentage = totalCount > 0 ? (instituteCount / totalCount * 100) : 0;
        const otherPercentage = totalCount > 0 ? (otherCount / totalCount * 100) : 0;

        // 修复：饼图数据格式
        const chartData = {
            labels: ['地科院', '其他单位'],
            datasets: [{
                data: [instituteCount, otherCount],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)', // 浅蓝色
                    'rgba(255, 159, 64, 0.7)'   // 浅橙色
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        };

        // 创建饼图模态窗口
        const modalId = 'instituteRatioModal';
        const canvasId = modalId + '_canvas';

        const content = `
        <div class="chart-container-large">
            <canvas id="${canvasId}"></canvas>
        </div>
        <div class="mt-3">
            <div class="alert alert-info">
                <h6>统计结果：</h6>
                <p>总课题数量: ${totalCount}</p>
                <p>地科院课题数量: ${instituteCount} (${institutePercentage.toFixed(2)}%)</p>
                <p>其他单位课题数量: ${otherCount} (${otherPercentage.toFixed(2)}%)</p>
            </div>
        </div>
    `;

        const modal = this.modalManager.createModal({
            title: '院内外课题比例分析',
            icon: 'fas fa-chart-pie',
            content: content,
            showFullscreen: true,
            size: 'modal-xl'
        });

        modal.instance.show();

        // 延迟渲染图表
        setTimeout(() => {
            // 使用ChartManager直接创建图表
            const chartManager = new ChartManager();
            chartManager.createPieChart(canvasId, chartData, {
                title: '院内外课题比例',
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const percentage = context.parsed || 0;
                                return `${label}: ${value}个 (${percentage.toFixed(1)}%)`;
                            }
                        }
                    }
                }
            });
        }, 100);
    }

    // 5. 院内外课题经费比例（pushButton_6）
    showInstituteBudgetRatioAnalysis() {
        if (!this.excelProcessor.sheets.length) {
            this.modalManager.showMessage('提示', '请先加载Excel文件', 'info');
            return;
        }

        let instituteBudgetSum = 0;
        let totalBudgetSum = 0;

        // 统计所有sheet中相关数据
        this.excelProcessor.sheets.forEach(sheet => {
            const sheetData = sheet.data;

            // C列（单位）和F列（匹配资金总额）
            for (let row = 2; row <= 9; row++) {
                if (sheetData[row] && sheetData[row][2] !== undefined && sheetData[row][2] !== '') {
                    const unit = String(sheetData[row][2]);
                    const budget = parseFloat(sheetData[row][5]) || 0;

                    totalBudgetSum += budget;

                    // 检查是否包含"地科院"
                    if (unit.toLowerCase().includes('地科院')) {
                        instituteBudgetSum += budget;
                    }
                }
            }
        });

        const otherBudgetSum = totalBudgetSum - instituteBudgetSum;
        const institutePercentage = totalBudgetSum > 0 ? (instituteBudgetSum / totalBudgetSum * 100) : 0;
        const otherPercentage = totalBudgetSum > 0 ? (otherBudgetSum / totalBudgetSum * 100) : 0;

        const chartData = {
            labels: ['地科院经费', '其他单位经费'],
            datasets: [{
                data: [instituteBudgetSum, otherBudgetSum],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)', // 浅蓝色
                    'rgba(255, 159, 64, 0.7)'   // 浅橙色
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        };

        // 创建饼图模态窗口
        const modalId = 'instituteBudgetRatioModal';
        const canvasId = modalId + '_canvas';

        const content = `
            <div class="chart-container-large">
                <canvas id="${canvasId}"></canvas>
            </div>
            <div class="mt-3">
                <div class="alert alert-info">
                    <h6>统计结果：</h6>
                    <p>总匹配资金: ${totalBudgetSum.toFixed(2)} 万元</p>
                    <p>地科院匹配资金: ${instituteBudgetSum.toFixed(2)} 万元 (${institutePercentage.toFixed(2)}%)</p>
                    <p>其他单位匹配资金: ${otherBudgetSum.toFixed(2)} 万元 (${otherPercentage.toFixed(2)}%)</p>
                </div>
            </div>
        `;

        const modal = this.modalManager.createModal({
            title: '院内外课题经费比例分析',
            icon: 'fas fa-chart-pie',
            content: content,
            showFullscreen: true,
            size: 'modal-xl'
        });

        modal.instance.show();

        // 延迟渲染图表
        setTimeout(() => {
            this.chartManager.createPieChart(canvasId, chartData, {
                title: '院内外课题经费比例',
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const percentage = context.parsed;
                                return `${label}: ${value.toFixed(2)}万元 (${percentage.toFixed(1)}%)`;
                            }
                        }
                    }
                }
            });
        }, 100);
    }

    // 6. 预警信息（pushButton_7）
    showWarningInfo() {
        if (!this.excelProcessor.sheets.length) {
            this.modalManager.showMessage('提示', '请先加载Excel文件', 'info');
            return;
        }

        // 获取所有sheet的B2和K2数据
        const warningInfo = [];

        this.excelProcessor.sheets.forEach(sheet => {
            const warningData = this.excelProcessor.getWarningInfo(sheet.name);
            if (warningData && warningData.warningInfo) {
                warningInfo.push([
                    warningData.projectName || sheet.name,
                    warningData.warningInfo
                ]);
            }
        });

        if (warningInfo.length === 0) {
            this.modalManager.showMessage('提示', '未找到预警信息', 'info');
            return;
        }

        const modal = this.modalManager.createTableModal(
            '预警信息汇总',
            ['项目名称', '预警信息'],
            warningInfo
        );

        modal.instance.show();
    }

    // 7. 概况（pushButton_9）
    showProjectOverview() {
        if (!this.currentProject) {
            this.modalManager.showMessage('提示', '请先选择项目', 'info');
            return;
        }

        // 获取当前项目的完整表格数据
        const sheetName = this.excelProcessor.projectNames.find(
            p => p.projectName === this.currentProject
        )?.sheetName;

        if (!sheetName) {
            this.modalManager.showMessage('错误', '未找到对应Sheet', 'error');
            return;
        }

        // 这里 getFullTable 返回的是对象 { headers, rows }
        const tableData = this.excelProcessor.getFullTable(sheetName);

        if (tableData.rows.length === 0) {
            this.modalManager.showMessage('提示', '该Sheet没有数据', 'info');
            return;
        }

        // 提取表头 - 直接从 tableData.headers 获取
        const headers = tableData.headers;

        // 定义需要显示完整文本的列（包含这些关键词的列名）
        const textColumns = ['变更信息', '预警信息', '主要成果', '备注', '说明', '备注信息'];

        // 格式化数据，特殊处理文本列
        const formatValue = (value, header) => {
            // 如果值为空，显示"-"
            if (value === undefined || value === null || value === '' || value === ' ') {
                return '-';
            }

            // 判断是否为执行率列（包含"执行率"或"执行%"字样）
            if (header && (header.includes('执行率') || header.includes('执行%') || header.includes('执行率%'))) {
                const rate = this.excelProcessor.parseExecutionRate(value);
                return rate.toFixed(2) + '%';
            }

            // 检查是否为需要显示完整文本的列
            const isTextColumn = textColumns.some(textCol =>
                header && header.includes(textCol)
            );

            if (isTextColumn) {
                // 对于文本列，直接返回原始值（Excel中的文本）
                // 如果是数字，可能是Excel中的错误格式，尝试转换为字符串
                if (typeof value === 'number') {
                    // 检查是否是整数，如果是，可能是ID或其他编码
                    if (Number.isInteger(value) && value < 1000000) {
                        return value.toString();
                    }
                    // 否则按数字处理
                    return value.toLocaleString('zh-CN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                }
                // 如果是字符串，直接返回
                return value;
            }

            // 格式化数字列（金额、数量等）
            if (typeof value === 'number' || !isNaN(parseFloat(value))) {
                const num = parseFloat(value);
                return !isNaN(num) ? num.toLocaleString('zh-CN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }) : value;
            }

            // 其他情况返回原值
            return value;
        };

        // 提取数据行 - 从 tableData.rows 获取，并格式化
        const rows = tableData.rows.map(row => {
            return headers.map((header, index) => {
                const value = row[header] || '';
                return formatValue(value, header);
            });
        });

        const modal = this.modalManager.createTableModal(
            `${this.currentProject} - 概况`,
            headers,
            rows
        );

        modal.instance.show();
    }

    // 8. 经费执行率（pushButton_10）
    showProjectExecutionRate() {
        if (!this.currentProject) {
            this.modalManager.showMessage('提示', '请先选择项目', 'info');
            return;
        }

        const sheetName = this.excelProcessor.projectNames.find(
            p => p.projectName === this.currentProject
        )?.sheetName;

        if (!sheetName) {
            this.modalManager.showMessage('错误', '未找到对应Sheet', 'error');
            return;
        }

        // 获取B3:B10和I3:I10数据（I列是执行率）
        const bData = this.excelProcessor.getColumnData(sheetName, 'B', 2, 9); // B3:B10
        const iData = this.excelProcessor.getColumnData(sheetName, 'I', 2, 9); // I3:I10

        // 过滤有效数据
        const labels = [];
        const data = [];

        for (let i = 0; i < bData.length; i++) {
            if (bData[i] && bData[i] !== '' && iData[i] && iData[i] !== '') {
                const rate = this.excelProcessor.parseExecutionRate(iData[i]);
                if (!isNaN(rate)) {
                    labels.push(bData[i]);
                    data.push(rate);
                }
            }
        }

        if (labels.length === 0) {
            this.modalManager.showMessage('提示', '没有找到有效的执行率数据', 'info');
            return;
        }

        const chartData = {
            labels: labels,
            datasets: [{
                label: '经费执行率%',
                data: data,
                borderColor: 'rgb(75, 192, 192)', // 青色线条
                backgroundColor: 'transparent', // 透明背景，不填充
                borderWidth: 3, // 线条宽度
                pointBackgroundColor: 'rgb(75, 192, 192)', // 数据点颜色
                pointBorderColor: '#fff', // 数据点边框颜色
                pointBorderWidth: 2, // 数据点边框宽度
            }]
        };

        // 创建数据表格（保留两位小数）
        const tableData = labels.map((label, index) => [
            label,
            data[index].toFixed(2) + '%'
        ]);

        // 创建模态窗口
        const modalId = 'projectExecutionRateModal';
        const canvasId = modalId + '_canvas';
        
        const content = `
            <div class="chart-container-large">
                <canvas id="${canvasId}"></canvas>
            </div>
            <div class="mt-3">
                <h6>执行率数据表（单位：%）</h6>
                <div class="table-responsive">
                    <table class="table table-striped execution-rate-table">
                        <thead>
                            <tr>
                                <th>课题名称</th>
                                <th>执行率</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableData.map(row => `
                                <tr>
                                    <td>${row[0]}</td>
                                    <td>${row[1]}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        const modal = this.modalManager.createModal({
            title: `${this.currentProject} - 经费执行率分析`,
            icon: 'fas fa-chart-line',
            content: content,
            showFullscreen: true,
            size: 'modal-xl'
        });

        modal.instance.show();

        // 延迟渲染图表
        setTimeout(() => {
            this.chartManager.createLineChart(canvasId, chartData, {
                xTitle: '项目/课题',
                yTitle: '执行率(%)',
                title: '经费执行率趋势',
                yAxisConfig: {
                    ticks: {
                        callback: function (value) {
                            return value.toFixed(2) + '%';
                        }
                    }
                }
            });
        }, 100);
    }

    // 9. 匹配经费到位情况（pushButton_11）
    showProjectMatchingFunds() {
        if (!this.currentProject) {
            this.modalManager.showMessage('提示', '请先选择项目', 'info');
            return;
        }

        const sheetName = this.excelProcessor.projectNames.find(
            p => p.projectName === this.currentProject
        )?.sheetName;

        if (!sheetName) {
            this.modalManager.showMessage('错误', '未找到对应Sheet', 'error');
            return;
        }

        const sheetData = this.excelProcessor.getSheetData(sheetName);

        // 获取F列和G列数据（F3:F10 和 G3:G10）
        const fData = [];
        const gData = [];
        const bLabels = [];
        const iData = [];

        for (let row = 2; row <= 9; row++) { // 第3-10行
            if (sheetData[row]) {
                // B列（课题名称）
                const bValue = sheetData[row][1] || '';
                bLabels.push(bValue);

                // F列（匹配资金总额）
                const fValue = parseFloat(sheetData[row][5]) || 0;
                // G列（到位匹配资金）
                const gValue = parseFloat(sheetData[row][6]) || 0;

                // 如果F列不为0，才显示数据
                if (fValue > 0) {
                    fData.push(fValue);
                    gData.push(gValue);
                } else {
                    fData.push(null);
                    gData.push(null);
                }

                // I列（执行率）使用parseExecutionRate确保是百分比
                const iValue = this.excelProcessor.parseExecutionRate(sheetData[row][8]);
                iData.push(iValue);
            }
        }

        // 创建双柱状图
        const chartData = {
            labels: bLabels,
            datasets: [
                {
                    label: '匹配资金总额',
                    data: fData,
                    backgroundColor: 'rgba(255, 159, 64, 0.7)', // 浅橙色
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                },
                {
                    label: '到位匹配资金',
                    data: gData,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)', // 浅蓝色
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }
            ]
        };

        // 创建模态窗口并显示I列数据
        const modalId = 'projectMatchingFundsModal';
        const canvasId = modalId + '_canvas';

        let iDataHtml = '<div class="execution-rate-display mt-3">';
        iDataHtml += '<h6>对应执行率数据：</h6>';
        iData.forEach((rate, index) => {
            if (rate > 0) {
                iDataHtml += `<div>${bLabels[index]}: ${rate.toFixed(2)}%</div>`;
            }
        });
        iDataHtml += '</div>';

        const content = `
        <div class="chart-container-large">
            <canvas id="${canvasId}"></canvas>
        </div>
        ${iDataHtml}
    `;

        const modal = this.modalManager.createModal({
            title: `${this.currentProject} - 匹配经费到位情况`,
            icon: 'fas fa-chart-bar',
            content: content,
            showFullscreen: true,
            size: 'modal-xl'
        });

        modal.instance.show();

        // 延迟渲染图表
        setTimeout(() => {
            this.chartManager.createBarChart(canvasId, chartData, {
                xTitle: '项目',
                yTitle: '匹配资金（万元）',
                title: '匹配资金到位情况'
            });
        }, 100);
    }

    // 10. 项目院内外课题比例（pushButton_12）
    showProjectInstituteRatio() {
        if (!this.currentProject) {
            this.modalManager.showMessage('提示', '请先选择项目', 'info');
            return;
        }

        const sheetName = this.excelProcessor.projectNames.find(
            p => p.projectName === this.currentProject
        )?.sheetName;

        if (!sheetName) {
            this.modalManager.showMessage('错误', '未找到对应Sheet', 'error');
            return;
        }

        // 统计C3:C10中"地科院"的数量
        const cData = this.excelProcessor.getColumnData(sheetName, 'C', 2, 9);

        let totalCount = 0;
        let instituteCount = 0;

        cData.forEach(value => {
            if (value && value !== '') {
                totalCount++;
                if (String(value).toLowerCase().includes('地科院')) {
                    instituteCount++;
                }
            }
        });

        const otherCount = totalCount - instituteCount;
        const institutePercentage = totalCount > 0 ? (instituteCount / 8 * 100) : 0;
        const otherPercentage = totalCount > 0 ? (otherCount / 8 * 100) : 0;

        const chartData = {
            labels: ['地科院', '其他单位'],
            datasets: [{
                data: [instituteCount, otherCount],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)', // 浅蓝色
                    'rgba(255, 159, 64, 0.7)'   // 浅橙色
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        };

        // 创建饼图模态窗口
        const modalId = 'projectInstituteRatioModal';
        const canvasId = modalId + '_canvas';

        const content = `
            <div class="chart-container-large">
                <canvas id="${canvasId}"></canvas>
            </div>
            <div class="mt-3">
                <div class="alert alert-info">
                    <h6>统计结果：</h6>
                    <p>总课题数量: ${totalCount}</p>
                    <p>地科院课题数量: ${instituteCount} (${institutePercentage.toFixed(2)}%)</p>
                    <p>其他单位课题数量: ${otherCount} (${otherPercentage.toFixed(2)}%)</p>
                    <p>注：统计范围为C3:C10共8个数据</p>
                </div>
            </div>
        `;

        const modal = this.modalManager.createModal({
            title: `${this.currentProject} - 院内外课题比例`,
            icon: 'fas fa-chart-pie',
            content: content,
            showFullscreen: true,
            size: 'modal-xl'
        });

        modal.instance.show();

        // 延迟渲染图表
        setTimeout(() => {
            this.chartManager.createPieChart(canvasId, chartData, {
                title: '院内外课题比例',
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const percentage = context.parsed;
                                return `${label}: ${value}个 (${percentage.toFixed(1)}%)`;
                            }
                        }
                    }
                }
            });
        }, 100);
    }

    // 11. 项目院内外课题经费比例（pushButton_13）
    showProjectInstituteBudgetRatio() {
        if (!this.currentProject) {
            this.modalManager.showMessage('提示', '请先选择项目', 'info');
            return;
        }

        const sheetName = this.excelProcessor.projectNames.find(
            p => p.projectName === this.currentProject
        )?.sheetName;

        if (!sheetName) {
            this.modalManager.showMessage('错误', '未找到对应Sheet', 'error');
            return;
        }

        // 获取C列（单位）和F列（匹配资金总额）数据
        const cData = this.excelProcessor.getColumnData(sheetName, 'C', 2, 9);
        const fData = this.excelProcessor.getColumnData(sheetName, 'F', 2, 9);

        let instituteBudgetSum = 0;
        let totalBudgetSum = 0;

        for (let i = 0; i < cData.length; i++) {
            const unit = cData[i];
            const budget = parseFloat(fData[i]) || 0;

            totalBudgetSum += budget;

            if (unit && String(unit).toLowerCase().includes('地科院')) {
                instituteBudgetSum += budget;
            }
        }

        const otherBudgetSum = totalBudgetSum - instituteBudgetSum;
        const institutePercentage = totalBudgetSum > 0 ? (instituteBudgetSum / totalBudgetSum * 100) : 0;
        const otherPercentage = totalBudgetSum > 0 ? (otherBudgetSum / totalBudgetSum * 100) : 0;

        const chartData = {
            labels: ['地科院经费', '其他单位经费'],
            datasets: [{
                data: [instituteBudgetSum, otherBudgetSum],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)', // 浅蓝色
                    'rgba(255, 159, 64, 0.7)'   // 浅橙色
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        };

        // 创建饼图模态窗口
        const modalId = 'projectInstituteBudgetRatioModal';
        const canvasId = modalId + '_canvas';

        const content = `
            <div class="chart-container-large">
                <canvas id="${canvasId}"></canvas>
            </div>
            <div class="mt-3">
                <div class="alert alert-info">
                    <h6>统计结果：</h6>
                    <p>总匹配资金: ${totalBudgetSum.toFixed(2)} 万元</p>
                    <p>地科院匹配资金: ${instituteBudgetSum.toFixed(2)} 万元 (${institutePercentage.toFixed(2)}%)</p>
                    <p>其他单位匹配资金: ${otherBudgetSum.toFixed(2)} 万元 (${otherPercentage.toFixed(2)}%)</p>
                </div>
            </div>
        `;

        const modal = this.modalManager.createModal({
            title: `${this.currentProject} - 院内外课题经费比例`,
            icon: 'fas fa-chart-pie',
            content: content,
            showFullscreen: true,
            size: 'modal-xl'
        });

        modal.instance.show();

        // 延迟渲染图表
        setTimeout(() => {
            this.chartManager.createPieChart(canvasId, chartData, {
                title: '院内外课题经费比例',
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const percentage = context.parsed;
                                return `${label}: ${value.toFixed(2)}万元 (${percentage.toFixed(1)}%)`;
                            }
                        }
                    }
                }
            });
        }, 100);
    }

    // 更新状态
    updateStatus(message) {
        const statusElement = document.getElementById('statusMessage');
        if (statusElement) {
            statusElement.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
        }
    }

    // 更新时间显示
    updateTime() {
        const now = new Date();
        const timeStr = now.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'short'
        }) + ' ' + now.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            timeElement.textContent = timeStr;
        }
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    window.projectSystem = new ProjectSystemApp();
});
