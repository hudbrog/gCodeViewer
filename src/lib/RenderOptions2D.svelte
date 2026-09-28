<script>
  import { createEventDispatcher, afterUpdate } from 'svelte';

  export let showMoves = true;
  export let showRetracts = true;
  export let moveModel = true;
  export let differentiateColors = true;
  export let thickExtrusion = false;
  export let alpha = false;
  export let showNextLayer = false;
  export let speedDisplayType = 'speed'; // 'speed', 'expermm', 'volpersec'

  const dispatch = createEventDispatcher();

  // This function will be called whenever any of the props change.
  // For now, it just dispatches the event. Later, it could directly call GCODE.renderer.setOption()
  function handleChange() {
    dispatch('optionsChange', {
      showMoves,
      showRetracts,
      moveModel,
      differentiateColors,
      thickExtrusion,
      alpha,
      showNextLayer,
      speedDisplayType
    });
  }

  // Use afterUpdate to dispatch changes after props are updated by bindings
  // This ensures that when a prop is changed from outside, the event is still dispatched.
  let initialLoad = true;
  afterUpdate(() => {
    if (!initialLoad) { // Don't dispatch on initial component load
        handleChange();
    }
    initialLoad = false;
  });

</script>

<div class="options-card">
  <h4>2D Render Options</h4>
  <div class="option-group">
    <label>
      <input type="checkbox" bind:checked={showMoves}> Show Moves
    </label>
    <label>
      <input type="checkbox" bind:checked={showRetracts}> Show Retracts
    </label>
    <label>
      <input type="checkbox" bind:checked={moveModel}> Center Model on Screen
    </label>
    <label>
      <input type="checkbox" bind:checked={differentiateColors}> Differentiate Colors (by speed)
    </label>
    <label>
      <input type="checkbox" bind:checked={thickExtrusion}> Show Actual Extrusion Width
    </label>
    <label>
      <input type="checkbox" bind:checked={alpha}> Enable Alpha/Transparency
    </label>
    <label>
      <input type="checkbox" bind:checked={showNextLayer}> Show Next Layer (Faintly)
    </label>
  </div>

  <div class="option-group speed-display-group">
    <h5>Speed Display Type:</h5>
    <label>
      <input type="radio" name="speedDisplayType" value="speed" bind:group={speedDisplayType}> Speed (mm/s)
    </label>
    <label>
      <input type="radio" name="speedDisplayType" value="expermm" bind:group={speedDisplayType}> Extrusion per mm (mm/mm)
    </label>
    <label>
      <input type="radio" name="speedDisplayType" value="volpersec" bind:group={speedDisplayType}> Volume per second (mm³/s)
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
  .option-group {
    margin-bottom: 15px;
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
  .speed-display-group h5 {
    margin-bottom: 8px;
    font-weight: bold;
    color: #444;
  }
</style>
