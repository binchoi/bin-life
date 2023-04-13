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
  .prv-notice {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 0vw;
    background: var(--sky);
    text-align: center;
    padding: 0;
    z-index: 10;
    box-sizing: border-box;
  }

  .prv-notice button {
    padding: 0.3rem;
    margin-top: 0.5rem;
  }

  .mobile-notice {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    background: salmon;
    text-align: center;
    padding: 1rem;
    z-index: 20;
    box-sizing: border-box;
  }

  .mobile-notice button {
    padding: 0.3rem;
    margin-top: 0.5rem;
  }

  @media (min-width: 1280px) {

    .mobile-notice {
      display: none;
    }
  }

  .update-notice {
    position: fixed;
    left: 1rem;
    bottom: 1rem;
    border: 1px solid var(--black);
    padding: 1rem;
    min-width: 12rem;
    max-width: 16rem;
    background: white;
    border-radius: 0.3rem;
    box-shadow: 0 0 2px 0 var(--black);
  }

  .update-head {
    font-weight: 600;
    margin-bottom: 1rem;
  }
</style>
