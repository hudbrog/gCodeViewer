/**
 * User: hudbrog (hudbrog@gmail.com)
 * Date: 10/21/12
 * Time: 7:45 AM
 */

var GCODE = {};

GCODE.ui = (function(){
    var reader;
    var myCodeMirror;
    var sliderVer;
    var sliderHor;
    var gCodeLines = {first: 0, last: 0};
    var showGCode = false;
    var displayType = {speed: 1, expermm: 2, volpersec: 3};
//    var worker;

    var setProgress = function(id, progress){
        $('#'+id).width(parseInt(progress)+'%').text(parseInt(progress)+'%');
//        $('#'+id);
    };

    var chooseAccordion = function(id){
//        debugger;
        $('#'+id).collapse("show");
    };

    var setLinesColor = function(toggle){
        for(var i=gCodeLines.first;i<gCodeLines.last; i++){
            if(toggle){
                myCodeMirror.setLineClass(Number(i), null, "activeline");
            }else{
                myCodeMirror.setLineClass(Number(i), null, null);
            }
        }
    };

    var prepareSpeedsInfo = function(layerNum){
        var z = GCODE.renderer.getZ(layerNum);
        var layerSpeeds = GCODE.gCodeReader.getModelInfo().speedsByLayer;
        var max = GCODE.gCodeReader.getModelInfo().max;
        var min = GCODE.gCodeReader.getModelInfo().min;
        var renderOptions = GCODE.renderer.getOptions();
        var speedIndex = 0;
        var output = [];
        var sortMe = {};
        var sortKeys = [];
        var i;
        var spd;
        var scale;

        output.push("Extrude speeds:");
        for(i=0;i<layerSpeeds['extrude'][z].length;i++){
            if(typeof(layerSpeeds['extrude'][z][i])==='undefined'){continue;}
            spd = parseFloat(layerSpeeds['extrude'][z][i]);
            scale = (spd - min.speed)/(max.speed-min.speed);
            spd = (spd/60).toFixed(2);
            sortMe[spd] = "<div id='colorBox"+i+"' class='colorBox' style='background-color: "+ GCODE.renderer.getGradientColor(scale) + "'></div>  = " + spd+"mm/s";
        }
        sortKeys = Object.keys(sortMe).sort((a, b) => b - a);
        for(i=0;i<sortKeys.length;i++) {
            output.push(sortMe[sortKeys[i]]);
        }

        if(typeof(layerSpeeds['move'][z]) !== 'undefined'){
            output.push("Move speeds:");
            for(i=0;i<layerSpeeds['move'][z].length;i++){
                if(typeof(layerSpeeds['move'][z][i])==='undefined'){continue;}
                spd = (parseFloat(layerSpeeds['move'][z][i])/60).toFixed(2);
                sortMe[spd] = "<div id='colorBox"+i+"' class='colorBox' style='background-color: "+renderOptions['colorMove'] + "'></div>  = " + spd+"mm/s";
            }
        }
        sortKeys = Object.keys(sortMe).sort((a, b) => b - a);
        for(i=0;i<sortKeys.length;i++) {
            output.push(sortMe[sortKeys[i]]);
        }

        if(typeof(layerSpeeds['retract'][z]) !== 'undefined'){
            output.push("Retract speeds:");
            for(i=0;i<layerSpeeds['retract'][z].length;i++){
                if(typeof(layerSpeeds['retract'][z][i])==='undefined'){continue;}
                output.push("<span style='color: " + renderOptions['colorRetract'] +"'>&#9679;</span> <span style='color: " + renderOptions['colorRestart'] +"'>&#9679;</span> = " +(parseFloat(layerSpeeds['retract'][z][i])/60).toFixed(2)+"mm/s");
            }
        }

        return output;
    }

    var prepareExPerMMInfo = function(layerNum){
        var z = GCODE.renderer.getZ(layerNum);
        var layerSpeeds = GCODE.gCodeReader.getModelInfo().volSpeedsByLayer;
        var max = GCODE.gCodeReader.getModelInfo().max;
        var min = GCODE.gCodeReader.getModelInfo().min;
        var output = [];
        var sortMe = {};
        var sortKeys = [];
        var i;
        var spd;
        var scale;

        output.push("Extrude speeds in extrusion mm per move mm:");
        for(i=0;i<layerSpeeds[z].length;i++){
            if(typeof(layerSpeeds[z][i])==='undefined'){continue;}
            spd = parseFloat(layerSpeeds[z][i]);
            scale = (spd - min.volSpeed)/(max.volSpeed-min.volSpeed);
            spd = spd.toFixed(3);
            sortMe[spd] = "<div id='colorBox"+i+"' class='colorBox' style='background-color: "+ GCODE.renderer.getGradientColor(scale) + "'></div>  = " + spd+"mm/mm";
        }
        sortKeys = Object.keys(sortMe).sort((a, b) => b - a);
        for(i=0;i<sortKeys.length;i++) {
            output.push(sortMe[sortKeys[i]]);
        }

        return output;
    }

    var prepareVolPerSecInfo = function(layerNum){
        var z = GCODE.renderer.getZ(layerNum);
        var layerSpeeds = GCODE.gCodeReader.getModelInfo().extrusionSpeedsByLayer;
        var max = GCODE.gCodeReader.getModelInfo().max;
        var min = GCODE.gCodeReader.getModelInfo().min;
        var gCodeOptions = GCODE.gCodeReader.getOptions();
        var output = [];
        var sortMe = {};
        var sortKeys = [];
        var i;
        var spd;
        var scale

        output.push("Extrude speeds in mm^3/sec:");
        for(i=0;i<layerSpeeds[z].length;i++){
            if(typeof(layerSpeeds[z][i])==='undefined'){continue;}

            spd = parseFloat(layerSpeeds[z][i]);
            scale = (spd - min.extrSpeed)/(max.extrSpeed-min.extrSpeed);
            if(!gCodeOptions.volumetricE) {
                spd *= Math.PI * Math.pow(gCodeOptions.filamentDia / 2, 2);
            }
            spd = spd.toFixed(1);
            sortMe[spd] = "<div id='colorBox"+i+"' class='colorBox' style='background-color: " + GCODE.renderer.getGradientColor(scale) + "'></div>  = " + spd +"mm^3/sec";
        }
        sortKeys = Object.keys(sortMe).sort((a, b) => b - a);
        for(i=0;i<sortKeys.length;i++) {
            output.push(sortMe[sortKeys[i]]);
        }

        return output;
    }


    var printLayerInfo = function(layerNum){
        var z = GCODE.renderer.getZ(layerNum);
        var segments = GCODE.renderer.getLayerNumSegments(layerNum);
        var renderOptions = GCODE.renderer.getOptions();
        var filament = GCODE.gCodeReader.getLayerFilament(z);
        var tempNoozle = GCODE.gCodeReader.getNozzleTemp(layerNum);
        var tempBed = GCODE.gCodeReader.getBedTemp(layerNum);
        var tempUnit = GCODE.gCodeReader.getTemperatureUnit();
        var output = [];

        var aggFilamentUsed = 0.0;
        for (var x = 0; x <= layerNum; x++) {
          layerFilament = GCODE.gCodeReader.getLayerFilament(GCODE.renderer.getZ(x))
          if (layerFilament) {
            aggFilamentUsed += parseFloat(layerFilament.toFixed(2));
          }
        }
        aggFilamentUsed = aggFilamentUsed.toFixed(2)

        output.push("Layer number: " + layerNum);
        output.push("Layer height (mm): " + z);
        output.push("Nozzle temp: " + tempNoozle);
        output.push("Bed temp: " + tempBed);
        output.push("Temperature unit: " + tempUnit);
        output.push("GCODE commands in layer: " + segments);
        output.push("Filament used by layer (mm): " + filament.toFixed(2));
        output.push("Filament used, summed (mm): " + aggFilamentUsed);
        output.push("Print time for layer: " + parseFloat(GCODE.gCodeReader.getModelInfo().printTimeByLayer[z]).toFixed(1) + "sec");

        if(renderOptions['speedDisplayType'] === displayType.speed){
            var res = prepareSpeedsInfo(layerNum);
            output = output.concat(res);
        }else if(renderOptions['speedDisplayType'] === displayType.expermm){
            var res = prepareExPerMMInfo(layerNum);
            output = output.concat(res);
        }else if(renderOptions['speedDisplayType'] === displayType.volpersec){
            var res = prepareVolPerSecInfo(layerNum);
            output = output.concat(res);
        }

        $('#layerInfo').html(output.join('<br>'));
//        chooseAccordion('layerAccordionTab');
    };

    var printModelInfo = function(){
        var resultSet = [];
        var modelInfo = GCODE.gCodeReader.getModelInfo();
        var gCodeOptions = GCODE.gCodeReader.getOptions();

		let totalFilament = modelInfo.totalFilament;
		let totalWeight = modelInfo.totalWeight;
		let filamentByExtruder = modelInfo.filamentByExtruder;
		if(gCodeOptions.volumetricE) {
			let fCrossSection = Math.PI * Math.pow(gCodeOptions.filamentDia / 2.0, 2);
			totalFilament /= fCrossSection;
			totalWeight /= fCrossSection;
			for(let k in filamentByExtruder) filamentByExtruder[k] /= fCrossSection;
		}

        resultSet.push("Model size is: " + modelInfo.modelSize.x.toFixed(2) + 'x' + modelInfo.modelSize.y.toFixed(2) + 'x' + modelInfo.modelSize.z.toFixed(2)+'mm<br>');
        resultSet.push("Total filament used: " + totalFilament.toFixed(2) + "mm<br>");
        resultSet.push("Total filament weight used: " + totalWeight.toFixed(2) + "grams<br>");
        var i = 0, tmp = [];
        for(var key in modelInfo.filamentByExtruder){
            i++;
            tmp.push("Filament for extruder '" + key + "': " + filamentByExtruder[key].toFixed(2) + "mm<br>");
        }
        if(i>1){
            resultSet.push(tmp.join(''));
        }
        resultSet.push("Estimated print time: " + parseInt(parseFloat(modelInfo.printTime)/60/60) + ":" + parseInt((parseFloat(modelInfo.printTime)/60)%60) + ":" + parseInt(parseFloat(modelInfo.printTime)%60) + "<br>");
        resultSet.push("Estimated layer height: " + modelInfo.layerHeight.toFixed(2) + "mm<br>");
        resultSet.push("Layer count: " + modelInfo.layerCnt.toFixed(0) + "printed, " + modelInfo.layerTotal.toFixed(0) + 'visited<br>');
        resultSet.push("Time cost: " + (modelInfo.printTime*gCodeOptions.hourlyCost/60/60).toFixed(2) + '<br>');
        resultSet.push("Filament cost: " + (totalWeight*gCodeOptions.filamentPrice).toFixed(2) + '<br>');

        document.getElementById('list').innerHTML =  resultSet.join('');
    };

    var handleFileSelect = function(evt) {
//        console.log("handleFileSelect");
        evt.stopPropagation();
        evt.preventDefault();

        var files = evt.dataTransfer?evt.dataTransfer.files:evt.target.files; // FileList object.

        var output = [];
        for (var i = 0, f; f = files[i]; i++) {
            if(f.name.toLowerCase().match(/^.*\.(?:gcode|g|txt|gco|gx)$/)){
                output.push('<li>File extensions suggests GCODE</li>');
            }else{
                output.push('<li><strong>You should only upload *.gcode files! I will not work with this one!</strong></li>');
                document.getElementById('errorList').innerHTML = '<ul>' + output.join('') + '</ul>';
                return;
            }

            reader = new FileReader();
            reader.onload = function(theFile){
                chooseAccordion('progressAccordionTab');
                setProgress('loadProgress', 0);
                setProgress('analyzeProgress', 0);
//                myCodeMirror.setValue(theFile.target.result);
                GCODE.gCodeReader.loadFile(theFile);
                if(showGCode){
                    myCodeMirror.setValue(theFile.target.result);
                }else{
                    myCodeMirror.setValue("GCode view is disabled. You can enable it in 'GCode analyzer options' section.")
                }

            };
            reader.readAsText(f);
        }
    };

    var handleDragOver = function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.target.dropEffect = 'copy'; // Explicitly show this is a copy.
    };

    var initSliders = function(){
//        var prevX=0;
//        var prevY=0;
        var handle;
        sliderVer =  $( "#slider-vertical" );
        sliderHor = $( "#slider-horizontal" );

        var onLayerChange = function(val){
            var progress = GCODE.renderer.getLayerNumSegments(val)-1;
            GCODE.renderer.render(val,0, progress);
            sliderHor.slider({max: progress, values: [0,progress]});
            setLinesColor(false); //clear current selection
            gCodeLines = GCODE.gCodeReader.getGCodeLines(val, sliderHor.slider("values",0), sliderHor.slider("values",1));
            setLinesColor(true); // highlight lines
            printLayerInfo(val);
        };

        sliderVer.slider({
            orientation: "vertical",
            range: "min",
            min: 0,
            max: GCODE.renderer.getModelNumLayers()-1,
            value: 0,
            slide: function( event, ui ) {
                onLayerChange(ui.value);
            }
        });

        //this stops slider reacting to arrow keys, since we do it below manually
        $( "#slider-vertical").find(".ui-slider-handle" ).unbind('keydown');

        sliderHor.slider({
            orientation: "horizontal",
            range: "min",
            min: 0,
            max: GCODE.renderer.getLayerNumSegments(0)-1,
            values: [0,GCODE.renderer.getLayerNumSegments(0)-1],
            slide: function( event, ui ) {
                setLinesColor(false); //clear current selection
                gCodeLines = GCODE.gCodeReader.getGCodeLines(sliderVer.slider("value"),ui.values[0], ui.values[1]);
                setLinesColor(true); // highlight lines
                GCODE.renderer.render(sliderVer.slider("value"), ui.values[0], ui.values[1]);
            }
        });

        window.onkeydown = function (event){
            if(event.keyCode === 38 || event.keyCode === 33){
                if(sliderVer.slider('value') < sliderVer.slider('option', 'max')){
                    sliderVer.slider('value', sliderVer.slider('value')+1);
                    onLayerChange(sliderVer.slider('value'));
                }
            }else if(event.keyCode === 40 || event.keyCode === 34){
                if(sliderVer.slider('value') > 0){
                    sliderVer.slider('value', sliderVer.slider('value')-1);
                    onLayerChange(sliderVer.slider('value'));
                }
            }
            event.stopPropagation()
        }
    };

    var processMessage = function(e){
        var data = e.data;
        switch (data.cmd) {
            case 'returnModel':
                setProgress('loadProgress', 100);
                GCODE.ui.worker.postMessage({
                        "cmd":"analyzeModel",
                        "msg":{
                        }
                    }
                );
                break;
            case 'analyzeDone':
//                var resultSet = [];

                setProgress('analyzeProgress',100);
                GCODE.gCodeReader.processAnalyzeModelDone(data.msg);
                GCODE.gCodeReader.passDataToRenderer();
                initSliders();
                printModelInfo();
                printLayerInfo(0);
                chooseAccordion('infoAccordionTab');
                GCODE.ui.updateOptions();
                $('#myTab').find('a[href="#tab2d"]').tab('show');
                $('#runAnalysisButton').removeClass('disabled');
                break;
            case 'returnLayer':
                GCODE.gCodeReader.processLayerFromWorker(data.msg);
                setProgress('loadProgress',data.msg.progress);
                break;
            case 'returnMultiLayer':
                GCODE.gCodeReader.processMultiLayerFromWorker(data.msg);
                setProgress('loadProgress',data.msg.progress);
                break;
            case "analyzeProgress":
                setProgress('analyzeProgress',data.msg.progress);
                break;
            default:
                console.log("default msg received" + data.cmd);
        }
    };

    var checkCapabilities = function(){
        var warnings = [];
        var fatal = [];

        Modernizr.addTest('filereader', function () {
            return !!(window.File && window.FileList && window.FileReader);
        });

        if(!Modernizr.canvas)fatal.push("<li>Your browser doesn't seem to support HTML5 Canvas, this application won't work without it.</li>");
        if(!Modernizr.filereader)fatal.push("<li>Your browser doesn't seem to support HTML5 File API, this application won't work without it.</li>");
        if(!Modernizr.webworkers)fatal.push("<li>Your browser doesn't seem to support HTML5 Web Workers, this application won't work without it.</li>");
        if(!Modernizr.svg)fatal.push("<li>Your browser doesn't seem to support HTML5 SVG, this application won't work without it.</li>");

        if(fatal.length>0){
            document.getElementById('errorList').innerHTML = '<ul>' + fatal.join('') + '</ul>';
            console.log("Initialization failed: unsupported browser.");
            return false;
        }

        if(!Modernizr.webgl){
            warnings.push("<li>Your browser doesn't seem to support HTML5 Web GL, 3d mode is not recommended, going to be SLOW!</li>");
            GCODE.renderer3d.setOption({rendererType: "canvas"});
        }
        if(!Modernizr.draganddrop)warnings.push("<li>Your browser doesn't seem to support HTML5 Drag'n'Drop, Drop area will not work.</li>");

        if(warnings.length>0){
            document.getElementById('errorList').innerHTML = '<ul>' + warnings.join('') + '</ul>';
            console.log("Initialization succeeded with warnings.")
        }
        return true;
    };


    return {
        worker: undefined,
        initHandlers: function(){
            var capabilitiesResult = checkCapabilities();
            if(!capabilitiesResult){
                return;
            }
            var dropZone = document.getElementById('drop_zone');
            dropZone.addEventListener('dragover', handleDragOver, false);
            dropZone.addEventListener('drop', handleFileSelect, false);

            document.getElementById('file').addEventListener('change', handleFileSelect, false);

            setProgress('loadProgress', 0);
            setProgress('analyzeProgress', 0);

            $(".collapse").collapse({parent: '#accordion2'});

            $('#myTab').find('a[href="#tab3d"]').click(function (e) {
                e.preventDefault();
                console.log("Switching to 3d mode");
                $(this).tab('show');
                GCODE.renderer3d.doRender();
            });

            $('#myTab').find('a[href="#tabGCode"]').click(function (e) {
                e.preventDefault();
                console.log("Switching to GCode preview mode");
                $(this).tab('show');
                myCodeMirror.refresh();
                console.log(gCodeLines);
                myCodeMirror.setCursor(Number(gCodeLines.first),0);
//                myCodeMirror.setSelection({line:Number(gCodeLines.first),ch:0},{line:Number(gCodeLines.last),ch:0});
                myCodeMirror.focus();
            });

            this.worker = new Worker('js/Worker.js');

            this.worker.addEventListener('message', processMessage, false);

            GCODE.ui.processOptions();
            GCODE.renderer.render(0,0);

            console.log("Application initialized");

            myCodeMirror = new CodeMirror( document.getElementById('gCodeContainer'), {
                lineNumbers: true,
                gutters: ['CodeMirror-linenumbers']
            });
            myCodeMirror.setSize("680","640");
//            console.log(myCodeMirror);
            chooseAccordion('fileAccordionTab');

            (function() {
                var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                    window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
                window.requestAnimationFrame = requestAnimationFrame;
            })();

            if(window.location.search.match(/new/)){
                $('#errAnalyseTab').removeClass('hide');
            }
			var InFilemame = new RegExp('[\?&]filename=([^&#]*)').exec(window.location.href);
			var ValidFilename = !/[^a-z0-9_.@()-]/i.test(InFilemame[1]);
			if(ValidFilename === false) InFilemame = null;
			if(InFilemame !== null){
				var LocalGCODE = $.get( "gcode\\" + InFilemame[1], "", null, "text")
				.done(function() {
					var theFile = [];
					chooseAccordion('progressAccordionTab');
					setProgress('loadProgress', 0);
					setProgress('analyzeProgress', 0);
					theFile.target = [];
					theFile.target.result = LocalGCODE.responseText;
					LocalGCODE.responseText = null;
					GCODE.gCodeReader.loadFile(theFile);
				})
				.fail(function() {
					alert( "Error loading GCODE file!" );					
				});
			}

        },

        processOptions: function(){
			GCODE.gCodeReader.setOption({
				sortLayers: document.getElementById('sortLayersCheckbox').checked,
				purgeEmptyLayers: document.getElementById('purgeEmptyLayersCheckbox').checked,
				volumetricE: document.getElementById('volumetricE').checked,

				filamentDia: Number($('#filamentDia').val()) || 1.75,
				nozzleDia: Number($('#nozzleDia').val()) || 0.4,
				hourlyCost: Number($('#hourlyCost').val()) || 1.0,
				filamentPrice: Number($('#filamentPrice').val()) || 0.05,

				filamentType: document.getElementById('plasticABS').checked ? 'ABS' : 'PLA',
			});

			GCODE.renderer.setOption({
				moveModel: document.getElementById('moveModelCheckbox').checked,
				showMoves: document.getElementById('showMovesCheckbox').checked,
				showRetracts: document.getElementById('showRetractsCheckbox').checked,
				differentiateColors: document.getElementById('differentiateColorsCheckbox').checked,
				actualWidth: document.getElementById('thickExtrusionCheckbox').checked,
				alpha: document.getElementById('alphaCheckbox').checked,
				showNextLayer: document.getElementById('showNextLayer').checked,
			});

            showGCode = document.getElementById('showGCodeCheckbox').checked;

            if(document.getElementById('renderErrors').checked){
                GCODE.renderer.setOption({
					showMoves: false,
					showRetracts: false,
					renderAnalysis: true,
					actualWidth: true,
				});
            }
            else GCODE.renderer.setOption({renderAnalysis: false});

            if(document.getElementById('speedDisplayRadio').checked)GCODE.renderer.setOption({speedDisplayType: displayType.speed});
            if(document.getElementById('exPerMMRadio').checked)GCODE.renderer.setOption({speedDisplayType: displayType.expermm});
            if(document.getElementById('volPerSecRadio').checked)GCODE.renderer.setOption({speedDisplayType: displayType.volpersec});
            if(GCODE.gCodeReader.getModelInfo().layerTotal > 0){
                printModelInfo();
                printLayerInfo($( "#slider-vertical" ).slider("value"));
            }
        },

        updateOptions: function(){
            var gcodeOptions = GCODE.gCodeReader.getOptions();

            document.getElementById('nozzleDia').value = gcodeOptions['nozzleDia'];
            document.getElementById('filamentDia').value = gcodeOptions['filamentDia'];
        },

        resetSliders: function(){
            initSliders();
        },

        setOption: function(options){
            for(var opt in options){
                uiOptions[opt] = options[opt];
            }
        }
    }
}());
