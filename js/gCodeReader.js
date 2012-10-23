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
    var gCodeOptions = {
        sortLayers: false,
        purgeEmptyLayers: true
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
            var str = reader.target.result;
            lines = str.split(/(\r\n|\n)+/);
            prepareGCode();
        },
        setOption: function(options){
            for(var opt in options){
                gCodeOptions[opt] = options[opt];
            }
        },
        parseGCode: function(){
            var argChar, numSlice;
            model=[];
//            console.time("parseGCode timer");
            var reg = new RegExp(/^(?:G0|G1)\s/i);
            var j, layer= 0, extrude=false, prevRetract= 0, retract=0, x, y, z, prevZ=-999, prev_extrude = {a: undefined, b: undefined, c: undefined, e: undefined, abs: undefined}, extrudeRelative=false;;

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
                            default:
                                break;
                        }
                    }
                    if(!model[layer])model[layer]=[];
                    if(x !== undefined || y !== undefined ||z !== undefined||retract!=0) model[layer][model[layer].length] = {x: x, y: y, z: z, extrude: extrude, retract: retract};
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
                    if(x !== undefined || y !== undefined ||z !== undefined) model[layer][model[layer].length] = {x: x, y: y, z: z, extrude: extrude, retract: retract, noMove: true};
                }else if(gcode[i].match(/^(?:G28)/i)){
                    x=0, y=0,z=0,prevZ=0, extrude=false;
                    if(!model[layer])model[layer]=[];
                    if(x !== undefined || y !== undefined ||z !== undefined) model[layer][model[layer].length] = {x: x, y: y, z: z, extrude: extrude, retract: retract};
                }
            }
//            console.timeEnd("parseGCode timer");
            console.log(gcode.length);
            console.log("GCode parsed");
            if(gCodeOptions["sortLayers"])sortLayers();
            if(gCodeOptions["purgeEmptyLayers"])purgeLayers();
            GCODE.renderer.doRender(model, 0);
            GCODE.renderer3d.setModel(model);
//            GCODE.renderer3d.doRender(model);
        }

    }
}());
