/**
 * User: hudbrog (hudbrog@gmail.com)
 * Date: 10/20/12
 * Time: 1:36 PM
 * To change this template use File | Settings | File Templates.
 */


GCODE.renderer = (function(){
// ***** PRIVATE ******
    var canvas;
    var ctx;
    var zoomFactor= 3, zoomFactorDelta = 0.4;
    var gridSizeX=200,gridSizeY=200,gridStep=10;
    var ctxHeight, ctxWidth;
    var prevX=0, prevY=0;

//    var colorGrid="#bbbbbb", colorLine="#000000";
    var sliderHor, sliderVer;
    var layerNumStore, progressStore;
    var lastX, lastY;
    var dragStart,dragged;
    var scaleFactor = 1.1;
    var model;
    var initialized=false;
    var renderOptions = {
        showMoves: true,
        showRetracts: true,
        colorGrid: "#bbbbbb",
        colorLine: "#000000",
        colorMove: "#00ff00",
        colorRetract: "#ff0000",
        colorRestart: "#0000ff",
        sizeRetractSpot: 2,
        modelCenter: {x: 0, y: 0},
        moveModel: false
    };
    var $slideMe;
    var offsetX=0, offsetY=0;


    var reRender = function(){
        drawLayer(layerNumStore, progressStore);
    };

    function trackTransforms(ctx){
        var svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
        var xform = svg.createSVGMatrix();
        ctx.getTransform = function(){ return xform; };

        var savedTransforms = [];
        var save = ctx.save;
        ctx.save = function(){
            savedTransforms.push(xform.translate(0,0));
            return save.call(ctx);
        };
        var restore = ctx.restore;
        ctx.restore = function(){
            xform = savedTransforms.pop();
            return restore.call(ctx);
        };

        var scale = ctx.scale;
        ctx.scale = function(sx,sy){
            xform = xform.scaleNonUniform(sx,sy);
            return scale.call(ctx,sx,sy);
        };
        var rotate = ctx.rotate;
        ctx.rotate = function(radians){
            xform = xform.rotate(radians*180/Math.PI);
            return rotate.call(ctx,radians);
        };
        var translate = ctx.translate;
        ctx.translate = function(dx,dy){
            xform = xform.translate(dx,dy);
            return translate.call(ctx,dx,dy);
        };
        var transform = ctx.transform;
        ctx.transform = function(a,b,c,d,e,f){
            var m2 = svg.createSVGMatrix();
            m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
            xform = xform.multiply(m2);
            return transform.call(ctx,a,b,c,d,e,f);
        };
        var setTransform = ctx.setTransform;
        ctx.setTransform = function(a,b,c,d,e,f){
            xform.a = a;
            xform.b = b;
            xform.c = c;
            xform.d = d;
            xform.e = e;
            xform.f = f;
            return setTransform.call(ctx,a,b,c,d,e,f);
        };
        var pt  = svg.createSVGPoint();
        ctx.transformedPoint = function(x,y){
            pt.x=x; pt.y=y;
            return pt.matrixTransform(xform.inverse());
        }
    }


    var  startCanvas = function() {
        canvas = document.getElementById('canvas');

        // Проверяем понимает ли браузер canvas
        if (!canvas.getContext) {
            throw "exception";
        }

        ctx = canvas.getContext('2d'); // Получаем 2D контекст
        ctxHeight = canvas.height;
        ctxWidth = canvas.width;
        lastX = ctxWidth/2;
        lastY = ctxHeight/2;

        trackTransforms(ctx);

        canvas.addEventListener('mousedown',function(evt){
            document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
            lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
            lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
            dragStart = ctx.transformedPoint(lastX,lastY);
            dragged = false;
        },false);
        canvas.addEventListener('mousemove',function(evt){
            lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
            lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
            dragged = true;
            if (dragStart){
                var pt = ctx.transformedPoint(lastX,lastY);
                ctx.translate(pt.x-dragStart.x,pt.y-dragStart.y);
                reRender();
            }
        },false);
        canvas.addEventListener('mouseup',function(evt){
            dragStart = null;
            if (!dragged) zoom(evt.shiftKey ? -1 : 1 );
        },false);
        var zoom = function(clicks){
            var pt = ctx.transformedPoint(lastX,lastY);
            ctx.translate(pt.x,pt.y);
            var factor = Math.pow(scaleFactor,clicks);
            ctx.scale(factor,factor);
            ctx.translate(-pt.x,-pt.y);
            reRender();
        };
        var handleScroll = function(evt){
            var delta;
            if(evt.detail<0 || evt.wheelDelta>0)delta=zoomFactorDelta;
            else delta=-1*zoomFactorDelta;
            if (delta) zoom(delta);
            return evt.preventDefault() && false;
        };
        canvas.addEventListener('DOMMouseScroll',handleScroll,false);
        canvas.addEventListener('mousewheel',handleScroll,false);

    };

    var drawGrid = function() {
        var i;
        ctx.strokeStyle = renderOptions["colorGrid"];

        ctx.beginPath();
        for(i=0;i<=gridSizeX;i+=gridStep){
            ctx.moveTo(i*zoomFactor+offsetX, 0+offsetY);
            ctx.lineTo(i*zoomFactor+offsetX, gridSizeY*zoomFactor+offsetY);
        }
        ctx.stroke();

        ctx.beginPath();
        for(i=0;i<=gridSizeY;i+=gridStep){
            ctx.moveTo(0+offsetX, i*zoomFactor+offsetY);
            ctx.lineTo(gridSizeX*zoomFactor+offsetX, i*zoomFactor+offsetY);
        }
        ctx.stroke();

    };

    var getZ = function(layerNum){
        var cmds = model[layerNum];
        if(!cmds)return "error";
        for(var i=0;i<cmds.length;i++){
            if(cmds[i].z!==undefined)return cmds[i].z;
        }
        return -1;
    };

    var drawLayer = function(layerNum, progress){
        var i;
        layerNumStore=layerNum;
        progressStore = progress;
        var cmds = model[layerNum];
        var x, y;

        if(layerNum==0){
            if(model[0]&&model[0].x !== undefined &&model[0].y !== undefined){
                prevX = model[0].x*zoomFactor;
                prevY = model[0].y*zoomFactor;
            }else {
                prevX = 0;
                prevY = 0;
            }
        }else{
            if(model[layerNum-1]){
                prevX=undefined;
                prevY=undefined;
                for(i=model[layerNum-1].length-1;i>=0;i--){
                    if(prevX === undefined && model[layerNum-1][i].x!==undefined)prevX=model[layerNum-1][i].x*zoomFactor;
                    if(prevY === undefined && model[layerNum-1][i].y!==undefined)prevY=model[layerNum-1][i].y*zoomFactor;
                }
                if(prevX === undefined)prevX=0;
                if(prevY === undefined)prevY=0;
            }else{
                prevX=0;
                prevY=0;
            }
        }

        var p1 = ctx.transformedPoint(0,0);
        var p2 = ctx.transformedPoint(canvas.width,canvas.height);
        ctx.clearRect(p1.x,p1.y,p2.x-p1.x,p2.y-p1.y);

        drawGrid();
        ctx.strokeStyle = renderOptions["colorLine"];

        ctx.beginPath();
        for(i=0;i<progress;i++){
//                console.log(cmds[i]);
            if(!cmds[i].x)x=prevX/zoomFactor;
            else x = cmds[i].x;
            if(!cmds[i].y)y=prevY/zoomFactor;
            else y = cmds[i].y;


            if(!cmds[i].extrude&&!cmds[i].noMove){
                ctx.stroke();
                if(cmds[i].retract == -1){
                    if(renderOptions["showRetracts"]){
                        ctx.strokeStyle = renderOptions["colorRetract"];
                        ctx.fillStyle = renderOptions["colorRetract"];
                        ctx.beginPath();
                        ctx.arc(prevX, prevY, renderOptions["sizeRetractSpot"], 0, Math.PI*2, true);
                        ctx.stroke();
                        ctx.fill();
                    }
                }
                if(renderOptions["showMoves"]){
                    ctx.strokeStyle = renderOptions["colorMove"];
                    ctx.beginPath();
                    ctx.moveTo(prevX, prevY);
                    ctx.lineTo(x*zoomFactor,y*zoomFactor);
                    ctx.stroke();
                }
                ctx.strokeStyle = renderOptions["colorLine"];
                ctx.beginPath();
//                console.log("moveto: "+cmds[i].x+":"+cmds[i].y)
//                ctx.moveTo(cmds[i].x*zoomFactor,cmds[i].y*zoomFactor);
            }
            else if(cmds[i].extrude){
                if(cmds[i].retract==0){
                    ctx.moveTo(prevX, prevY);
                    ctx.lineTo(x*zoomFactor,y*zoomFactor);
                }else {
                    if(renderOptions["showRetracts"]){
                        ctx.stroke();
                        ctx.strokeStyle = renderOptions["colorRestart"];
                        ctx.fillStyle = renderOptions["colorRestart"];
                        ctx.beginPath();
                        ctx.arc(prevX, prevY, renderOptions["sizeRetractSpot"], 0, Math.PI*2, true);
                        ctx.stroke();
                        ctx.fill();
                        ctx.strokeStyle = renderOptions["colorLine"];
                        ctx.beginPath();
                    }
                }
            }
            prevX = x*zoomFactor;
            prevY = y*zoomFactor;
        }
        ctx.stroke();
    };


// ***** PUBLIC *******
    return {
        init: function(){
            startCanvas();
            initialized = true;
            ctx.translate(30-offsetX,30-offsetY);
        },
        setOption: function(options){
            for(var opt in options){
                if(options.hasOwnProperty(opt))renderOptions[opt] = options[opt];
            };

            if(renderOptions["moveModel"]){
                offsetX = renderOptions["modelCenter"].x*zoomFactor-gridSizeX/2*zoomFactor;
                offsetY = renderOptions["modelCenter"].y*zoomFactor-gridSizeY/2*zoomFactor;
                if(ctx)ctx.translate(offsetX, offsetY);
            }else{
                offsetX=0;
                offsetY=0;
            }

            if(initialized)reRender();
        },
        debugGetModel: function(){
            return model;
        },
        doRender: function(mdl, layerNum){
            model = mdl;
            sliderVer =  $( "#slider-vertical" );
            sliderHor = $( "#slider-horizontal" );
            prevX=0;
            prevY=0;
            var handle;


            if(!initialized)this.init();

//TODO: need to remove UI stuff from here


            sliderVer.slider({
                orientation: "vertical",
                range: "min",
                min: 0,
                max: model.length-1,
                value: layerNum,
                slide: function( event, ui ) {
                    var progress = model[ui.value]?model[ui.value].length:0;
                    drawLayer(ui.value, progress);
                    sliderHor.slider({max: progress, value: progress});
//                    handle.attr("title", 'Layer:' + ui.value + "\nZ:" + getZ(ui.value));
                    $slideMe.text('Layer:' + ui.value + '\nZ:' + getZ(ui.value));
//                    $( "#amount" ).val( ui.value );
                }
            });
            $slideMe = $('<span/>')
                .css({ 'position' : 'absolute' , left : 40, 'bottom': 0, 'color':'#0070A3' , 'display' : 'block', 'width':80})
                .text('Layer:' + layerNum + '\nZ:' + getZ(layerNum))
                .hide();

            handle = $('.ui-slider-handle', sliderVer);
            handle.append($slideMe).hover(function()
                { $slideMe.show()},
                function()
                { $slideMe.hide()}
            );

            sliderHor.slider({
                orientation: "horizontal",
                range: "min",
                min: 0,
                max: model[layerNum]?model[layerNum].length:0,
                value: model[layerNum]?model[layerNum].length:0,
                slide: function( event, ui ) {
                    drawLayer(sliderVer.slider("value"), ui.value);
//                    console.log($("#slider-vertical").slider("value"));
//                    console.log(sliderHor("value"));
//                    $( "#amount" ).val( ui.value );
                }
            });

            drawLayer(layerNum, model[layerNum].length);
        }
    }
}());
