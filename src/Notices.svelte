<script>
  import {load, save} from './storageService';

  let hideMobileNotice = load('hideMobileNotice');
  let hidePrivacyNotice = load('hidePrivacyNotice');
  let hideUpdatesUntil = load('hideUpdatesUntil');

  let updateDate = '2021-12-30';
  let isUpdateVisible = false;

  function removeMobileNotice() {
    hideMobileNotice = true;
    save('hideMobileNotice', true);
  }

  function removePrivacyNotice() {
    hidePrivacyNotice = true;
    save('hidePrivacyNotice', true);
  }

  function hideUpdatesNotice() {
    isUpdateVisible = false;
    save('hideUpdatesUntil', updateDate);
  }
</script>


<style>

</style>
