/**
 * User: hudbrog (hudbrog@gmail.com)
 * Date: 10/21/12
 * Time: 7:31 AM
 */

GCODE.gCodeReader = (function(){
// ***** PRIVATE ******
    var gcode, lines;
    var z_heights = {};
    var model = [];
    var max = {x: undefined, y: undefined, z: undefined};
    var min = {x: undefined, y: undefined, z: undefined};
    var modelSize = {x: undefined, y: undefined, z: undefined};
    var filamentByLayer = {};
    var totalFilament=0;
    var gCodeOptions = {
        sortLayers: false,
        purgeEmptyLayers: true,
        analyzeModel: false
    };

    var prepareGCode = function(){
        if(!lines)return;
        gcode = [];
        var i;
        for(i=0;i<lines.length;i++){
            if(lines[i].match(/^(G0|G1|G90|G91|G92|M82|M83|G28)/i))gcode.push(lines[i]);
        }
        lines = [];
        console.log("GCode prepared");
    };

    var sortLayers = function(){
        var sortedZ = [];
        var tmpModel = [];
        var i;

        for(var layer in z_heights){
            sortedZ[z_heights[layer]] = layer;
        }
        sortedZ.sort(function(a,b){
            return a-b;
        });
        for(i=0;i<sortedZ.length;i++){
            tmpModel[i] = model[z_heights[sortedZ[i]]];
        }
        model = tmpModel;
        delete tmpModel;
    };

    var purgeLayers = function(){
        var purge=true;
        if(!model){
            console.log("Something terribly wring just happened.");
            return;
        }
        for(var i=0;i<model.length;i++){
            purge=true;
            if(!model[i])purge=true;
            else {
                for(var j=0;j<model[i].length;j++){
                    if(model[i][j].extrude)purge=false;
                }
            }
            if(purge){
                model.splice(i,1);
                i--;
            }
        }
    };


// ***** PUBLIC *******
    return {

        loadFile: function(reader){
            console.log("loadFile");
            model = [];
            z_heights = [];

            var str = reader.target.result;
            lines = str.split(/(\r\n|\n)+/);
            prepareGCode();

            worker.postMessage({
                    "cmd":"parseGCode",
                    "msg":{
                        gcode: gcode,
                        options: {
                            firstReport: 5
                        }
                    }
                }
            );


        },
        setOption: function(options){
            for(var opt in options){
                gCodeOptions[opt] = options[opt];
            }
        },
        passDataToRenderer: function(mdl){
//            model = mdl;
//            console.log(z_heights);
            if(gCodeOptions["sortLayers"])sortLayers();
            if(gCodeOptions["purgeEmptyLayers"])purgeLayers();
            GCODE.renderer.doRender(model, 0);
            GCODE.renderer3d.setModel(model);
            worker.postMessage({
                    "cmd":"analyzeModel",
                    "msg":{
                    }
                }
            );

        },
        processLayerFromWorker: function(msg){
            var cmds = msg.cmds;
            var layerNum = msg.layerNum;
            var zHeightObject = msg.zHeightObject;
            var isEmpty = msg.isEmpty;
//            console.log(zHeightObject);
            model[layerNum] = cmds;
            z_heights[zHeightObject.zValue] = zHeightObject.layer;
//            GCODE.renderer.doRender(model, layerNum);

        },
        processAnalyzeModelDone: function(msg){
            min = msg.min;
            max = msg.max;
            modelSize = msg.modelSize;
            totalFilament = msg.totalFilament;
            filamentByLayer = msg.filamentByLayer;
        },
        getLayerFilament: function(z){
            return filamentByLayer[z];
        }
    }
}());
