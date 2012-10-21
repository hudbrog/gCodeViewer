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
            if(lines[i].match(/^(G0|G1|G90|G91|G92)/))gcode.push(lines[i]);
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
            lines = str.split(/[\r\n|\n]+/);
            prepareGCode();
        },
        setOption: function(options){
            for(var opt in options){
                gCodeOptions[opt] = options[opt];
            }
        },
        parseGCode: function(){
            model=[];
            var i, j, layer= 0, relative=true, extrude=false, x, y, z, prevz=-999, prev_extrude = {a: undefined, b: undefined, c: undefined, e: undefined};
            for(i=0;i<gcode.length;i++){
                x=undefined;
                y=undefined;
                z=undefined;
                extrude=false;
//                if(result = this.gcode[i].match(/^(?:G0|G1)\s?([X][\-0-9\.]+)?\s?(Y[\-0-9\.]+)?\s?(Z[\-0-9\.]+)?\s?([EABC][\-0-9\.]+)?/i))console.log(result);
                if(gcode[i].match(/^(?:G0|G1)\s+/i)){
                    var args = gcode[i].split(/\s+/);
                    for(j=0;j<args.length;j++){
//                        console.log(args);
                        if(!args[j])continue;
                        switch(args[j].charAt(0).toLowerCase()){
                            case 'x':
                                x=args[j].slice(1);
                                break;
                            case 'y':
                                y=args[j].slice(1);
                                break;
                            case 'z':
                                z=args[j].slice(1);
                                // TODO: нужно реализовать механизм переключения на нужный слой, а не просто вверх-вниз
                                // TODO: и учитывать абсолютные/относительные перемещения
                                if(z_heights.hasOwnProperty(z)){
                                    layer = z_heights[z];
                                }else{
                                    layer = model.length;
                                    z_heights[z] = layer;
                                }
//                                if(parseFloat(prevz) < )
//                                if(args[j].charAt(1) === "-")layer--;
//                                else layer++;
                                prevz = z;
                                break;
                            case 'e'||'a'||'b'||'c':
                                extrude = parseFloat(prev_extrude[args[j].charAt(0).toLowerCase()]) < parseFloat(args[j].slice(1));
                                prev_extrude[args[j].charAt(0).toLowerCase()] = args[j].slice(1);
                                break;
                            default:
                                break;
                        }
                    }
                    if(!model[layer])model[layer]=[];
                    if(x||y||z)model[layer][model[layer].length] = {x: x, y: y, z: z, extrude: extrude, relative: relative};
                }else if(gcode[i].match(/^(?:G91)\s?/i)){
                    relative=true;
                }else if(gcode[i].match(/^(?:G90)\s?/i)){
                    relative=false;
                }
            }
            console.log("GCode parsed");
            if(gCodeOptions["sortLayers"])sortLayers();
            if(gCodeOptions["purgeEmptyLayers"])purgeLayers();
            GCODE.renderer.doRender(model, 0);
            GCODE.renderer3d.doRender(model);
        }

    }
}());
