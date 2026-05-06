# Homework 2: Hint & Explore Mode

## 1. 你如何实现提示功能？

提示功能由 Sudoku 与 Game 协作完成，通过 GameStore 封装为面向 UI 的统一接口。

- **候选计算**：在 `Sudoku` 领域对象中新增 `getCandidates(row, col)` 方法，基于当前盘面排除同行、同列、同宫内已填数字，返回可选数字数组。
- **下一步唯一候选**：在 `Sudoku` 中新增 `findNextHint()` 方法，遍历盘面找到第一个空白且候选数唯一的格子，返回 `{ row, col, value }`；若无则返回 `null`。
- **提示应用**：GameStore 在 `applyHint(x, y)` 中调用上述方法。第一次点击提示按钮展示当前光标格的候选数（存于 `hintCells` 对象）；再次点击时自动填写全局第一个唯一候选。
- **UI 渲染**：Cell 组件接收 `hintNumbers` 属性，以 3×3 迷你网格渲染候选数字（可见/不可见），不再依赖全局 `candidates` store。

## 2. 你认为提示功能更属于 `Sudoku` 还是 `Game`？为什么？

**提示的核心计算逻辑（候选数求解、寻找唯一候选）属于 `Sudoku`，而提示的交互状态（“显示候选”vs“自动填写”）属于 `Game`。**

- **`Sudoku`** 是纯领域模型，拥有完整的盘面规则知识，能够回答“某个格可填哪些数字”以及“是否存在唯一候选”这样的领域问题。这些方法不涉及用户交互，可独立测试和复用。
- **`Game`** 负责会话、状态和操作历史。提示的应用（例如记录哪些格子正在显示候选、是否触发自动填写）属于 Game 的交互状态管理。
- **协作方式**：`Game.getCandidates(row,col)` 和 `Game.findNextHint()` 直接委托给当前 `Sudoku` 对象，保证了领域逻辑不泄露到 UI，同时 Game 控制何时调用及如何展示。

## 3. 你如何实现探索模式？

探索模式实现为 `Game` 的一种**状态切换**（`_mode: 'normal' | 'explore'`），创建一个临时的、可丢弃的探索子会话。

- **进入探索**：调用 `enterExplore()`，保存当前盘面的快照 `startSudoku`，创建一个探索用的 `Sudoku` 副本、独立的 `history` 和 `pointer`，以及一个 `failedPaths` 集合。
- **探索过程中的操作**：`guess`、`undo`、`redo` 在探索模式下操作探索分支的 `sudoku` 和 `history`，不影响主分支。
- **冲突检测**：每次 `guess` 后调用 `sudoku.hasConflict()`，若冲突则将当前棋盘状态字符串加入 `failedPaths`，并在 UI 提示冲突。
- **失败记忆**：在 `guess` 前检查当前棋盘是否已在 `failedPaths` 中，若是则拒绝操作并通知 UI。
- **提交**：调用 `commitExplore()`，将探索分支的最终盘面 snapshoted 后推入主分支的 `history`，合并后丢弃探索子会话，回到正常模式。
- **放弃**：调用 `abandonExplore()`，恢复 `_current` 为进入探索前的 `startSudoku`，丢弃探索分支。

## 4. 主局面与探索局面的关系是什么？

- **复制对象**：探索开始时对当前 `_current` 做了**深拷贝**（通过 `clone()`），因此探索分支与主局面在内存上完全独立，互不影响。
- **无深拷贝问题**：`Sudoku.clone()` 使用 `grid.map(row => [...row])` 和 `initialGrid` 的深拷贝，且不共享任何可变引用。
- **提交合并**：将探索分支的最终盘面再次克隆一份推入主 history，主 `_pointer` 递增，主 `_current` 指向新 snapshot。主分支以线性方式增长，探索分支的中间步骤不暴露。
- **放弃回滚**：直接恢复 `_current = _explore.startSudoku.clone()`，主分支的 history 栈完全不受影响，确保放弃后 Undo/Redo 行为与进入探索前一致。

## 5. 你的 history 结构在本次作业中是否发生了变化？

**主 history 结构保持线性栈，探索过程拥有独立的线性 history 以供内部 Undo/Redo。**

- 主分支：仍然是 `_history` 数组 + `_pointer`，顺序记录所有已提交的盘面（包括正常操作和探索提交后的最终状态）。
- 探索分支：独立维护 `_explore.history` 和 `_explore.pointer`，仅在探索模式下活跃。支持探索过程中的 Undo/Redo，但与主栈隔离。
- 提交时：探索分支的最终 snapshot 作为新记录追加到主 `_history` 末尾，主 `_pointer` 后移。探索分支的中间步骤被丢弃，保持主栈线性。
- 放弃时：探索分支的 history 直接弃用，主栈不变。

本次未引入树状分支或 DAG，依然为线性栈 + 临时子会话的简单设计。

## 6. Homework 1 中的哪些设计，在 Homework 2 中暴露出了局限？

- **`Game` 对象缺少显式的状态概念**：原有设计中 Game 仅管理一个 `_current` 和线性 history，无“模式”或“子会话”概念。添加探索模式时必须硬性扩展 `_mode` 和 `_explore` 上下文，如果设计一开始就采用“状态模式”或“会话抽象”，扩展会更自然。
- **`Sudoku` 缺乏规则查询接口**：H1 中 Sudoku 只有 `guess` 和 `getGrid`，无 `getCandidates`、`hasConflict` 等方法。H2 需要在 Sudoku 内部实现求解相关的纯函数，这提醒我们领域对象应提前暴露更多查询能力。
- **`guess` 接口返回值单一**：H1 中 `guess` 返回简单的布尔值或 `void`；H2 需要知道操作结果（是否冲突、是否已探索失败），不得不修改 `guess` 返回值为对象。未来若支持更复杂的交互（如自动分支选择），需要一个更完善的操作结果描述。
- **history 缺乏分支概念**：即使不要求树状分支，探索模式的临时 Undo/Redo 也需要独立的 history。原设计中 history 和 game 的耦合较紧（均在 `_buildGame` 闭包内），导致新增分支时需要手动管理额外状态。

## 7. 如果重做一次 Homework 1，你会如何修改原设计？

- **明确 `Sudoku` 的领域角色**：除基本操作外，直接提供 `getCandidates(row,col)`、`hasConflict()`、`isComplete()` 等查询方法，使其成为自足的领域服务。
- **引入 `Game` 的状态枚举**：从一开始就定义 `GameMode = 'normal' | 'explore'`（或更通用的 `'playing' | 'exploring'`），预留扩展点。
- **分离 history 管理**：将 history 操作抽象为独立的 `HistoryManager`，支持多个实例（主历史、探索历史），减少 Game 对象内的状态膨胀。
- **统一操作返回协议**：定义类似 `OperationResult { success: boolean, conflict: boolean, ... }` 的结构，避免方法返回类型随意变更。
- **保留克隆（clone）与序列化（toJSON）**：H1 已做深拷贝，这是正确的，可继续保持。

通过这些调整，Homework 2 的提示和探索模式将更易于实现，且对象模型更健壮。