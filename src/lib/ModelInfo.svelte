<script>
  export let modelSizeX = 0;
  export let modelSizeY = 0;
  export let modelSizeZ = 0;
  export let totalFilament = 0; // in mm
  export let totalWeight = 0; // in grams
  export let filamentByExtruder = {}; // Object like { 'T0': 1234.56, 'T1': 789.10 }
  export let printTime = 0; // in seconds
  export let layerHeight = 0; // in mm
  export let layerCountPrinted = 0;
  export let layerCountTotal = 0; // visited layers
  export let timeCost = 0;
  export let filamentCost = 0;

  function formatPrintTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
</script>

<div class="model-info-card">
  <h4>Model Information</h4>
  <ul>
    <li>Model Size: {modelSizeX.toFixed(2)} x {modelSizeY.toFixed(2)} x {modelSizeZ.toFixed(2)} mm</li>
    <li>Total Filament Used: {totalFilament.toFixed(2)} mm</li>
    <li>Total Filament Weight: {totalWeight.toFixed(2)} grams</li>
    
    {#if Object.keys(filamentByExtruder).length > 1}
      <li class="extruder-info">
        Filament by Extruder:
        <ul>
          {#each Object.entries(filamentByExtruder) as [extruder, amount]}
            <li>{extruder}: {amount.toFixed(2)} mm</li>
          {/each}
        </ul>
      </li>
    {/if}
    
    <li>Estimated Print Time: {formatPrintTime(printTime)}</li>
    <li>Estimated Layer Height: {layerHeight.toFixed(2)} mm</li>
    <li>Layer Count: {layerCountPrinted} printed, {layerCountTotal} visited</li>
    <li>Estimated Time Cost: ${timeCost.toFixed(2)}</li>
    <li>Estimated Filament Cost: ${filamentCost.toFixed(2)}</li>
  </ul>
</div>

<style>
  .model-info-card {
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 15px;
    background-color: #f9f9f9;
    font-size: 0.9em;
  }
  .model-info-card h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #333;
    font-size: 1.1em;
    border-bottom: 1px solid #eee;
    padding-bottom: 5px;
  }
  .model-info-card ul {
    list-style-type: none;
    padding-left: 0;
    margin: 0;
  }
  .model-info-card li {
    padding: 4px 0;
    color: #555;
  }
  .model-info-card li strong {
    color: #333;
  }
  .extruder-info ul {
    padding-left: 15px;
    margin-top: 4px;
  }
</style>
