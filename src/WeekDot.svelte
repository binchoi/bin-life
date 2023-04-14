<script>
  import {appMode, currentWeek, settings, clickedWeek, timeSpans, newTimeSpan} from './stores';
  import {isMarked, isDisabled, assembleStylesMap, makeStyleString} from './utils';
  import {today} from './dateUtils';

  export let week;
  let classNames;
  let style = '';

  $: {
    const classMap = {
      'is-past': $settings.showPast && week.endDate <= today,
      'is-now': $settings.blinkNow && week.startDate <= today && week.endDate >= today,
      'is-hovered': $currentWeek && week.startDate <= $currentWeek.endDate && week.endDate >= $currentWeek.startDate,
      'is-disabled': isDisabled($appMode, $newTimeSpan, week),
    };

    let classCollection = ['week-wrapper'];

    for(let className in classMap) {
      if(classMap[className]) {
        classCollection.push(className);
      }
    }

    for(let timeSpan of week.matchedTimeSpans) {
      classCollection.push(timeSpan.id);
    }

    classNames = classCollection.join(' ');
  }

  $: {
    $timeSpans; // To trigger updates in edit mode
    style = makeStyleString(assembleStylesMap(week));
  }

  $: {
    if(isMarked($appMode, $newTimeSpan, $currentWeek, week)) {
      style = makeStyleString(assembleStylesMap(week, $newTimeSpan.style));
    } else {
      style = makeStyleString(assembleStylesMap(week));
    }
  }
</script>

<div class={classNames}
     on:mouseenter={() => $currentWeek = week} on:mouseleave={() => $currentWeek = null}
     on:click={() => $clickedWeek = week}>
  <div class="week" style={style}/>
</div>

<style>
  .week-wrapper {
    padding: 0.2rem;
  }

  .week {
    border: 1px solid #e8e8e8;
    width: 1.2rem;
    height: 1.2rem;
    border-radius: 50%;
    box-sizing: border-box;
  }

  .is-past .week {
    background: var(--my-blue);
  }

  @keyframes blinkNow {
    0%, 25%, 75%, 100% {
      opacity: 0;
    }
    35%, 65% {
      opacity: 1;
    }
  }

  .is-now .week {
    animation: blinkNow 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  .is-hovered .week {
    box-shadow: 0 0 0 2px var(--black);
  }

  .is-disabled {
    pointer-events: none;
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
