<script>
    export let gameStore;
    import { fade } from 'svelte/transition';
    import { SUDOKU_SIZE } from '@sudoku/constants';
    import { cursor } from '@sudoku/stores/cursor';
    
    export let value;
    export let cellX;
    export let cellY;
    export let hintNumbers = [];

    export let disabled;
    export let conflictingNumber;
    export let userNumber;
    export let selected;
    export let sameArea;
    export let sameNumber;

    const borderRight = (cellX !== SUDOKU_SIZE && cellX % 3 !== 0);
    const borderRightBold = (cellX !== SUDOKU_SIZE && cellX % 3 === 0);
    const borderBottom = (cellY !== SUDOKU_SIZE && cellY % 3 !== 0);
    const borderBottomBold = (cellY !== SUDOKU_SIZE && cellY % 3 === 0);
    $: isFixed = $gameStore?.initialGrid && $gameStore.initialGrid[cellY - 1][cellX - 1] !== 0;

    const CANDIDATE_COORDS = [
        [1,1], [2,1], [3,1],
        [1,2], [2,2], [3,2],
        [1,3], [2,3], [3,3]
    ];
</script>

<div class="cell row-start-{cellY} col-start-{cellX}"
     class:border-r={borderRight}
     class:border-r-4={borderRightBold}
     class:border-b={borderBottom}
     class:border-b-4={borderBottomBold}
     class:is-fixed={isFixed}>

    {#if !disabled}
        <div class="cell-inner"
             class:user-number={userNumber && !isFixed}
             class:selected={selected}
             class:same-area={sameArea}
             class:same-number={sameNumber}
             class:conflicting-number={conflictingNumber}>

            <button class="cell-btn"
                on:click={() => cursor.set(cellX - 1, cellY - 1)}>

                {#if value}
                    <span class="cell-text">{value}</span>
                {:else if hintNumbers.length > 0}
                    <!-- 显示候选小数字 -->
                    <div class="hint-grid">
                        {#each CANDIDATE_COORDS as [row, col], idx}
                            <div class="hint-num row-start-{row} col-start-{col}"
                                 class:invisible={!hintNumbers.includes(idx + 1)}>
                                {idx + 1}
                            </div>
                        {/each}
                    </div>
                {:else}
                    <span class="cell-text"></span>
                {/if}
            </button>
        </div>
    {/if}
</div>

<style>
    .cell {
        @apply h-full w-full row-end-auto col-end-auto;
    }
    .cell-inner {
        @apply relative h-full w-full text-gray-800;
    }
    .cell-btn {
        @apply absolute inset-0 h-full w-full;
    }
    .cell-btn:focus {
        @apply outline-none;
    }
    .cell-text {
        @apply leading-full text-base;
    }
    @media (min-width: 300px) { .cell-text { @apply text-lg; } }
    @media (min-width: 350px) { .cell-text { @apply text-xl; } }
    @media (min-width: 400px) { .cell-text { @apply text-2xl; } }
    @media (min-width: 500px) { .cell-text { @apply text-3xl; } }
    @media (min-width: 600px) { .cell-text { @apply text-4xl; } }
    .user-number { @apply text-primary; }
    .selected { @apply bg-primary text-white; }
    .same-area { @apply bg-primary-lighter; }
    .same-number { @apply bg-primary-light; }
    .conflicting-number { @apply text-red-600; }
    .is-fixed { background-color: #f3f4f6; }
    .is-fixed .cell-text { @apply font-bold text-gray-900; }
    .selected .cell-text { @apply text-white; }

    .hint-grid {
        @apply grid h-full w-full p-1;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
    }
    .hint-num {
        @apply h-full w-full flex items-center justify-center text-gray-800;
        font-size: clamp(0.35rem, 2vw, 0.65rem);
        line-height: 1;
    }
    .invisible {
        visibility: hidden;
    }
</style>