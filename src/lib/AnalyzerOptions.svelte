<script>
  import { createEventDispatcher, afterUpdate } from 'svelte';

  export let sortLayers = true;
  export let purgeEmptyLayers = true;
  export let showGCode = false; // Corresponds to enabling/disabling the GCode view text area

  const dispatch = createEventDispatcher();

  function handleChange() {
    dispatch('optionsChange', {
      sortLayers,
      purgeEmptyLayers,
      showGCode
    });
  }
  
  let initialLoad = true;
  afterUpdate(() => {
    if (!initialLoad) {
        handleChange();
    }
    initialLoad = false;
  });

</script>

<div class="options-card">
  <h4>GCode Analyzer Options</h4>
  <div class="option-group">
    <label>
      <input type="checkbox" bind:checked={sortLayers}> Sort Layers by Z-height
    </label>
    <label>
      <input type="checkbox" bind:checked={purgeEmptyLayers}> Purge Empty Layers
    </label>
    <label>
      <input type="checkbox" bind:checked={showGCode}> Show GCode in Preview Tab
    </label>
  </div>
</div>

<style>
  .options-card {
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 15px;
    background-color: #f9f9f9;
    font-size: 0.9em;
  }
  .options-card h4 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #333;
    font-size: 1.1em;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;
  }
  .option-group label {
    display: block;
    margin-bottom: 8px;
    color: #555;
    cursor: pointer;
  }
  .option-group label input {
    margin-right: 8px;
    vertical-align: middle;
  }
</style>
