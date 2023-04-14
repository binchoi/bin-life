<script>
  import {appMode, timeSpans, showSettings, editIdx} from './stores';
  import AgeCalculator from './AgeCalculator.svelte';
  import DobPicker from './DobPicker.svelte';
  import CurrentWeekDetails from './CurrentWeekDetails.svelte';
  import CreateTimeSpan from './CreateTimeSpan.svelte';
  import Calendar from './Calendar.svelte';
  import Settings from './Settings.svelte';
  import EditTimeSpans from './EditTimeSpans.svelte';
  import EditTimeSpan from './EditTimeSpan.svelte';
  import Notices from './Notices.svelte';
</script>

<main>
  <h1 class="title" style="font-weight: 1000">BinLife</h1>

  <p class="info">
    Each circle represents a week in your life
  </p>

  <AgeCalculator/>
  <DobPicker/>

  <!-- Unused Functionality -->
  <!-- <div class="create-button-wrapper">
    <div>
      <button on:click|stopPropagation={() => $appMode = 'create-time-span'}>Create time span</button>
    </div>
    {#if $timeSpans.length}
      <div>
        <button on:click|stopPropagation={() => $appMode = 'edit-time-spans'}>Edit time spans</button>
      </div>
    {/if}
  </div> -->

  <!-- <div class="settings-button-wrapper">
    <button on:click|stopPropagation={() => $showSettings = true}>Settings</button>
  </div> -->

  <Calendar/>
</main>

<CurrentWeekDetails/>

{#if $showSettings}
  <Settings/>
{/if}

{#if $appMode === 'create-time-span'}
  <CreateTimeSpan/>
{/if}

{#if $appMode === 'edit-time-spans'}
  <EditTimeSpans/>
{/if}

{#if $editIdx !== null}
  <EditTimeSpan/>
{/if}

<Notices/>

<style>
  main {
    text-align: center;
    padding: 1em;
    margin: 0 auto;
    font-size: 1rem;
  }

  .title {
    font-size: 4em;
    font-weight: 100;
    margin-bottom: 0;
    color: var(--my-blue);
  }

  .info {
    max-width: 20rem;
    margin: 1rem auto 1.5rem;
    line-height: 1.5;
  }
</style>
