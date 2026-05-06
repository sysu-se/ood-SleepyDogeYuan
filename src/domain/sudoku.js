export function createSudoku(grid, initialGrid = null) {
    // 深度克隆原始数据，防止引用污染
    const _grid = grid.map(row => [...row]);
    // 如果没有传入初始盘面，就把当前的 grid 当作初始盘面（题目）
    const _initialGrid = initialGrid 
        ? initialGrid.map(row => [...row]) 
        : grid.map(row => [...row]);

    // 辅助函数：获取某个格子的候选数
    function getCandidates(row, col) {
        // 题目数字或已填数字没有候选
        if (_initialGrid[row][col] !== 0 || _grid[row][col] !== 0) return [];
        const used = new Set();
        // 行
        for (let c = 0; c < 9; c++) {
            if (_grid[row][c] !== 0) used.add(_grid[row][c]);
        }
        // 列
        for (let r = 0; r < 9; r++) {
            if (_grid[r][col] !== 0) used.add(_grid[r][col]);
        }
        // 宫
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (_grid[r][c] !== 0) used.add(_grid[r][c]);
            }
        }
        const candidates = [];
        for (let num = 1; num <= 9; num++) {
            if (!used.has(num)) candidates.push(num);
        }
        return candidates;
    }

    // 下一步提示：寻找第一个只有一个候选数的格子
    function findNextHint() {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (_grid[r][c] === 0 && _initialGrid[r][c] === 0) {
                    const cands = getCandidates(r, c);
                    if (cands.length === 1) {
                        return { row: r, col: c, value: cands[0] };
                    }
                }
            }
        }
        return null; // 没有唯一候选
    }

    // 检查整个盘面是否有冲突
    function hasConflict() {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const value = _grid[r][c];
                if (value === 0) continue;
                // 行
                for (let cc = 0; cc < 9; cc++) {
                    if (cc !== c && _grid[r][cc] === value) return true;
                }
                // 列
                for (let rr = 0; rr < 9; rr++) {
                    if (rr !== r && _grid[rr][c] === value) return true;
                }
                // 宫
                const boxRow = Math.floor(r / 3) * 3;
                const boxCol = Math.floor(c / 3) * 3;
                for (let rr = boxRow; rr < boxRow + 3; rr++) {
                    for (let cc = boxCol; cc < boxCol + 3; cc++) {
                        if ((rr !== r || cc !== c) && _grid[rr][cc] === value) return true;
                    }
                }
            }
        }
        return false;
    }

    return {
        getGrid: () => _grid.map(row => [...row]),
        getInitialGrid: () => _initialGrid.map(row => [...row]),
        
        // 核心领域逻辑：如果是初始题目数字，不允许修改
        guess: ({ row, col, value }) => {
            if (_initialGrid[row][col] !== 0) return false; 
            _grid[row][col] = value ?? 0;
            return true;
        },

        // 辅助方法：判断某格是否是题目自带的
        isInitial: (row, col) => _initialGrid[row][col] !== 0,

        // 新增方法
        getCandidates,
        findNextHint,
        hasConflict,

        clone: () => createSudoku(
            _grid.map(row => [...row]), 
            _initialGrid.map(row => [...row])
        ),
        toString: () => {
            // 将二维数组拍平并转成字符串，用于快速比较盘面
            return _grid.map(row => row.join('')).join('\n');
        },
        toJSON: () => ({ 
            grid: _grid.map(row => [...row]),
            initialGrid: _initialGrid.map(row => [...row])
        })
    };
}

export const createSudokuFromJSON = (json) => createSudoku(json.grid, json.initialGrid);