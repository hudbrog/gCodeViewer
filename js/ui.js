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

    var setProgress = function(id, progress){
        $('#'+id).width(parseInt(progress)+'%');
        $('#'+id).text(parseInt(progress)+'%');

    };

    var chooseAccordion = function(id){
        $('#'+id).collapse("show");
    };

    var setLinesColor = function(toggle){
        var i=0;
        for(i=gCodeLines.first;i<gCodeLines.last; i++){
            if(toggle){
                myCodeMirror.setLineClass(Number(i), null, "activeline");
            }else{
                myCodeMirror.setLineClass(Number(i), null, null);
            }
        }
    }

    var printLayerInfo = function(layerNum){
        var z = GCODE.renderer.getZ(layerNum);
        var segments = GCODE.renderer.getLayerNumSegments(layerNum);
        var filament = GCODE.gCodeReader.getLayerFilament(z);
        var layerSpeeds = GCODE.gCodeReader.getLayerSpeeds(z);
        var renderOptions = GCODE.renderer.getOptions();
        var colors = renderOptions["colorLine"];
        var speedIndex = 0;
        var showMove=false;
        var i = 0;
        var output = [], retractOutput = [], moveOutput = [];
        output.push("Layer number: " + layerNum);
        output.push("Layer height (mm): " + z);
        output.push("GCODE commands in layer: " + segments);
        output.push("Filament used by layer (mm): " + filament.toFixed(2));
        output.push("Extrude speeds:");
        moveOutput.push("Move speeds:");
        retractOutput.push("Retract speeds:");
        for(i=0;i<layerSpeeds.length;i++){
            if(typeof(layerSpeeds[i])==='undefined'){
                continue;
            }
            speedIndex = i;
            if(speedIndex > colors.length -1){
                speedIndex = speedIndex % (colors.length-1);
            }
            if(layerSpeeds[i]["type"]==='move'){
                moveOutput.push("<div id='colorBox"+i+"' class='colorBox' style='background-color: "+renderOptions['colorMove'] + "'></div>  = " + (parseFloat(layerSpeeds[i]["speed"])/60).toFixed(2)+"mm/s");
            }else if(layerSpeeds[i]["type"]==='retract'){
                retractOutput.push("<span style='color: " + renderOptions['colorRetract'] +"'>*</span> = " +(parseFloat(layerSpeeds[i]["speed"])/60).toFixed(2)+"mm/s");
            }else if(layerSpeeds[i]["type"]==='extrude'){
                output.push("<div id='colorBox"+i+"' class='colorBox' style='background-color: "+colors[speedIndex] + "'></div>  = " + (parseFloat(layerSpeeds[i]["speed"])/60).toFixed(2)+"mm/s");
            }else {
                output.push("Found a speed info of unknown type! This is a bug!");
            }
        }
        $('#layerInfo').html((output.concat(moveOutput, retractOutput)).join('<br>'));
        chooseAccordion('layerAccordionTab');
    };

    var handleFileSelect = function(evt) {
        console.log("handleFileSelect");
        evt.stopPropagation();
        evt.preventDefault();

        var files = evt.dataTransfer?evt.dataTransfer.files:evt.target.files; // FileList object.

        var output = [];
        for (var i = 0, f; f = files[i]; i++) {
            if(f.name.toLowerCase().match(/^.*\.(?:gcode|g|txt)$/)){
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
                myCodeMirror.setValue(theFile.target.result);
                GCODE.gCodeReader.loadFile(theFile);
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
        var prevX=0;
        var prevY=0;
        var handle;
        sliderVer =  $( "#slider-vertical" );
        sliderHor = $( "#slider-horizontal" );

        sliderVer.slider({
            orientation: "vertical",
            range: "min",
            min: 0,
            max: GCODE.renderer.getModelNumLayers()-1,
            value: 0,
            slide: function( event, ui ) {
                var progress = GCODE.renderer.getLayerNumSegments(ui.value)-1;
                GCODE.renderer.render(ui.value, progress);
                sliderHor.slider({max: progress, value: progress});
                setLinesColor(false); //clear current selection
                gCodeLines = GCODE.gCodeReader.getGCodeLines(ui.value, sliderHor.slider("value"));
                setLinesColor(true); // highlight lines
                printLayerInfo(ui.value);
            }
        });

        sliderHor.slider({
            orientation: "horizontal",
            range: "min",
            min: 0,
            max: GCODE.renderer.getLayerNumSegments(0)-1,
            value: GCODE.renderer.getLayerNumSegments(0)-1,
            slide: function( event, ui ) {
                setLinesColor(false); //clear current selection
                gCodeLines = GCODE.gCodeReader.getGCodeLines(sliderVer.slider("value"),ui.value);
                setLinesColor(true); // highlight lines
                GCODE.renderer.render(sliderVer.slider("value"), ui.value);
            }
        });
    };

    var processMessage = function(e){
        var data = e.data;
        switch (data.cmd) {
            case 'returnModel':
                setProgress('loadProgress', 100);
                worker.postMessage({
                        "cmd":"analyzeModel",
                        "msg":{
                        }
                    }
                );
                break;
            case 'analyzeDone':
                var resultSet = [];

                setProgress('analyzeProgress',100);
                GCODE.gCodeReader.processAnalyzeModelDone(data.msg);
                GCODE.gCodeReader.passDataToRenderer();
                initSliders();
                resultSet.push("Model size is: " + data.msg.modelSize.x.toFixed(2) + 'x' + data.msg.modelSize.y.toFixed(2) + 'x' + data.msg.modelSize.z.toFixed(2)+'mm<br>');
                resultSet.push("Total filament used: " + data.msg.totalFilament.toFixed(2) + "mm<br>");
                resultSet.push("Estimated print time: " + parseInt(parseFloat(data.msg.printTime)/60) + ":" + parseInt(parseFloat(data.msg.printTime)%60).toPrecision(2) + "<br>");
                resultSet.push("Estimated layer height: " + data.msg.layerHeight.toFixed(2) + "mm<br>");
                resultSet.push("Layer count: " + data.msg.layerCnt.toFixed(0) + "printed, " + data.msg.layerTotal.toFixed(0) + 'visited<br>');
                document.getElementById('list').innerHTML =  resultSet.join('');
                chooseAccordion('infoAccordionTab');

                break;
            case 'returnLayer':
                GCODE.gCodeReader.processLayerFromWorker(data.msg);
                setProgress('loadProgress',data.msg.progress);

                break;
            case "analyzeProgress":
                setProgress('analyzeProgress',data.msg.progress);
                break;
            default:
                console.log("default msg received" + data);
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
            console.log("Initialization failed: unsupported browser.")
            return false;
        }

        if(!Modernizr.webgl){
            warnings.push("<li>Your browser doesn't seem to support HTML5 Web GL, 3d mode is not recommended, going to be SLOW!</li>");
            GCODE.renderer3d.setOption({rendererType: "canvas"});
        }
        if(!Modernizr.draganddrop)warnings.push("<li>Your browser doesn't seem to support HTML5 Drag'n'Drop, Drop area will not work.</li>");

        if(warnings.length>0){
            document.getElementById('errorList').innerHTML = '<ul>' + wanings.join('') + '</ul>';
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

            $('#myTab a[href="#tab3d"]').click(function (e) {
                e.preventDefault();
                console.log("Switching to 3d mode");
                $(this).tab('show');
                GCODE.renderer3d.doRender();
            });

            $('#myTab a[href="#tabGCode"]').click(function (e) {
                e.preventDefault();
                console.log("Switching to GCode preview mode");
                $(this).tab('show');
                myCodeMirror.refresh();
                console.log(gCodeLines);
                myCodeMirror.setCursor(Number(gCodeLines.first),0);
//                myCodeMirror.setSelection({line:Number(gCodeLines.first),ch:0},{line:Number(gCodeLines.last),ch:0});
                myCodeMirror.focus();
            });

            worker = new Worker('js/Worker.js');

            worker.addEventListener('message', processMessage, false);

            GCODE.ui.processOptions();
            GCODE.renderer.render(0,0);

            console.log("Application initialized");

            myCodeMirror = new CodeMirror( document.getElementById('gCodeContainer'), {
                lineNumbers: true,
                gutters: ['CodeMirror-linenumbers']
            });
            myCodeMirror.setSize("680","640");
            console.log(myCodeMirror);


        },

        ArrayIndexOf: function(a, fnc) {
            if (!fnc || typeof (fnc) != 'function') {
                return -1;
            }
            if (!a || !a.length || a.length < 1) return -1;
            for (var i = 0; i < a.length; i++) {
                if(!a[i]) continue;
                if (fnc(a[i])) return i;
            }
            return -1;
        },

        processOptions: function(){
            if(document.getElementById('sortLayersCheckbox').checked)GCODE.gCodeReader.setOption({sortLayers: true});
            else GCODE.gCodeReader.setOption({sortLayers: false});

            if(document.getElementById('purgeEmptyLayersCheckbox').checked)GCODE.gCodeReader.setOption({purgeEmptyLayers: true});
            else GCODE.gCodeReader.setOption({purgeEmptyLayers: false});

            if(document.getElementById('analyzeModelCheckbox').checked)GCODE.gCodeReader.setOption({analyzeModel: true});
            else GCODE.gCodeReader.setOption({analyzeModel: false});


//            if(document.getElementById('sortLayersCheckbox').checked) worker.postMessage({"cmd":"setOption", "msg":{sortLayers: true}});
//            else  worker.postMessage({"cmd":"setOption", "msg":{sortLayers: false}});
//
//            if(document.getElementById('purgeEmptyLayersCheckbox').checked)worker.postMessage({"cmd":"setOption", "msg":{purgeEmptyLayers: true}});
//            else worker.postMessage({"cmd":"setOption", "msg":{purgeEmptyLayers: false}});

            if(document.getElementById('analyzeModelCheckbox').checked)worker.postMessage({"cmd":"setOption", "msg":{analyzeModel: true}});
            else worker.postMessage({"cmd":"setOption", "msg":{analyzeModel: false}});


            if(document.getElementById('moveModelCheckbox').checked)GCODE.renderer.setOption({moveModel: true});
            else GCODE.renderer.setOption({moveModel: false});

            if(document.getElementById('showMovesCheckbox').checked)GCODE.renderer.setOption({showMoves: true});
            else GCODE.renderer.setOption({showMoves: false});

            if(document.getElementById('showRetractsCheckbox').checked)GCODE.renderer.setOption({showRetracts: true});
            else GCODE.renderer.setOption({showRetracts: false});

            if(document.getElementById('differentiateColorsCheckbox').checked)GCODE.renderer.setOption({differentiateColors: true});
            else GCODE.renderer.setOption({differentiateColors: false});
        }
    }
}());