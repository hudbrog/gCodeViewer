<script>
  export let progress = 0; // Default progress to 0 if not provided

  // Ensure progress is within the 0-100 range
  $: clampedProgress = Math.max(0, Math.min(100, progress));
</script>

<div class="progress-bar-container">
  <div class="progress-bar-fill" style="width: {clampedProgress}%;">
    <span class="progress-bar-text">{clampedProgress}%</span>
  </div>
</div>

<style>
  .progress-bar-container {
    width: 100%;
    background-color: #e0e0e0;
    border-radius: 4px;
    height: 20px;
    position: relative; /* For positioning the text */
  }

  .progress-bar-fill {
    height: 100%;
    background-color: #4caf50; /* Green color for progress */
    border-radius: 4px;
    text-align: center;
    line-height: 20px; /* Vertically center text */
    color: white;
    transition: width 0.3s ease-in-out; /* Smooth transition for width changes */
  }

  .progress-bar-text {
    font-size: 0.8em;
    font-weight: bold;
  }
</style>
