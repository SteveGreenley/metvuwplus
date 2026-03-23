// Runs on /forecast/ index page — redirect to preferred view if enabled
chrome.storage.sync.get(
  ['preferredType', 'preferredRegion', 'preferredDays', 'prefsEnabled'],
  function (data) {
    if (
      data.prefsEnabled &&
      data.preferredType &&
      data.preferredRegion &&
      data.preferredDays
    ) {
      const url =
        '/forecast/forecast.php' +
        '?type=' + encodeURIComponent(data.preferredType) +
        '&region=' + encodeURIComponent(data.preferredRegion) +
        '&noofdays=' + encodeURIComponent(data.preferredDays);
      window.location.replace(url);
    }
  }
);
