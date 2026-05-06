<script>
    import Timer from './Timer.svelte';
    import Actions from './Actions.svelte';
    export let gameStore;
</script>

<div class="action-bar space-y-3 xs:space-y-0">
    <Timer />

    <Actions {gameStore} />
</div>

{#if $gameStore?.statusMessage}
    <div class="status-message">
        {$gameStore.statusMessage}
    </div>
{/if}

<style>
    .action-bar {
        @apply flex flex-col flex-wrap justify-between pb-5;
    }

    @screen xs {
        .action-bar {
            @apply flex-row;
        }
    }

    .status-message {
        @apply text-center text-sm text-primary font-medium py-2;
    }
</style>