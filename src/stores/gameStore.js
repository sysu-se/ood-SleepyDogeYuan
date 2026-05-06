import { writable } from 'svelte/store';
import { createGame } from '../domain/game';
import { createSudoku } from '../domain/sudoku';

export function createGameStore() {
    const { subscribe, set } = writable(null);
    let game = null;
    let _statusMessage = '';

    // 提示状态：存储每个格子的候选数数组，key 为 'x,y'
    let _hintCells = {};

    function refresh() {
        if (!game) return;
        const sudoku = game.getSudoku();
        set({
            grid: sudoku.getGrid(),
            initialGrid: sudoku.getInitialGrid(),
            canUndo: game.canUndo(),
            canRedo: game.canRedo(),
            isExploring: game.getMode() === 'explore',
            statusMessage: _statusMessage,
            hintCells: { ..._hintCells },
        });
    }

    return {
        subscribe,

        start() {
            const library = [
                [[0,0,0,2,6,0,7,0,1],[6,8,0,0,7,0,0,9,0],[1,9,0,0,0,4,5,0,0],[8,2,0,1,0,0,0,4,0],[0,0,4,6,0,2,9,0,0],[0,5,0,0,0,3,0,2,8],[0,0,9,3,0,0,0,7,4],[0,4,0,0,5,0,0,3,6],[7,0,3,0,1,8,0,0,0]],
                [[5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],[8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],[0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]],
                [[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,3,0,8,5],[0,0,1,0,2,0,0,0,0],[0,0,0,5,0,7,0,0,0],[0,0,4,0,0,0,1,0,0],[0,9,0,0,0,0,0,0,0],[5,0,0,0,0,0,0,7,3],[0,0,2,0,1,0,0,0,0],[0,0,0,0,4,0,0,0,9]],
                [[8,0,0,0,0,0,0,0,0],[0,0,3,6,0,0,0,0,0],[0,7,0,0,9,0,2,0,0],[0,5,0,0,0,7,0,0,0],[0,0,0,0,4,5,7,0,0],[0,0,0,1,0,0,0,3,0],[0,0,1,0,0,0,0,6,8],[0,0,8,5,0,0,0,1,0],[0,9,0,0,0,0,4,0,0]],
                [[0,0,0,6,0,2,0,0,0],[4,0,0,0,5,0,0,0,1],[0,8,5,0,1,0,6,2,0],[0,3,8,2,0,6,7,1,0],[0,0,0,0,0,0,0,0,0],[0,1,9,4,0,7,3,5,0],[0,2,6,0,4,0,5,3,0],[9,0,0,0,2,0,0,0,7],[0,0,0,8,0,9,0,0,0]]
            ];
            const randomIndex = Math.floor(Math.random() * library.length);
            const puzzle = library[randomIndex];
            
            const sudoku = createSudoku(puzzle);
            game = createGame({ sudoku });
            _statusMessage = '';
            _hintCells = {};
            refresh();
        },

        guess(x, y, value) {
            if (!game) return;
            const result = game.guess({ row: y, col: x, value });
            if (result && result.reason === 'failed_path') {
                _statusMessage = 'This path has already been explored and failed.';
            } else if (result && result.hasConflict) {
                _statusMessage = 'Conflict detected. This explore path has failed.';
            } else {
                _statusMessage = '';
            }
            refresh();
        },

        undo() {
            if (!game) return;
            game.undo();
            _statusMessage = '';
            refresh();
        },

        redo() {
            if (!game) return;
            game.redo();
            _statusMessage = '';
            refresh();
        },

        // 应用提示，返回结果字符串
        applyHint(x, y) {
            if (!game) return 'no_game';
            const key = `${x},${y}`;
            // 如果该格已有提示，尝试自动填写唯一候选
            if (_hintCells[key]) {
                const hint = game.findNextHint();	// 返回 { row, col, value }
                if (hint && hint.value) {
                    // 清除被填入格的提示
                    delete _hintCells[`${hint.col},${hint.row}`];
                    game.guess({ row: hint.row, col: hint.col, value: hint.value });
                    _statusMessage = `Auto-filled (${hint.value}) at R${hint.row+1}C${hint.col+1}`;
                    refresh();
                    return 'auto_filled';
                } else {
                    _statusMessage = 'No unique candidate available yet.';
                    refresh();
                    return 'no_unique';
                }
            }

            // 没有提示 → 获取候选数
            const cands = game.getCandidates(y, x);
            if (!cands || cands.length === 0) {
                _statusMessage = 'No candidates for this cell (already fixed or filled).';
                refresh();
                return 'no_candidates';
            }

            _hintCells[key] = cands;
            _statusMessage = `Candidates: ${cands.join(', ')}`;
            refresh();
            return 'candidates_shown';
        },

        // 清除某个格子的提示（当用户输入数字后自动清除）
        clearHintAt(x, y) {
            const key = `${x},${y}`;
            if (_hintCells[key]) {
                delete _hintCells[key];
                refresh();
            }
        },

        // 探索模式
        enterExplore() {
            if (!game) return;
            const entered = game.enterExplore();
            if (entered) {
                _statusMessage = 'Explore mode: try moves. Commit or Abandon.';
                refresh();
            }
        },

        commitExplore() {
            if (!game) return;
            const committed = game.commitExplore();
            if (committed) {
                _statusMessage = 'Explore changes accepted.';
                refresh();
            }
        },

        abandonExplore() {
            if (!game) return;
            const abandoned = game.abandonExplore();
            if (abandoned) {
                _statusMessage = 'Explore changes discarded.';
                refresh();
            }
        }
    };
}