/**
 * User: hudbrog (hudbrog@gmail.com)
 * Date: 10/24/12
 * Time: 12:18 PM
 */

var GCODE = {}

GCODE.worker = (function(){
    var gcode;
    var firstReport;
    var z_heights = {};
    var model = [];
    var gCodeOptions = {
        sortLayers: false,
        purgeEmptyLayers: true,
        analyzeModel: false
    };
    var max = {x: undefined, y: undefined, z: undefined};
    var min = {x: undefined, y: undefined, z: undefined};
    var modelSize = {x: undefined, y: undefined, z: undefined};
    var filamentByLayer = {};
    var totalFilament=0;
    var printTime=0;


    var sendLayerToParent = function(layerNum, z, progress){
        self.postMessage({
            "cmd": "returnLayer",
            "msg": {
                cmds: model[layerNum],
                layerNum: layerNum,
                zHeightObject: {zValue: z, layer: z_heights[z]},
                isEmpty: false,
                progress: progress
            }
        });
    };

    var sendSizeProgress = function(progress){
        self.postMessage({
            "cmd": "analyzeProgress",
            "msg": {
                progress: progress,
                printTime: printTime
            }
        });
    };

    var sendAnalyzeDone = function(){
        self.postMessage({
            "cmd": "analyzeDone",
            "msg": {
                max: max,
                min: min,
                modelSize: modelSize,
                totalFilament:totalFilament,
                filamentByLayer: filamentByLayer,
                printTime: printTime
            }
        });
    };


    var analyzeSize = function(){
        var i,j;
        var x_ok=false, y_ok=false;
        var cmds;
//        var moveTime=0;

        for(i=0;i<model.length;i++){
            cmds = model[i];
            if(!cmds)continue;
            for(j=0;j<cmds.length;j++){
                x_ok=false;
                y_ok=false;
                if(typeof(cmds[j].x) !== 'undefined'&&typeof(cmds[j].prevX) !== 'undefined'&&typeof(cmds[j].extrude) !== 'undefined')
                {
                    max.x = parseFloat(max.x)>parseFloat(cmds[j].x)?parseFloat(max.x):parseFloat(cmds[j].x);
                    max.x = parseFloat(max.x)>parseFloat(cmds[j].prevX)?parseFloat(max.x):parseFloat(cmds[j].prevX);
                    min.x = parseFloat(min.x)<parseFloat(cmds[j].x)?parseFloat(min.x):parseFloat(cmds[j].x);
                    min.x = parseFloat(min.x)<parseFloat(cmds[j].prevX)?parseFloat(min.x):parseFloat(cmds[j].prevX);
                    x_ok=true;
                }

                if(typeof(cmds[j].y) !== 'undefined'&&typeof(cmds[j].prevY) !== 'undefined'&&typeof(cmds[j].extrude) !== 'undefined'){
                    max.y = parseFloat(max.y)>parseFloat(cmds[j].y)?parseFloat(max.y):parseFloat(cmds[j].y);
                    max.y = parseFloat(max.y)>parseFloat(cmds[j].prevY)?parseFloat(max.y):parseFloat(cmds[j].prevY);
                    min.y = parseFloat(min.y)<parseFloat(cmds[j].y)?parseFloat(min.y):parseFloat(cmds[j].y);
                    min.y = parseFloat(min.y)<parseFloat(cmds[j].prevY)?parseFloat(min.y):parseFloat(cmds[j].prevY);
                    y_ok=true;
                }

                if(typeof(cmds[j].prevZ) !== 'undefined'&&typeof(cmds[j].extrude) !== 'undefined'){
                    max.z = parseFloat(max.z)>parseFloat(cmds[j].prevZ)?parseFloat(max.z):parseFloat(cmds[j].prevZ);
                    min.z = parseFloat(min.z)<parseFloat(cmds[j].prevZ)?parseFloat(min.z):parseFloat(cmds[j].prevZ);
                }

                if(typeof(cmds[j].extrude) !== 'undefined'||cmds[j].retract!=0){
                    totalFilament+=cmds[j].extrusion;
                    if(!filamentByLayer[cmds[j].prevZ])filamentByLayer[cmds[j].prevZ]=0;
                    filamentByLayer[cmds[j].prevZ]+=cmds[j].extrusion;
                }

                if(x_ok&&y_ok){
                    printTime += Math.sqrt(Math.pow(parseFloat(cmds[j].x)-parseFloat(cmds[j].prevX),2)+Math.pow(parseFloat(cmds[j].y)-parseFloat(cmds[j].prevY),2))/(cmds[j].speed/60);
                }else if(cmds[j].retract!=0&&cmds[j].extrusion!=0){
                    printTime += Math.abs(parseFloat(cmds[j].extrusion)/(cmds[j].speed/60));
                }

            }
            sendSizeProgress(i/model.length*100);

        }
        modelSize.x = max.x - min.x;
        modelSize.y = max.y - min.y;
        modelSize.z = max.z - min.z;


        sendAnalyzeDone();
    };

    var doParse = function(){
        var argChar, numSlice;
        model=[];
        var sendLayer = false;
        var sendLayerZ = 0;
    //            console.time("parseGCode timer");
        var reg = new RegExp(/^(?:G0|G1)\s/i);
        var j, layer= 0, extrude=false, prevRetract= 0, retract=0, x, y, z, f, prevZ, prevX, prevY,lastF=4000, prev_extrude = {a: undefined, b: undefined, c: undefined, e: undefined, abs: undefined}, extrudeRelative=false;;

        for(var i=0;i<gcode.length;i++){
    //            for(var len = gcode.length- 1, i=0;i!=len;i++){
            x=undefined;
            y=undefined;
            z=undefined;


            extrude=false;
    //                prevRetract=0;
    //                retract=0;
    //                if(gcode[i].match(/^(?:G0|G1)\s+/i)){
            if(reg.test(gcode[i])){
                var args = gcode[i].split(/\s/);
                for(j=0;j<args.length;j++){
    //                        console.log(args);
    //                        if(!args[j])continue;
                    switch(argChar = args[j].charAt(0).toLowerCase()){
                        case 'x':
                            x=args[j].slice(1);
                            break;
                        case 'y':
                            y=args[j].slice(1);
                            break;
                        case 'z':
                            z=args[j].slice(1);
                            sendLayer = layer;
                            if(typeof(prevZ)!=="undefined"){sendLayerZ=prevZ;}
                            else {sendLayerZ = z;}
                            if(z_heights.hasOwnProperty(z)){
                                layer = z_heights[z];
                            }else{
                                layer = model.length;
                                z_heights[z] = layer;
                            }
    //                                if(parseFloat(prevZ) < )
    //                                if(args[j].charAt(1) === "-")layer--;
    //                                else layer++;
                            prevZ = z;
                            break;
                        case 'e'||'a'||'b'||'c':
                            numSlice = args[j].slice(1);
                            if(!extrudeRelative){
                                // absolute extrusion positioning
                                prev_extrude["abs"] = parseFloat(numSlice)-parseFloat(prev_extrude[argChar]);

                            }else{
                                prev_extrude["abs"] = parseFloat(numSlice);
                            }
                            extrude = prev_extrude["abs"]>0;
                            if(prev_extrude["abs"]<0){
                                prevRetract = -1;
                                retract = -1;
                            }
                            else if(prev_extrude["abs"]==0){
    //                                        if(prevRetract <0 )prevRetract=retract;
                                retract = 0;
                            }else if(prev_extrude["abs"]>0&&prevRetract < 0){
                                prevRetract = 0;
                                retract = 1;
                            } else {
    //                                        prevRetract = retract;
                                retract = 0;
                            }
                            prev_extrude[argChar] = numSlice;

                            break;
                        case 'f':
                            numSlice = args[j].slice(1);
                            lastF = numSlice;
                            break;
                        default:
                            break;
                    }
                }
                if(!model[layer])model[layer]=[];
                if(x !== undefined || y !== undefined ||z !== undefined||retract!=0) model[layer][model[layer].length] = {x: x, y: y, z: z, extrude: extrude, retract: retract, extrusion: (extrude||retract)?prev_extrude["abs"]:0, prevX: prevX, prevY: prevY, prevZ: prevZ, speed: lastF};
                if(x !== undefined) prevX = x;
                if(y !== undefined) prevY = y;
            } else if(gcode[i].match(/^(?:M82)/i)){
                extrudeRelative = false;
            }else if(gcode[i].match(/^(?:G91)/i)){
                extrudeRelative=true;
            }else if(gcode[i].match(/^(?:G90)/i)){
                extrudeRelative=false;
            }else if(gcode[i].match(/^(?:M83)/i)){
                extrudeRelative=true;
            }else if(gcode[i].match(/^(?:G92)/i)){
                var args = gcode[i].split(/\s/);
                for(j=0;j<args.length;j++){
                    switch(argChar = args[j].charAt(0).toLowerCase()){
                        case 'x':
                            x=args[j].slice(1);
                            break;
                        case 'y':
                            y=args[j].slice(1);
                            break;
                        case 'z':
                            z=args[j].slice(1);
                            prevZ = z;
                            break;
                        case 'e'||'a'||'b'||'c':
                            numSlice = args[j].slice(1);
                            if(!extrudeRelative)
                                prev_extrude[argChar] = 0;
                            else {
                                prev_extrude[argChar] = numSlice;
                            }
                            break;
                        default:
                            break;
                    }
                }
                if(!model[layer])model[layer]=[];
                if(typeof(x) !== 'undefined' || typeof(y) !== 'undefined' ||typeof(z) !== 'undefined') model[layer][model[layer].length] = {x: x, y: y, z: z, extrude: extrude, retract: retract, noMove: true, extrusion: (extrude||retract)?prev_extrude["abs"]:0, prevX: prevX, prevY: prevY, prevZ: prevZ, speed: lastF};
            }else if(gcode[i].match(/^(?:G28)/i)){
                x=0, y=0,z=0,prevZ=0, extrude=false;
                if(typeof(prevX) === 'undefined'){prevX=0;}
                if(typeof(prevY) === 'undefined'){prevY=0;}

                if(!model[layer])model[layer]=[];
                if(typeof(x) !== 'undefined' || typeof(y) !== 'undefined' ||typeof(z) !== 'undefined') model[layer][model[layer].length] = {x: x, y: y, z: z, extrude: extrude, retract: retract, extrusion: (extrude||retract)?prev_extrude["abs"]:0, prevX: prevX, prevY: prevY, prevZ: prevZ, speed: lastF};
            }
            if(typeof(sendLayer) !== "undefined"){
                sendLayerToParent(sendLayer, sendLayerZ, i/gcode.length*100);
                sendLayer = undefined;
            }
        }
//            if(gCodeOptions["sortLayers"])sortLayers();
//            if(gCodeOptions["purgeEmptyLayers"])purgeLayers();

    };


    return {
        parseGCode: function(message){
            gcode = message.gcode;
            firstReport = message.options.firstReport;


            doParse();
            self.postMessage({
                "cmd": "returnModel",
                "msg": {
//                    model: model
                }
            });

        },
        runAnalyze: function(message){
            analyzeSize();
        },
        setOption: function(options){
            for(var opt in options){
                gCodeOptions[opt] = options[opt];
            }
        }
    }
}());


onmessage = function (e){
    var data = e.data;

    switch (data.cmd) {
        case 'parseGCode':
            GCODE.worker.parseGCode(data.msg);
            break;
        case 'setOption':
            GCODE.worker.setOption(data.msg);
            break;
        case 'analyzeModel':
            GCODE.worker.runAnalyze(data.msg);
            break;

        default:
            self.postMessage('Unknown command: ' + data.msg);
    }

};
