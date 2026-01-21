// Excel数据处理类
class ExcelProcessor {
    constructor() {
        this.workbook = null;
        this.sheets = [];
        this.currentSheet = null;
        this.sheetData = {};
        this.projectNames = []; // 存储每个sheet的B2内容
    }

    // 加载Excel文件
    async loadExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    this.workbook = XLSX.read(data, { type: 'array' });
                    this.processWorkbook();
                    resolve({
                        success: true,
                        filename: file.name,
                        sheets: this.sheets,
                        projectNames: this.projectNames
                    });
                } catch (error) {
                    console.error('Excel解析错误:', error);
                    reject(new Error('Excel文件解析失败: ' + error.message));
                }
            };
            
            reader.onerror = (error) => {
                console.error('文件读取错误:', error);
                reject(new Error('文件读取失败'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    // 处理工作簿
    processWorkbook() {
        this.sheets = [];
        this.sheetData = {};
        this.projectNames = [];
        
        this.workbook.SheetNames.forEach((sheetName, index) => {
            const worksheet = this.workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
            
            // 存储sheet数据
            this.sheetData[sheetName] = jsonData;
            
            // 获取B2内容（负责人）作为项目名称
            let projectName = '';
            if (jsonData.length > 1 && jsonData[1] && jsonData[1].length > 1) {
                projectName = jsonData[1][1] || '';
            }
            
            this.projectNames.push({
                sheetName: sheetName,
                projectName: projectName || `Sheet${index + 1}`,
                b2Content: projectName // 存储B2内容
            });
            
            this.sheets.push({
                name: sheetName,
                index: index,
                projectName: projectName,
                data: jsonData
            });
        });
    }

    // 获取所有sheet的B2内容（负责人）
    getAllB2Contents() {
        return this.projectNames.map(project => ({
            sheetName: project.sheetName,
            projectName: project.projectName,
            b2Content: project.b2Content
        }));
    }

    // 根据项目名称获取sheet
    getSheetByProjectName(projectName) {
        const project = this.projectNames.find(p => p.projectName === projectName);
        if (project) {
            return this.sheetData[project.sheetName];
        }
        return null;
    }

    // 获取指定sheet的数据
    getSheetData(sheetName) {
        return this.sheetData[sheetName] || [];
    }

    // 获取指定单元格的值
    getCellValue(sheetName, cellAddress) {
        const sheetData = this.getSheetData(sheetName);
        const { row, col } = this.parseCellAddress(cellAddress);
        
        if (sheetData.length > row && sheetData[row] && sheetData[row].length > col) {
            return sheetData[row][col];
        }
        return '';
    }

    // 获取所有sheet的特定单元格数据（用于总分析）
    getAllSheetCellData(cellAddress) {
        const results = [];
        
        this.sheets.forEach(sheet => {
            const value = this.getCellValue(sheet.name, cellAddress);
            results.push({
                sheetName: sheet.name,
                projectName: sheet.projectName,
                value: value
            });
        });
        
        return results;
    }

    // 获取当前sheet的指定范围数据
    getRangeData(sheetName, startCell, endCell) {
        const data = this.getSheetData(sheetName);
        const start = this.parseCellAddress(startCell);
        const end = this.parseCellAddress(endCell);
        
        const result = [];
        for (let row = start.row; row <= endRow; row++) {
            const rowData = [];
            for (let col = start.col; col <= end.col; col++) {
                if (data[row] && data[row][col] !== undefined) {
                    rowData.push(data[row][col]);
                } else {
                    rowData.push('');
                }
            }
            result.push(rowData);
        }
        
        return result;
    }

    // 获取当前sheet的列数据
    getColumnData(sheetName, columnLetter, startRow, endRow) {
        const data = this.getSheetData(sheetName);
        const colIndex = this.columnLetterToIndex(columnLetter);
        
        const result = [];
        for (let row = startRow; row <= endRow; row++) {
            if (data[row] && data[row][colIndex] !== undefined) {
                result.push(data[row][colIndex]);
            } else {
                result.push('');
            }
        }
        
        return result;
    }

    // 获取多个sheet的列数据（用于总分析）
    getMultiSheetColumnData(columnLetter, startRow, endRow, filterFunction = null) {
        const results = [];
        
        this.sheets.forEach(sheet => {
            const data = sheet.data;
            const colIndex = this.columnLetterToIndex(columnLetter);
            
            for (let row = startRow; row <= endRow; row++) {
                if (data[row] && data[row][colIndex] !== undefined && data[row][colIndex] !== '') {
                    if (!filterFunction || filterFunction(data[row][colIndex])) {
                        results.push({
                            sheetName: sheet.name,
                            projectName: sheet.projectName,
                            row: row,
                            value: data[row][colIndex],
                            fullRow: data[row]
                        });
                    }
                }
            }
        });
        
        return results;
    }

    // 统计特定值的数量
    countValues(sheetName, columnLetter, startRow, endRow, targetValue) {
        const values = this.getColumnData(sheetName, columnLetter, startRow, endRow);
        return values.filter(value => {
            if (typeof value === 'string') {
                return value.trim().toLowerCase().includes(targetValue.toLowerCase());
            }
            return value === targetValue;
        }).length;
    }

    // 对特定列求和
    sumColumn(sheetName, columnLetter, startRow, endRow) {
        const values = this.getColumnData(sheetName, columnLetter, startRow, endRow);
        return values.reduce((sum, value) => {
            const num = parseFloat(value);
            return sum + (isNaN(num) ? 0 : num);
        }, 0);
    }

    // 解析执行率（处理公式或数值） - 修改版：确保返回百分比数值
    parseExecutionRate(value) {
        if (!value && value !== 0) return 0;
        
        let numValue;
        
        // 如果是字符串
        if (typeof value === 'string') {
            // 如果是公式如 =E2/D2，提取数字计算
            if (value.startsWith('=')) {
                // 简单公式解析
                const match = value.match(/=([A-Z]+)(\d+)\/([A-Z]+)(\d+)/);
                if (match) {
                    const numCol = this.columnLetterToIndex(match[1]);
                    const numRow = parseInt(match[2]) - 1;
                    const denCol = this.columnLetterToIndex(match[3]);
                    const denRow = parseInt(match[4]) - 1;
                    
                    // 在实际应用中，需要从数据中获取分子分母的值
                    // 这里简化处理，直接返回0
                    return 0;
                }
            }
            
            // 如果是百分比字符串，去掉百分号并转换为数字
            if (value.includes('%')) {
                numValue = parseFloat(value.replace('%', ''));
                return isNaN(numValue) ? 0 : numValue;
            }
            
            // 如果是普通数字字符串
            numValue = parseFloat(value);
        } else {
            // 如果是数字类型
            numValue = value;
        }
        
        // 检查是否为有效数字
        if (isNaN(numValue)) return 0;
        
        // 如果数字小于1（假设是小数形式），乘以100转换为百分比
        // 例如：0.5 -> 50, 0.05 -> 5
        if (Math.abs(numValue) < 1) {
            return numValue * 100;
        }
        
        // 如果数字在1到100之间，假设已经是百分比形式但可能没有乘100
        // 例如：50 -> 50 (已经是百分比)
        if (numValue >= 1 && numValue <= 100) {
            return numValue;
        }
        
        // 如果数字大于100，可能是错误的输入，返回原值但记录警告
        if (numValue > 100) {
            console.warn('执行率值大于100%:', numValue);
            return numValue;
        }
        
        // 默认返回原值
        return numValue;
    }

    // 获取预警信息
    getWarningInfo(sheetName) {
        // K2是预警信息（索引10）
        const warningValue = this.getCellValue(sheetName, 'K2');
        const projectName = this.getCellValue(sheetName, 'B2');
        
        return {
            projectName: projectName,
            warningInfo: warningValue
        };
    }

    // 获取完整表格数据（包括表头）
    getFullTable(sheetName) {
        const data = this.getSheetData(sheetName);
        if (data.length === 0) return { headers: [], rows: [] };
        
        // 第一行是表头
        const headers = data[0] || [];
        const rows = [];
        
        // 从第二行开始是数据
        for (let i = 1; i < data.length; i++) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = data[i][index] || '';
            });
            rows.push(row);
        }
        
        return {
            headers: headers,
            rows: rows
        };
    }

    // 获取格式化表格数据（用于显示）
    getFormattedTable(sheetName) {
        const data = this.getSheetData(sheetName);
        if (data.length === 0) return [];
        
        // 跳过第一行（可能是空的）
        let startRow = 0;
        if (data[0].every(cell => cell === '')) {
            startRow = 1;
        }
        
        return data.slice(startRow);
    }

    // 获取匹配资金数据（F列和G列）
    getMatchingFundsData(sheetName, startRow = 2, endRow = 9) {
        const data = this.getSheetData(sheetName);
        const result = [];
        
        // F列索引5，G列索引6
        for (let row = startRow; row <= endRow; row++) {
            if (data[row]) {
                const fValue = parseFloat(data[row][5]) || 0;
                const gValue = parseFloat(data[row][6]) || 0;
                
                // 只有当F列有数据且不为0时，才包括
                if (fValue > 0) {
                    result.push({
                        row: row,
                        bValue: data[row][1] || `课题${row-1}`, // B列
                        fValue: fValue,
                        gValue: gValue,
                        iValue: this.parseExecutionRate(data[row][8]) // I列执行率，返回百分比数值
                    });
                }
            }
        }
        
        return result;
    }

    // 统计院内外课题数量
    countInstituteProjects(sheetName = null) {
        let totalCount = 0;
        let instituteCount = 0;
        
        if (sheetName) {
            // 单个sheet统计
            const data = this.getSheetData(sheetName);
            for (let row = 2; row <= 9; row++) {
                if (data[row] && data[row][2] !== undefined && data[row][2] !== '') {
                    totalCount++;
                    const unit = String(data[row][2]).toLowerCase();
                    if (unit.includes('地科院')) {
                        instituteCount++;
                    }
                }
            }
        } else {
            // 所有sheet统计
            this.sheets.forEach(sheet => {
                const data = sheet.data;
                for (let row = 2; row <= 9; row++) {
                    if (data[row] && data[row][2] !== undefined && data[row][2] !== '') {
                        totalCount++;
                        const unit = String(data[row][2]).toLowerCase();
                        if (unit.includes('地科院')) {
                            instituteCount++;
                        }
                    }
                }
            });
        }
        
        return {
            total: totalCount,
            institute: instituteCount,
            other: totalCount - instituteCount
        };
    }

    // 统计院内外课题经费
    countInstituteBudget(sheetName = null) {
        let instituteBudget = 0;
        let totalBudget = 0;
        
        if (sheetName) {
            // 单个sheet统计
            const data = this.getSheetData(sheetName);
            const baseBudget = parseFloat(this.getCellValue(sheetName, 'D2')) || 0;
            totalBudget = baseBudget;
            
            for (let row = 2; row <= 9; row++) {
                if (data[row] && data[row][2] !== undefined && data[row][2] !== '') {
                    const unit = String(data[row][2]).toLowerCase();
                    if (unit.includes('地科院')) {
                        const expense = parseFloat(data[row][4]) || 0; // E列支出
                        instituteBudget += expense;
                    }
                }
            }
        } else {
            // 所有sheet统计
            this.sheets.forEach(sheet => {
                const data = sheet.data;
                const baseBudget = parseFloat(this.getCellValue(sheet.name, 'D2')) || 0;
                totalBudget += baseBudget;
                
                for (let row = 2; row <= 9; row++) {
                    if (data[row] && data[row][2] !== undefined && data[row][2] !== '') {
                        const unit = String(data[row][2]).toLowerCase();
                        if (unit.includes('地科院')) {
                            const budget = parseFloat(data[row][3]) || 0; // D列经费
                            instituteBudget += budget;
                        }
                    }
                }
            });
        }
        
        return {
            total: totalBudget,
            institute: instituteBudget,
            other: totalBudget - instituteBudget
        };
    }

    // 辅助方法：解析单元格地址
    parseCellAddress(cell) {
        // 如 "D2" -> {col: 3, row: 1} (注意：行索引从0开始)
        const match = cell.match(/^([A-Z]+)(\d+)$/);
        if (match) {
            const col = this.columnLetterToIndex(match[1]);
            const row = parseInt(match[2]) - 1; // 转换为0-based索引
            return { col, row };
        }
        return { col: 0, row: 0 };
    }

    // 辅助方法：列字母转索引
    columnLetterToIndex(letter) {
        let index = 0;
        for (let i = 0; i < letter.length; i++) {
            index = index * 26 + (letter.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
        }
        return index - 1; // 转换为0-based索引
    }

    // 辅助方法：获取Excel列字母
    indexToColumnLetter(index) {
        let letter = '';
        while (index >= 0) {
            letter = String.fromCharCode((index % 26) + 65) + letter;
            index = Math.floor(index / 26) - 1;
        }
        return letter;
    }
}

// 导出全局变量
window.ExcelProcessor = ExcelProcessor;