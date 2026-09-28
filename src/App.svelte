<script>
  // Core Svelte imports
  import { onMount, onDestroy } from 'svelte';

  // Component Imports
  import Accordion from './lib/Accordion.svelte';
  import AccordionItem from './lib/AccordionItem.svelte';
  import Tabs from './lib/Tabs.svelte';
  import Tab from './lib/Tab.svelte';
  import ProgressBar from './lib/ProgressBar.svelte';
  import Button from './lib/Button.svelte';
  import Slider from './lib/Slider.svelte';
  import Modal from './lib/Modal.svelte';
  import Dropdown from './lib/Dropdown.svelte';
  import DropdownItem from './lib/DropdownItem.svelte';
  import FileUploader from './lib/FileUploader.svelte';
  import ModelInfo from './lib/ModelInfo.svelte';
  import LayerInfo from './lib/LayerInfo.svelte';
  import RenderOptions2D from './lib/RenderOptions2D.svelte';
  import AnalyzerOptions from './lib/AnalyzerOptions.svelte';
  import PrinterInfoOptions from './lib/PrinterInfoOptions.svelte';
  import Notifications from './lib/Notifications.svelte';
  import CodeMirrorView from './lib/CodeMirrorView.svelte';

  // --- Application State ---

  let isAppDisabled = false; // Flag to disable app on fatal errors

  // Demo States
  let progressValue = 30;
  let isModalOpen = false;
  let selectedDropdownItem = 'None';

  // File Uploader State
  let uploadedFilesInfo = [];
  let rawGcodeContent = "";

  // Options States
  let renderOptions2DState = {
    showMoves: true, showRetracts: true, moveModel: true, differentiateColors: true,
    thickExtrusion: false, alpha: false, showNextLayer: false, speedDisplayType: 'speed'
  };
  let analyzerOptionsState = { sortLayers: true, purgeEmptyLayers: true, showGCode: false };
  let printerInfoOptionsState = {
    filamentDiameter: 1.75, nozzleDiameter: 0.4, hourlyCost: 1.0,
    filamentPrice: 0.05, filamentType: 'PLA', volumetricE: false
  };

  // Model and Layer Info
  let modelInfoData = {
    modelSizeX: 0, modelSizeY: 0, modelSizeZ: 0, totalFilament: 0, totalWeight: 0,
    filamentByExtruder: {}, printTime: 0, layerHeight: 0.2, layerCountPrinted: 0,
    layerCountTotal: 0, timeCost: 0, filamentCost: 0,
    speedsByLayer: {}, max: { speed: 0, volSpeed: 0, extrSpeed: 0 }, min: { speed: 0, volSpeed: 0, extrSpeed: 0 },
    volSpeedsByLayer: {}, extrusionSpeedsByLayer: {}, printTimeByLayer: {}
  };
  let currentLayerNumForInfo = 0;
  let layerInfoData = {
    layerNum: 0, layerZ: 0, layerSegments: 0, layerFilament: 0, layerAggFilament: 0,
    layerPrintTime: 0, speedDisplayType: 'speed', speedInfoExtrude: [], speedInfoMove: [],
    speedInfoRetract: [], exPerMMInfo: [], volPerSecInfo: []
  };
  
  // Layer and Segment Sliders
  let layerSliderValue = 0;
  let segmentSliderValue = 0;
  let maxSegmentsForCurrentLayer = 0;

  // Notifications
  let notificationMessages = [];

  // CodeMirrorView
  let codeMirrorViewInstance;
  let gcodePreviewText = "GCode will appear here when a file is loaded and 'Show GCode' option is enabled.";
  let gcodeHighlightedRange = null;

  // Web Worker
  let worker;
  let loadProgressValue = 0;
  let analyzeProgressValue = 0;
  let isRunAnalysisButtonDisabled = true;

  // Accordion Control
  let infoAccordionOpen = false;
  let progressAccordionOpen = false;

  // --- Event Handlers & Logic ---

  function handleFilesSelected(event) {
    if (isAppDisabled) {
        addNotification('error', 'Application is disabled due to missing critical browser features.', 0);
        return;
    }
    const files = event.detail;
    if (!files || files.length === 0) return;
    const file = files[0];

    uploadedFilesInfo = [{ name: file.name, size: (file.size / 1024).toFixed(2) + ' KB', type: file.type || 'N/A' }];
    addNotification('info', `Loading ${file.name}...`);
    progressAccordionOpen = true;
    loadProgressValue = 0;
    analyzeProgressValue = 0;
    isRunAnalysisButtonDisabled = true;

    const reader = new FileReader();
    reader.onload = function(e) {
      rawGcodeContent = e.target.result;
      if (analyzerOptionsState.showGCode) {
        gcodePreviewText = rawGcodeContent;
      } else {
        gcodePreviewText = `GCode for ${file.name} loaded. Enable "Show GCode" in Analyzer Options to view.`;
      }
      if (window.GCODE && window.GCODE.gCodeReader && worker) {
        worker.postMessage({ cmd: 'loadFile', msg: {gcode: rawGcodeContent, options: window.GCODE.gCodeReader.getOptions()} });
      } else {
        addNotification('error', 'GCODE scripts not loaded or worker not ready.');
      }
    };
    reader.onerror = function(e) {
      addNotification('error', 'Failed to read file.');
      console.error("FileReader error:", e);
      progressAccordionOpen = false;
    };
    reader.readAsText(file);
  }

  function onRenderOptions2DChange(event) {
    renderOptions2DState = event.detail;
    if (window.GCODE && window.GCODE.renderer) {
      window.GCODE.renderer.setOption(renderOptions2DState);
    }
    layerInfoData = { ...layerInfoData, speedDisplayType: renderOptions2DState.speedDisplayType };
    addNotification('info', '2D Render options updated.');
    if(modelInfoData.layerCountTotal > 0) populateLayerInfoDetail(currentLayerNumForInfo);
  }

  function onAnalyzerOptionsChange(event) {
    analyzerOptionsState = event.detail;
    if (window.GCODE && window.GCODE.gCodeReader) {
      window.GCODE.gCodeReader.setOption({
          sortLayers: analyzerOptionsState.sortLayers,
          purgeEmptyLayers: analyzerOptionsState.purgeEmptyLayers,
      });
    }
    if (analyzerOptionsState.showGCode && rawGcodeContent) gcodePreviewText = rawGcodeContent;
    else if (!analyzerOptionsState.showGCode) gcodePreviewText = "GCode view disabled in options.";
    if (currentActiveTab === 'GCode Preview' && codeMirrorViewInstance && analyzerOptionsState.showGCode) {
        setTimeout(() => codeMirrorViewInstance.refresh(), 0);
    }
    addNotification('info', 'Analyzer options updated.');
  }

  function onPrinterInfoOptionsChange(event) {
    printerInfoOptionsState = event.detail;
    if (window.GCODE && window.GCODE.gCodeReader) {
      window.GCODE.gCodeReader.setOption(printerInfoOptionsState);
    }
    modelInfoData = {
      ...modelInfoData,
      timeCost: (modelInfoData.printTime || 0) * printerInfoOptionsState.hourlyCost / 3600,
      filamentCost: (modelInfoData.totalWeight || 0) * printerInfoOptionsState.filamentPrice
    };
    addNotification('info', 'Printer/Filament options updated.');
    if(modelInfoData.layerCountTotal > 0 && renderOptions2DState.speedDisplayType === 'volpersec') {
        populateLayerInfoDetail(currentLayerNumForInfo);
    }
  }

  function getNumberOfSegments(layer) {
    if (window.GCODE && window.GCODE.renderer) {
      return window.GCODE.renderer.getLayerNumSegments(layer) || 0;
    }
    return 0;
  }

  function getGCodeLinesForSegment(layer, startSeg, endSeg) {
    if (window.GCODE && window.GCODE.gCodeReader) {
      return window.GCODE.gCodeReader.getGCodeLines(layer, startSeg, endSeg) || {first:0, last:0};
    }
    return {first:0, last:0};
  }

  function populateLayerInfoDetail(layerNum) {
    // ... (implementation from previous turn, no changes needed here for capabilities check)
    // For brevity, keeping the detailed implementation from Turn 39, which is correct.
    if (!window.GCODE || !window.GCODE.gCodeReader || !window.GCODE.renderer || !modelInfoData || modelInfoData.layerCountTotal === 0) {
      console.warn("GCODE objects not ready or no model data for populateLayerInfoDetail");
      layerInfoData = { ...layerInfoData, layerNum, speedInfoExtrude: [], speedInfoMove: [], speedInfoRetract: [], exPerMMInfo: [], volPerSecInfo: [] };
      return;
    }
    const z = window.GCODE.renderer.getZ(layerNum);
    const segments = window.GCODE.renderer.getLayerNumSegments(layerNum);
    const filament = window.GCODE.gCodeReader.getLayerFilament(z) || 0;
    let aggFilament = 0;
    for (let i = 0; i <= layerNum; i++) {
        aggFilament += (window.GCODE.gCodeReader.getLayerFilament(window.GCODE.renderer.getZ(i)) || 0);
    }
    let newSpeedInfoExtrude = [], newSpeedInfoMove = [], newSpeedInfoRetract = [], newExPerMMInfo = [], newVolPerSecInfo = [];
    const currentModelInfo = window.GCODE.gCodeReader.getModelInfo();
    const rendererOptions = window.GCODE.renderer.getOptions();
    const gcodeReaderOptions = window.GCODE.gCodeReader.getOptions();

    if (renderOptions2DState.speedDisplayType === 'speed') {
        if (currentModelInfo.speedsByLayer && currentModelInfo.speedsByLayer['extrude'] && currentModelInfo.speedsByLayer['extrude'][z]) {
            const extrudeSpeedsRaw = currentModelInfo.speedsByLayer['extrude'][z];
            const minSpeed = currentModelInfo.min.speed; const maxSpeed = currentModelInfo.max.speed;
            let sortable = {};
            if (minSpeed !== undefined && maxSpeed !== undefined && extrudeSpeedsRaw) {
                extrudeSpeedsRaw.forEach(spdVal => { if (spdVal === undefined) return; const spd = parseFloat(spdVal); const scale = (maxSpeed === minSpeed) ? 1 : (spd - minSpeed) / (maxSpeed - minSpeed); const text = (spd / 60).toFixed(2) + "mm/s"; sortable[text] = { color: window.GCODE.renderer.getGradientColor(scale), text: text }; });
                Object.keys(sortable).sort((a,b) => parseFloat(b) - parseFloat(a)).forEach(key => newSpeedInfoExtrude.push(sortable[key]));
            }
        }
        if (currentModelInfo.speedsByLayer && currentModelInfo.speedsByLayer['move'] && currentModelInfo.speedsByLayer['move'][z]) {
            const moveSpeedsRaw = currentModelInfo.speedsByLayer['move'][z]; let sortable = {};
            if (moveSpeedsRaw) { moveSpeedsRaw.forEach(spdVal => { if (spdVal === undefined) return; const text = (parseFloat(spdVal) / 60).toFixed(2) + "mm/s"; sortable[text] = { color: rendererOptions['colorMove'] || 'blue', text: text }; }); Object.keys(sortable).sort((a,b) => parseFloat(b) - parseFloat(a)).forEach(key => newSpeedInfoMove.push(sortable[key]));}
        }
        if (currentModelInfo.speedsByLayer && currentModelInfo.speedsByLayer['retract'] && currentModelInfo.speedsByLayer['retract'][z]) {
            const retractSpeedsRaw = currentModelInfo.speedsByLayer['retract'][z];
            if (retractSpeedsRaw) { retractSpeedsRaw.forEach(spdVal => { if (spdVal === undefined) return; newSpeedInfoRetract.push({ retractColor: rendererOptions['colorRetract'] || 'red', restartColor: rendererOptions['colorRestart'] || 'purple', text: (parseFloat(spdVal) / 60).toFixed(2) + "mm/s" }); });}
        }
    } else if (renderOptions2DState.speedDisplayType === 'expermm') {
        if (currentModelInfo.volSpeedsByLayer && currentModelInfo.volSpeedsByLayer[z]) {
            const volSpeedsRaw = currentModelInfo.volSpeedsByLayer[z]; const minVolSpeed = currentModelInfo.min.volSpeed; const maxVolSpeed = currentModelInfo.max.volSpeed; let sortable = {};
            if (minVolSpeed !== undefined && maxVolSpeed !== undefined && volSpeedsRaw) { volSpeedsRaw.forEach(spdVal => { if (spdVal === undefined) return; const spd = parseFloat(spdVal); const scale = (maxVolSpeed === minVolSpeed) ? 1 : (spd - minVolSpeed) / (maxVolSpeed - minVolSpeed); const text = spd.toFixed(3) + "mm/mm"; sortable[text] = { color: window.GCODE.renderer.getGradientColor(scale), text: text }; }); Object.keys(sortable).sort((a,b) => parseFloat(b) - parseFloat(a)).forEach(key => newExPerMMInfo.push(sortable[key]));}
        }
    } else if (renderOptions2DState.speedDisplayType === 'volpersec') {
        if (currentModelInfo.extrusionSpeedsByLayer && currentModelInfo.extrusionSpeedsByLayer[z]) {
            const extrusionSpeedsRaw = currentModelInfo.extrusionSpeedsByLayer[z]; const minExtrSpeed = currentModelInfo.min.extrSpeed; const maxExtrSpeed = currentModelInfo.max.extrSpeed; let sortable = {};
            if (minExtrSpeed !== undefined && maxExtrSpeed !== undefined && extrusionSpeedsRaw) { extrusionSpeedsRaw.forEach(spdVal => { if (spdVal === undefined) return; let spd = parseFloat(spdVal); const scale = (maxExtrSpeed === minExtrSpeed) ? 1 : (spd - minExtrSpeed) / (maxExtrSpeed - minExtrSpeed); if (!gcodeReaderOptions.volumetricE && gcodeReaderOptions.filamentDia) { spd *= Math.PI * Math.pow(gcodeReaderOptions.filamentDia / 2, 2); } const text = spd.toFixed(1) + "mm³/sec"; sortable[text] = { color: window.GCODE.renderer.getGradientColor(scale), text: text }; }); Object.keys(sortable).sort((a,b) => parseFloat(b) - parseFloat(a)).forEach(key => newVolPerSecInfo.push(sortable[key]));}
        }
    }
    layerInfoData = { layerNum: layerNum, layerZ: z.toString(), layerSegments: segments, layerFilament: filament, layerAggFilament: aggFilament, layerPrintTime: currentModelInfo.printTimeByLayer ? (currentModelInfo.printTimeByLayer[z] || 0) : 0, speedDisplayType: renderOptions2DState.speedDisplayType, speedInfoExtrude: newSpeedInfoExtrude, speedInfoMove: newSpeedInfoMove, speedInfoRetract: newSpeedInfoRetract, exPerMMInfo: newExPerMMInfo, volPerSecInfo: newVolPerSecInfo };
  }


  function updateUIForNewModel() {
    if (!window.GCODE || !window.GCODE.gCodeReader || !window.GCODE.renderer) {
        addNotification('error', "Cannot update UI: GCODE objects not available.");
        return;
    }
    populateLayerInfoDetail(0);
    
    layerSliderValue = 0;
    maxSegmentsForCurrentLayer = getNumberOfSegments(0);
    segmentSliderValue = 0;
    updateGCodeHighlight();

    const gcodeReaderOptions = window.GCODE.gCodeReader.getOptions();
    printerInfoOptionsState = {
        ...printerInfoOptionsState,
        nozzleDiameter: gcodeReaderOptions.nozzleDia || printerInfoOptionsState.nozzleDiameter,
        filamentDiameter: gcodeReaderOptions.filamentDia || printerInfoOptionsState.filamentDiameter,
    };
  }
  
  $: {
      if (layerSliderValue !== undefined && modelInfoData.layerCountTotal > 0 && window.GCODE && window.GCODE.renderer) {
          maxSegmentsForCurrentLayer = getNumberOfSegments(layerSliderValue);
          if (segmentSliderValue > maxSegmentsForCurrentLayer) {
            segmentSliderValue = maxSegmentsForCurrentLayer;
          }
          populateLayerInfoDetail(layerSliderValue);
          updateGCodeHighlight();
          window.GCODE.renderer.render(layerSliderValue, 0, segmentSliderValue);
      }
  }
  $: {
      if (segmentSliderValue !== undefined && modelInfoData.layerCountTotal > 0 && window.GCODE && window.GCODE.renderer) {
          updateGCodeHighlight();
          window.GCODE.renderer.render(layerSliderValue, 0, segmentSliderValue);
      }
  }
  function updateGCodeHighlight() {
      if(modelInfoData.layerCountTotal > 0 && window.GCODE && window.GCODE.gCodeReader){
        gcodeHighlightedRange = getGCodeLinesForSegment(layerSliderValue, 0, segmentSliderValue);
      } else {
        gcodeHighlightedRange = null;
      }
  }

  // Tab Control
  let currentActiveTab = '2D View';
  function handleTabChange(event) {
    currentActiveTab = event.detail.title;
    if (currentActiveTab === '3D View') handle3DTabSelected();
    else if (currentActiveTab === 'GCode Preview') handleGCodeTabSelected();
  }
  function handle3DTabSelected() { addNotification('info', 'Switched to 3D View.'); /* Future: GCODE.renderer3d.doRender(); */ }
  function handleGCodeTabSelected() {
    addNotification('info', 'Switched to GCode Preview.');
    if (codeMirrorViewInstance && analyzerOptionsState.showGCode) {
      setTimeout(() => {
        codeMirrorViewInstance.refresh();
        if (gcodeHighlightedRange) codeMirrorViewInstance.setCursorPosition(gcodeHighlightedRange.first, 0);
      }, 0);
    }
  }

  // Notifications
  function addNotification(type, text, duration = 5000) { const id = Date.now() + Math.random(); notificationMessages = [...notificationMessages, { id, type, text }]; if (duration) { setTimeout(() => { notificationMessages = notificationMessages.filter(msg => msg.id !== id); }, duration); } }
  function clearNotification(id) { notificationMessages = notificationMessages.filter(msg => msg.id !== id); }
  function clearAllNotifications() { notificationMessages = []; }

  // Web Worker Message Handler
  function processWorkerMessage(e) {
    const data = e.data;
    switch (data.cmd) {
      case 'returnModel':
        loadProgressValue = 100;
        addNotification('success', 'File loaded, starting analysis...');
        if (worker) worker.postMessage({ "cmd":"analyzeModel", "msg":{} });
        break;
      case 'analyzeDone':
        analyzeProgressValue = 100;
        if (window.GCODE && window.GCODE.gCodeReader) {
            window.GCODE.gCodeReader.processAnalyzeModelDone(data.msg);
            modelInfoData = { ...window.GCODE.gCodeReader.getModelInfo() }; 
        }
        updateUIForNewModel();
        
        infoAccordionOpen = true;
        currentActiveTab = '2D View';
        isRunAnalysisButtonDisabled = false;
        addNotification('success', 'GCode analysis complete.');
        progressAccordionOpen = false;
        break;
      case 'returnLayer':
      case 'returnMultiLayer':
        loadProgressValue = data.msg.progress;
        break;
      case "analyzeProgress":
        analyzeProgressValue = data.msg.progress;
        break;
      default:
        console.log("Unknown worker message received:", data);
        addNotification('warning', `Unknown worker command: ${data.cmd}`);
    }
  }

  // Lifecycle
  onMount(() => {
    // --- Capabilities Check (from js/ui.js checkCapabilities) ---
    if (!window.Modernizr) {
        addNotification('error', 'Modernizr not found. Browser capabilities check cannot run.', 0);
        isAppDisabled = true; // Potentially disable app if Modernizr is critical
    } else {
        Modernizr.addTest('filereader', function () {
            return !!(window.File && window.FileList && window.FileReader);
        });

        if(!Modernizr.canvas) {
            addNotification('error', "HTML5 Canvas is not supported. This application won't work.", 0);
            isAppDisabled = true;
        }
        if(!Modernizr.filereader) {
            addNotification('error', "HTML5 File API is not supported. This application won't work.", 0);
            isAppDisabled = true;
        }
        if(!Modernizr.webworkers) {
            addNotification('error', "HTML5 Web Workers are not supported. This application won't work.", 0);
            isAppDisabled = true;
        }
        if(!Modernizr.svg) { // Though original had this, it might not be strictly fatal for core Svelte app.
            addNotification('error', "HTML5 SVG is not supported. Some visual elements might not work.", 0);
            // isAppDisabled = true; // Decide if this is fatal for Svelte version
        }

        if(isAppDisabled) {
            addNotification('error', 'Core browser features missing. Application functionality will be severely limited.', 0);
            // Optionally, hide main UI or show a persistent overlay
        } else {
            // Non-fatal warnings
            if(!Modernizr.webgl){
                addNotification('warning', "WebGL is not supported. 3D mode may be slow or unavailable.", 10000);
                if (window.GCODE && window.GCODE.renderer3d) {
                    window.GCODE.renderer3d.setOption({rendererType: "canvas"}); // Fallback if possible
                }
            }
            if(!Modernizr.draganddrop){
                addNotification('warning', "Drag'n'Drop is not supported. File drop zone may not work.", 10000);
            }
        }
    }
    // --- End Capabilities Check ---

    if (!isAppDisabled && (!window.GCODE || !window.GCODE.gCodeReader || !window.GCODE.renderer)) {
        addNotification('error', 'Core GCODE scripts not loaded. App may not function correctly.', 10000);
        console.error("window.GCODE objects not found onMount!");
    } else if (!isAppDisabled) {
        worker = new Worker('js/Worker.js');
        worker.addEventListener('message', processWorkerMessage);

        window.GCODE.gCodeReader.setOption({
            sortLayers: analyzerOptionsState.sortLayers, purgeEmptyLayers: analyzerOptionsState.purgeEmptyLayers,
            volumetricE: printerInfoOptionsState.volumetricE, filamentDia: printerInfoOptionsState.filamentDiameter,
            nozzleDia: printerInfoOptionsState.nozzleDiameter, hourlyCost: printerInfoOptionsState.hourlyCost,
            filamentPrice: printerInfoOptionsState.filamentPrice, filamentType: printerInfoOptionsState.filamentType,
        });
        window.GCODE.renderer.setOption({
            moveModel: renderOptions2DState.moveModel, showMoves: renderOptions2DState.showMoves,
            showRetracts: renderOptions2DState.showRetracts, differentiateColors: renderOptions2DState.differentiateColors,
            actualWidth: renderOptions2DState.thickExtrusion, alpha: renderOptions2DState.alpha,
            showNextLayer: renderOptions2DState.showNextLayer, speedDisplayType: renderOptions2DState.speedDisplayType,
            renderAnalysis: false,
        });
    }
    populateLayerInfoDetail(0);
    if (!isAppDisabled) addNotification('info', 'Application initialized. Load a GCode file to start.', 7000);
    else addNotification('error', 'Application disabled due to compatibility issues. Please check error messages.', 0);

  });

  onDestroy(() => {
    if (worker) {
      worker.terminate();
      worker.removeEventListener('message', processWorkerMessage);
    }
  });

</script>

<div class="app-container" class:disabled={isAppDisabled}>
  <header class="app-header">
    <h1>GCode Viewer - Svelte Edition</h1>
    <FileUploader on:filesSelected={handleFilesSelected} disabled={isAppDisabled} />
  </header>

  <Notifications messages={notificationMessages} on:clear={e => clearNotification(e.detail.id)} on:clearAll={clearAllNotifications}/>

  {#if !isAppDisabled}
    <div class="main-layout">
      <aside class="sidebar">
        <Accordion allowMultiple={true}>
          <AccordionItem title="File Progress" bind:isOpen={progressAccordionOpen}>
              <div slot="content">
                  <div class="progress-item"> <span>Load Progress:</span> <ProgressBar progress={loadProgressValue} /> </div>
                  <div class="progress-item"> <span>Analyze Progress:</span> <ProgressBar progress={analyzeProgressValue} /> </div>
              </div>
          </AccordionItem>
          <AccordionItem title="2D Render Options">
            <div slot="content"> <RenderOptions2D {...renderOptions2DState} on:optionsChange={onRenderOptions2DChange} /> </div>
          </AccordionItem>
          <AccordionItem title="Analyzer Options">
            <div slot="content"> <AnalyzerOptions {...analyzerOptionsState} on:optionsChange={onAnalyzerOptionsChange} /> </div>
          </AccordionItem>
          <AccordionItem title="Printer & Filament">
            <div slot="content"> <PrinterInfoOptions {...printerInfoOptionsState} on:optionsChange={onPrinterInfoOptionsChange} /> </div>
          </AccordionItem>
          <AccordionItem title="Error Analysis">
              <div slot="content">
                  <p><small>This section might show error details or allow re-analysis.</small></p>
                  <Button label="Run Analysis Again" disabled={isRunAnalysisButtonDisabled} on:click={() => worker && worker.postMessage({ cmd: 'analyzeModel', msg:{} })} />
              </div>
          </AccordionItem>
        </Accordion>
      </aside>

      <main class="content-area">
        <Tabs on:tabChange={handleTabChange} bind:activeTabTitle={currentActiveTab}>
          <Tab title="2D View">
            <div class="view-2d-container">
              <div class="canvas-placeholder" id="canvas-2d-area">2D Canvas Area</div>
              <div class="slider-controls-2d">
                 <Slider bind:value={layerSliderValue} min={0} max={modelInfoData.layerCountTotal > 0 ? modelInfoData.layerCountTotal -1 : 0} step={1} orientation="vertical"/>
                 <Slider bind:value={segmentSliderValue} min={0} max={maxSegmentsForCurrentLayer} step={1} orientation="horizontal"/>
              </div>
            </div>
          </Tab>
          <Tab title="3D View">
            <div class="canvas-placeholder" id="canvas-3d-area">3D Canvas Area</div>
          </Tab>
          <Tab title="GCode Preview">
            <div class="gcode-preview-container">
              {#if analyzerOptionsState.showGCode && rawGcodeContent}
                <CodeMirrorView bind:this={codeMirrorViewInstance} gcodeText={gcodePreviewText} highlightedLines={gcodeHighlightedRange} readOnly={true} showLineNumbers={true} />
              {:else if !rawGcodeContent} <p class="gcode-message">Load a GCode file to see the preview.</p>
              {:else} <p class="gcode-message">GCode view is disabled in Analyzer Options. Enable it to see the GCode.</p> {/if}
            </div>
          </Tab>
          <Tab title="About">
            <div class="about-content">
              <h3>About GCode Viewer - Svelte Edition</h3>
              <p>Demo controls:</p>
              <Button label="Test Error Notification" on:click={() => addNotification('error', 'This is a sample error message!')} />
              <Button label="Test Success Notification" on:click={() => addNotification('success', 'Operation successful!')} />
            </div>
          </Tab>
        </Tabs>
      </main>

      <aside class="info-sidebar">
        <Accordion allowMultiple={true}>
          <AccordionItem title="GCode Information" bind:isOpen={infoAccordionOpen} initialOpen={true}>
              <div slot="content">
                  <ModelInfo {...modelInfoData} />
                  <LayerInfo {...layerInfoData} />
              </div>
          </AccordionItem>
        </Accordion>
         {#if uploadedFilesInfo.length > 0}
          <div class="file-list-display component-section">
              <h4>Selected Files:</h4>
              <ul> {#each uploadedFilesInfo as file (file.name)} <li><strong>{file.name}</strong> ({file.type}) - {file.size}</li> {/each} </ul>
          </div>
        {/if}
      </aside>
    </div>
  {:else}
    <div class="app-disabled-message">
        <h2>Application Disabled</h2>
        <p>Critical browser features are missing. Please check the notifications (top-right) for details.</p>
        <p>Try using a modern browser like Chrome, Firefox, Safari, or Edge.</p>
    </div>
  {/if}
</div>

<style>
  /* Existing styles from previous App.svelte... ensure they are present */
  :global(body) { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif; margin: 0; background-color: #f0f2f5; color: #333; }
  .app-container { display: flex; flex-direction: column; height: 100vh; }
  .app-header { padding: 10px 20px; background-color: #333; color: white; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
  .app-header h1 { font-size: 1.5em; margin: 0; }
  .main-layout { display: flex; flex-grow: 1; overflow: hidden; }
  .sidebar { width: 300px; padding: 15px; background-color: #fff; border-right: 1px solid #ddd; overflow-y: auto; flex-shrink: 0; }
  .content-area { flex-grow: 1; padding: 15px; display: flex; flex-direction: column; overflow-y: auto; }
  :global(.content-area > .tabs-container) { flex-grow: 1; display: flex; flex-direction: column; }
  :global(.content-area > .tabs-container > .tab-content-area) { flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; }
  .info-sidebar { width: 300px; padding: 15px; background-color: #fff; border-left: 1px solid #ddd; overflow-y: auto; flex-shrink: 0; }
  
  .canvas-placeholder { min-height: 300px; background-color: #e9e9e9; display: flex; justify-content: center; align-items: center; color: #777; font-size: 1.2em; border-radius: 4px; margin-bottom: 15px; flex-grow: 1; }
  .gcode-preview-container { flex-grow: 1; display: flex; flex-direction: column; min-height: 400px; }
  .gcode-message { margin: auto; color: #777; }
  :global(.gcode-preview-container > .codemirror-wrapper) { flex-grow: 1; height: auto; }
  .view-2d-container { display: flex; flex-direction: column; height: 100%; }
  .slider-controls-2d { display: flex; align-items: center; padding: 10px 0; gap: 20px; flex-shrink: 0; }
  .slider-controls-2d > :global(.slider-container.horizontal) { flex-grow: 1; }
  .slider-controls-2d > :global(.slider-container.vertical) { max-height: 200px; min-height: 100px; }
  .about-content { padding: 10px; } .about-content h3 { margin-top: 0; } .about-content hr { margin: 15px 0; } .about-content button { margin-right: 10px; margin-bottom: 10px;}
  .file-list-display { margin-top: 15px; padding: 10px; background-color: #f0f0f0; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 0.85em; }
  .file-list-display h4 { margin-top: 0; margin-bottom: 8px; } .file-list-display ul { list-style-type: none; padding-left: 0; margin: 0; } .file-list-display li { padding: 3px 0; border-bottom: 1px solid #e5e5e5; } .file-list-display li:last-child { border-bottom: none; }

  .progress-item { margin-bottom: 10px; }
  .progress-item span { display: block; font-size: 0.9em; margin-bottom: 4px; color: #555; }
  :global(.tab-content) { height: 100%; display: flex; flex-direction: column; }

  .app-disabled-message {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 40px;
    flex-grow: 1;
    color: #777;
  }
  .app-disabled-message h2 {
    color: #dc3545; /* Red color for emphasis */
  }
  .app-container.disabled .main-layout {
    /* Optionally hide or grey out main layout if app is disabled */
    /* filter: grayscale(1); pointer-events: none; */
  }
</style>
