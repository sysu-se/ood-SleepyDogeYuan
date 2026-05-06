import { createSudoku, createSudokuFromJSON } from './sudoku.js';

function _buildGame(sudoku, history, pointer) {
  let _current = sudoku;
  let _history = history || [_current.clone()];
  let _pointer = pointer ?? 0;
  
  // 探索模式相关状态
  let _mode = 'normal'; // 'normal' | 'explore'
  let _explore = null;
  
  function getCurrentSudoku() {
    if (_mode === 'explore' && _explore) {
      return _explore.sudoku;
    }
    return _current;
  }

  return {
    getSudoku: () => getCurrentSudoku(),
    getGrid: () => getCurrentSudoku().getGrid(),
    getMode: () => _mode,
    
    // Hint 接口
    getCandidates(row, col) {
      return getCurrentSudoku().getCandidates(row, col);
    },
    findNextHint() {
      return getCurrentSudoku().findNextHint();
    },
    
    guess(move) {
      if (_mode === 'explore' && _explore) {
        const { row, col, value } = move;
        // 检查当前棋盘是否在已知失败路径中
        const currentSnapshot = _explore.sudoku.toString();
        if (_explore.failedPaths.has(currentSnapshot)) {
          return { success: false, reason: 'failed_path' };
        }
        // 保存探索分支历史
        _explore.history = _explore.history.slice(0, _explore.pointer + 1);
        _explore.sudoku.guess(move);
        _explore.history.push(_explore.sudoku.clone());
        _explore.pointer++;
        // 如果出现冲突，记录这个失败路径
        if (_explore.sudoku.hasConflict()) {
          _explore.failedPaths.add(_explore.sudoku.toString());
          return { success: true, hasConflict: true };
        }
        return { success: true };
      }
      // 正常模式
      _history = _history.slice(0, _pointer + 1);
      _current.guess(move);
      _history.push(_current.clone());
      _pointer++;
      return { success: true };
    },
    
    undo() {
      if (_mode === 'explore' && _explore) {
        if (_explore.pointer > 0) {
          _explore.pointer--;
          _explore.sudoku = _explore.history[_explore.pointer].clone();
        }
        return;
      }
      if (_pointer > 0) {
        _pointer--;
        _current = _history[_pointer].clone();
      }
    },
    
    redo() {
      if (_mode === 'explore' && _explore) {
        if (_explore.pointer < _explore.history.length - 1) {
          _explore.pointer++;
          _explore.sudoku = _explore.history[_explore.pointer].clone();
        }
        return;
      }
      if (_pointer < _history.length - 1) {
        _pointer++;
        _current = _history[_pointer].clone();
      }
    },
    
    canUndo() {
      if (_mode === 'explore' && _explore) {
        return _explore.pointer > 0;
      }
      return _pointer > 0;
    },
    
    canRedo() {
      if (_mode === 'explore' && _explore) {
        return _explore.pointer < _explore.history.length - 1;
      }
      return _pointer < _history.length - 1;
    },
    
    enterExplore() {
      if (_mode === 'explore') return false;
      const startSudoku = _current.clone();
      _explore = {
        startSudoku,
        sudoku: startSudoku.clone(),
        history: [startSudoku.clone()],
        pointer: 0,
        failedPaths: new Set()
      };
      _mode = 'explore';
      return true;
    },
    
    commitExplore() {
      if (_mode !== 'explore' || !_explore) return false;
      // 将探索分支的最终状态提交到主分支
      const finalSudoku = _explore.sudoku.clone();
      _history = _history.slice(0, _pointer + 1);
      _history.push(finalSudoku);
      _pointer++;
      _current = finalSudoku.clone();
      _explore = null;
      _mode = 'normal';
      return true;
    },
    
    abandonExplore() {
      if (_mode !== 'explore' || !_explore) return false;
      // 恢复到进入探索前的状态
      _current = _explore.startSudoku.clone();
      _explore = null;
      _mode = 'normal';
      return true;
    },
    
    isInFailedPath() {
      if (_mode === 'explore' && _explore) {
        return _explore.failedPaths.has(_explore.sudoku.toString());
      }
      return false;
    },
    
    toJSON() {
      return {
        history: _history.map(s => s.toJSON()),
        pointer: _pointer
      };
    }
  };
}

export const createGame = ({ sudoku }) => _buildGame(sudoku.clone());

export const createGameFromJSON = (json) => {
  const history = json.history.map(h => createSudokuFromJSON(h));
  const pointer = json.pointer;
  return _buildGame(history[pointer].clone(), history, pointer);
};