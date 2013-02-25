/**
 * Created with JetBrains WebStorm.
 * User: hudbrog
 * Date: 2/14/13
 * Time: 1:15 PM
 */

GCODE.analyzer = (function(){
    var savedRenderOptions, dia;
    var canvas, ctx, transform;
    var lastAnalyzedLayer=-1;
    var initialized = false;
    var usableLevel = 190, stepLevel=30;

    var saveOptions = function(){
        savedRenderOptions = $.extend({}, GCODE.renderer.getOptions());
//        console.log(savedRenderOptions);
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
//        console.log(GCODE.renderer.getOptions());
        initialized=false;
    }

    var prepareOptions = function(){
        GCODE.renderer.setOption({showMoves: false});
        GCODE.renderer.setOption({showRetracts: false});
        GCODE.renderer.setOption({alpha: false});
        GCODE.renderer.setOption({actualWidth: true});
        GCODE.renderer.setOption({differentiateColors: false});
        GCODE.renderer.setOption({showNextLayer: false});
        GCODE.renderer.setOption({colorGrid: "#ffffff"});
        GCODE.renderer.setOption({renderAnalysis: true});
//        console.log(GCODE.renderer.getOptions());
    }

    var multiplyPoint = function(point) {
        return {
            x: parseInt(point.x * transform.a + point.y * transform.c + transform.e),
            y: parseInt(point.x * transform.b + point.y * transform.d + transform.f)
        }
    }

    var checkPoint = function(imgData, p) {
        if (imgData.data[(p.x+ p.y * imgData.width) * 4+3] > 100) {
            return imgData.data[(p.x+ p.y * imgData.width) * 4];
        } else {
            return 255;
        }

    }

    var checkArea = function(imgData, pnt) {
        var r = parseInt(dia/2)+1;
        var res = 0, p = multiplyPoint(pnt);

        res += checkPoint(imgData, {x: p.x  , y: p.y  });
        res += checkPoint(imgData, {x: p.x+r, y: p.y  });
        res += checkPoint(imgData, {x: p.x-r, y: p.y  });
        res += checkPoint(imgData, {x: p.x  , y: p.y+r});
        res += checkPoint(imgData, {x: p.x  , y: p.y-r});
        r = parseInt(r*0.7)===0?1:parseInt(r*0.7);
        res += checkPoint(imgData, {x: p.x+r, y: p.y-r});
        res += checkPoint(imgData, {x: p.x+r, y: p.y+r});
        res += checkPoint(imgData, {x: p.x-r, y: p.y-r});
        res += checkPoint(imgData, {x: p.x-r, y: p.y+r});

        res = res/9;

        return res;
//        return checkPoint(imgData, p)===1?true:false;
    }


    var findNearestPoint = function(imgData, x,y,lastX,lastY){
        var len = [], stepCnt = [], step = [];
        var p0 = multiplyPoint({x:lastX, y:lastY});
        var p = multiplyPoint({x:x,y:y});
        len[0] = parseInt(p.x - p0.x);
        len[1] = parseInt(p.y - p0.y);
//        len[2] = Math.sqrt(xlen*xlen + ylen*ylen);
        stepCnt[0] = Math.abs(len[0]/(dia*0.7));
        stepCnt[1] = Math.abs(len[1]/(dia*0.7));
        var index = Math.abs(len[0])<Math.abs(len[1])?1:0;
        step[0] = len[0]/stepCnt[index];
        step[1] = len[1]/stepCnt[index];
        stepCnt[index] = parseInt(stepCnt[index])+1;
        for(var i=2;i<stepCnt[index];i++){
            var p1 = {x:parseInt(p.x-step[0]*i),y:parseInt(p.y-step[1]*i)};
            var res = checkPoint(imgData, p1);
            if(res<usableLevel){
                return i/stepCnt[index];
            }
        }
        return 1;
    }

    var drawLineEnds = function(layerNum){
        var zoomFactor = 3; //TODO: REMOVE IT FROM HERE
        var model = GCODE.renderer.debugGetModel();
        var lastErrCmd = -10, errStreak = 0, totalErr= 0, longestErrStreak=0;
        if(layerNum  < model.length){
            var imgData=ctx.getImageData(0,0,canvas.width,canvas.height);
            transform = ctx.getTransform();
//            window.location = canvas.toDataURL("image/png");
//            console.log(imgData);
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
//                    var result = checkArea(imgData, {x: prevX, y: prevY});
//                    if(layerNum==10){
//                        var pngUrl = canvas.toDataURL();
//                        document.write('<img src="'+pngUrl+'"/>');
//                    }
                    var r2 = checkArea(imgData, {x: x, y: y});
                    var r1 = checkArea(imgData, {x: prevX, y: prevY});
                    var result = (r2+r1)/2;
                    model[layerNum][i].errLevelE = r2<usableLevel?0:r2-stepLevel;
                    model[layerNum][i].errLevelB = r1<usableLevel?0:r1-stepLevel;
                    if(r1<usableLevel&&r2<usableLevel)model[layerNum][i].errType=3;
                    else if(r1<usableLevel)model[layerNum][i].errType=1;
                    else if(r2<usableLevel)model[layerNum][i].errType=2;
                    else model[layerNum][i].errType=0;
//                    model[layerNum][i].errType = r1<usableLevel&&r2<usableLevel?2:(r1<usableLevel||r2<usableLevel?1:0);
                    if(model[layerNum][i].errType===1){
                        model[layerNum][i].errDelimiter = findNearestPoint(imgData, x, y, prevX, prevY);
                    }else if(model[layerNum][i].errType===2){
                        var tmp = findNearestPoint(imgData, prevX, prevY, x, y)
                        model[layerNum][i].errDelimiter = tmp;
                    }
//                    var index = (p.x + p.y * imgData.width) * 4;
//                    console.log(index);
//                    console.log("x: " + x + " y: " + y);
//                    console.log("e: " + transform.e + " f:" + transform.f);
//                    console.log(ctx.transformedPoint(x, y));
//                    console.log(multiplyPoint({x:x,y:y}));
//                    console.log(imgData.data[index]);
                    if(result==0){
                        if(lastErrCmd == i-1) {
                            errStreak++;
                        }else{
                            errStreak = 0;
                        }
                        lastErrCmd = i;
                        totalErr++;
                        if(longestErrStreak < errStreak){
                            longestErrStreak = errStreak;
                        }

//                        ctx.strokeStyle = "#ff0000";
//                        ctx.fillStyle = "#ff0000";
//                        ctx.beginPath();
//                        ctx.arc(x, y, 0.2, 0, Math.PI*2, true);
//                        ctx.stroke();
//                        ctx.fill();
                    }else if (result >0 && result < 3){
//                        if(lastErrCmd == i-1) {
//                            errStreak++;
//                        }else{
//                            errStreak = 0;
//                        }
//                        totalErr++;
//                        if(longestErrStreak < errStreak){
//                            longestErrStreak = errStreak;
//                        }

//                        ctx.strokeStyle = "#00ff00";
//                        ctx.fillStyle = "#00ff00";
//                        ctx.beginPath();
//                        ctx.arc(x, y, 0.2, 0, Math.PI*2, true);
//                        ctx.stroke();
//                        ctx.fill();
                    }
                }
            }
            ctx.putImageData(imgData, 0, 0);
        }
        return {errors: totalErr, longestStreak: longestErrStreak};
    }

    var analyze = function(layerNum){
        GCODE.renderer.render(layerNum, 0, GCODE.renderer.getLayerNumSegments(layerNum));
        return drawLineEnds(layerNum+1);
    }

    var analyzeStep = function(){
        var numLayers = GCODE.renderer.getModelNumLayers();
        var i = lastAnalyzedLayer;
        var result = analyze(i);
        var progress = 100/numLayers*i;
        $('#analysisProgress').width(parseInt(progress)+'%').text(parseInt(progress)+'%');
        if(i<GCODE.renderer.getModelNumLayers()-1){
            lastAnalyzedLayer++;
            requestAnimationFrame(analyzeStep);
        }else{
            $('#analysisModal').modal('hide');
            restoreOptions();
            $('#analysisOptionsDiv').removeClass('hide');
            GCODE.ui.resetSliders();
            GCODE.renderer.render(0,0,GCODE.renderer.getLayerNumSegments(0));
        }

    }

    var analyzeCycle = function(){
        $('#analysisModal').modal('show');
//        var i = lastAnalyzedLayer===-1?0:lastAnalyzedLayer+1;
        lastAnalyzedLayer = 0;
//        var numLayers = GCODE.renderer.getModelNumLayers();

        requestAnimationFrame(analyzeStep);
//        for(;i<numLayers;i++){
//            requestAnimationFrame(step);
//            var result = analyze(i);
//            var progress = numLayers/100*i;
//            $('#analysisProgress').width(parseInt(progress)+'%').text(parseInt(progress)+'%');
//            console.log("For layer number " + i + " we got:" + result.errors);
////            if(result.longestStreak > 4){
////                lastAnalyzedLayer = i;
////                return false;
////            }
//        }
//        $('#analysisModal').modal('hide');
        return true;
    }

    var init = function(){
        if(initialized)return;
        canvas = document.getElementById('canvas');
        ctx = canvas.getContext('2d');
        transform = ctx.getTransform();
        saveOptions();
        prepareOptions();
        var extrusionWidth = GCODE.renderer.getOptions()['extrusionWidth'];
        console.log("Extrusion width is " +extrusionWidth);
        var p1 = multiplyPoint({x:0, y:0});
        var p2 = multiplyPoint({x: extrusionWidth, y: 0});
        dia = Math.abs(Math.abs(p2.x) - Math.abs(p1.x));
        console.log("width is " + dia);
        initialized=true;
    }

    return {
        runAnalyze: function(){
            init();
            analyzeCycle();
//            restoreOptions();
        },
        analyzeOnce: function(layerNum){
            init();
            analyze(layerNum);
        },
        restoreRenderer: function(){
            restoreOptions();
        },
        multiplyPoint2: function(point) {
            return {
                x: parseInt(point.x * transform.a + point.y * transform.c + transform.e),
                y: parseInt(point.x * transform.b + point.y * transform.d + transform.f)
            }
        }
    }
}());