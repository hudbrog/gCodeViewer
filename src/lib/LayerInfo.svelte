<script>
  export let layerNum = 0;
  export let layerZ = 0; // in mm
  export let layerSegments = 0; // GCODE commands in layer
  export let layerFilament = 0; // in mm, for this layer
  export let layerAggFilament = 0; // in mm, summed up to this layer
  export let layerPrintTime = 0; // in seconds, for this layer

  // Speed/Extrusion display type: 'speed', 'expermm', 'volpersec'
  export let speedDisplayType = 'speed';

  /**
   * Data structure for speed/extrusion info arrays:
   * Array of { color?: string, text: string, retractColor?: string, restartColor?: string }
   */
  export let speedInfoExtrude = [];
  export let speedInfoMove = [];
  export let speedInfoRetract = []; // Contains { retractColor, restartColor, text }
  export let exPerMMInfo = [];
  export let volPerSecInfo = [];

</script>

<div class="layer-info-card">
  <h4>Layer Information</h4>
  <ul>
    <li>Layer Number: {layerNum}</li>
    <li>Layer Height (Z): {layerZ.toString()} mm</li> <!-- Ensure layerZ is string if it can be number -->
    <li>GCODE Commands: {layerSegments}</li>
    <li>Filament Used (Layer): {layerFilament.toFixed(2)} mm</li>
    <li>Filament Used (Total): {layerAggFilament.toFixed(2)} mm</li>
    <li>Est. Print Time (Layer): {layerPrintTime.toFixed(1)} sec</li>
  </ul>

  {#if speedDisplayType === 'speed'}
    <div class="speed-details">
      {#if speedInfoExtrude.length > 0}
        <h5>Extrude Speeds:</h5>
        <ul>
          {#each speedInfoExtrude as item}
            <li><span class="color-box" style="background-color: {item.color};"></span> {item.text}</li>
          {/each}
        </ul>
      {/if}

      {#if speedInfoMove.length > 0}
        <h5>Move Speeds:</h5>
        <ul>
          {#each speedInfoMove as item}
            <li><span class="color-box" style="background-color: {item.color};"></span> {item.text}</li>
          {/each}
        </ul>
      {/if}

      {#if speedInfoRetract.length > 0}
        <h5>Retract Speeds:</h5>
        <ul>
          {#each speedInfoRetract as item}
            <li>
              <span class="color-dot" style="color: {item.retractColor};">&#9679;</span>
              <span class="color-dot" style="color: {item.restartColor};">&#9679;</span>
              {item.text}
            </li>
          {/each}
        </ul>
      {/if}
      {#if speedInfoExtrude.length === 0 && speedInfoMove.length === 0 && speedInfoRetract.length === 0}
        <p class="no-data">No speed data for this layer.</p>
      {/if}
    </div>
  {/if}

  {#if speedDisplayType === 'expermm'}
    <div class="speed-details">
      <h5>Extrusion per MM (mm/mm):</h5>
      {#if exPerMMInfo.length > 0}
        <ul>
          {#each exPerMMInfo as item}
            <li><span class="color-box" style="background-color: {item.color};"></span> {item.text}</li>
          {/each}
        </ul>
      {:else}
        <p class="no-data">No extrusion/mm data for this layer.</p>
      {/if}
    </div>
  {/if}

  {#if speedDisplayType === 'volpersec'}
    <div class="speed-details">
      <h5>Extrusion Volume per Second (mm³/sec):</h5>
      {#if volPerSecInfo.length > 0}
        <ul>
          {#each volPerSecInfo as item}
            <li><span class="color-box" style="background-color: {item.color};"></span> {item.text}</li>
          {/each}
        </ul>
      {:else}
        <p class="no-data">No volume/sec data for this layer.</p>
      {/if}
    </div>
  {/if}

</div>

<style>
  .layer-info-card {
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 15px;
    background-color: #f9f9f9;
    font-size: 0.9em;
    margin-top: 20px;
  }
  .layer-info-card h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #333;
    font-size: 1.1em;
    border-bottom: 1px solid #eee;
    padding-bottom: 5px;
  }
  .layer-info-card ul {
    list-style-type: none;
    padding-left: 0;
    margin: 0;
  }
  .layer-info-card li {
    padding: 4px 0;
    color: #555;
  }

  .speed-details {
    margin-top: 15px;
  }
  .speed-details h5 {
    margin-top: 10px;
    margin-bottom: 5px;
    color: #444;
    font-size: 1em;
  }
  .speed-details ul {
    padding-left: 10px; /* Indent speed details slightly */
    margin-bottom: 10px;
  }
  .speed-details li {
    display: flex;
    align-items: center;
    padding: 3px 0;
  }
  .color-box {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 1px solid #ccc;
    margin-right: 8px;
    vertical-align: middle;
  }
  .color-dot {
    font-size: 1.2em; /* Make dots a bit larger */
    margin-right: 2px;
    line-height: 1;
  }
  .no-data {
    color: #777;
    font-style: italic;
    font-size: 0.9em;
  }
</style>
