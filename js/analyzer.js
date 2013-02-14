/**
 * Created with JetBrains WebStorm.
 * User: hudbrog
 * Date: 2/14/13
 * Time: 1:15 PM
 */

GCODE.analyzer = (function(){
    var savedRenderOptions;
    var canvas, ctx, transform;

    var saveOptions = function(){
        savedRenderOptions = $.extend({}, GCODE.renderer.getOptions());
        console.log(savedRenderOptions);
    }

    var restoreOptions = function(){
//        for(var opt in savedRenderOptions){
//            if(savedRenderOptions.hasOwnProperty(opt)){
//                var par = {}
//                GCODE.renderer.setOption({opt: savedRenderOptions[opt]});
//                console.log(opt + ": " + savedRenderOptions[opt])
//            }
//        };
        GCODE.renderer.setOption(savedRenderOptions);
        console.log(GCODE.renderer.getOptions());
    }

    var prepareOptions = function(){
        GCODE.renderer.setOption({showMoves: false});
        GCODE.renderer.setOption({showRetracts: false});
        GCODE.renderer.setOption({alpha: false});
        GCODE.renderer.setOption({actualWidth: true});
        GCODE.renderer.setOption({differentiateColors: false});
        GCODE.renderer.setOption({showNextLayer: false});
        GCODE.renderer.setOption({colorGrid: "#ffffff"});
    }

    var drawLineEnds = function(layerNum){
        var zoomFactor = 3; //TODO: REMOVE IT FROM HERE
        var model = GCODE.renderer.debugGetModel();
        if(layerNum  < model.length){
            var imgData=ctx.getImageData(0,0,canvas.width,canvas.height);
            console.log(imgData);
            var x, y, prevX=0, prevY=0;
            for (var i=0; i<model[layerNum].length; i++){
                var cmds = model[layerNum];
                if(typeof(cmds[i]) === 'undefined')continue;
                if(typeof(cmds[i].prevX) !== 'undefined' && typeof(cmds[i].prevY) !== 'undefined'){
                    prevX = cmds[i].prevX*zoomFactor;
                    prevY = -cmds[i].prevY*zoomFactor;
                }
                if(typeof(cmds[i].x)==='undefined'||isNaN(cmds[i].x))x=prevX;
                else x = cmds[i].x*zoomFactor;
                if(typeof(cmds[i].y) === 'undefined'||isNaN(cmds[i].y))y=prevY;
                else y = -cmds[i].y*zoomFactor;

                if(cmds[i].extrude){
                    var index = (x + y * imgData.width) * 4;
                    console.log("x: " + x + " y: " + y);
                    console.log("e: " + transform.e + " f:" + transform.f);
                    console.log(imgData.data[index]);
                    if(imgData.data[index] === 0){
                        ctx.strokeStyle = "#ff0000";
                        ctx.fillStyle = "#ff0000";
                        ctx.beginPath();
                        ctx.arc(x, y, 0.2, 0, Math.PI*2, true);
                        ctx.stroke();
                        ctx.fill();
                    }
                }
            }
        }
    }

    var analyze = function(layerNum){
        GCODE.renderer.render(layerNum, 0, GCODE.renderer.getLayerNumSegments(layerNum));
        drawLineEnds(layerNum+1);
    }

    var init = function(){
        canvas = document.getElementById('canvas');
        ctx = canvas.getContext('2d');
        transform = ctx.getTransform();
       // console.log(ctx.getTransform());
    }

    return {
        runAnalyze: function(layerNum){
            init();
            saveOptions();
            prepareOptions();
            analyze(layerNum);
        },
        restoreRenderer: function(){
            restoreOptions();
        }
    }
}());