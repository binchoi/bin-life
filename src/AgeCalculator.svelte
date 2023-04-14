<script>
  import {dobString} from './stores';

  function dateDiff(startingDate, endingDate) {
    let startDate = new Date(new Date(startingDate).toISOString().substr(0, 10));
    if (!endingDate) {
      endingDate = new Date().toISOString().substr(0, 10); // need date in YYYY-MM-DD format
    }
    let endDate = new Date(endingDate);
    if (startDate > endDate) {
      const swap = startDate;
      startDate = endDate;
      endDate = swap;
    }
    const startYear = startDate.getFullYear();
    const february = (startYear % 4 === 0 && startYear % 100 !== 0) || startYear % 400 === 0 ? 29 : 28;
    const daysInMonth = [31, february, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    let yearDiff = endDate.getFullYear() - startYear;
    let monthDiff = endDate.getMonth() - startDate.getMonth();
    if (monthDiff < 0) {
      yearDiff--;
      monthDiff += 12;
    }

    return yearDiff + 'Y ' + monthDiff + 'M';
  }

  const today = new Date();
  const dob = new Date($dobString);
  const cur_age = dateDiff(today, dob)
</script>

<div class="age-calculator" style="padding-top: -1rem; padding-bottom: 1rem; font-size: 140%;">
  You have spent <b class="my-age">{cur_age}</b> on this beautiful planet 🌎
</div>

<style>
  .my-age:hover {
    color: var(--my-blue);
  }
</style>
