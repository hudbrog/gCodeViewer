/**
 * User: hudbrog (hudbrog@gmail.com)
 * Date: 10/21/12
 * Time: 4:59 PM
 */
GCODE.renderer3d = (function(){
// ***** PRIVATE ******
    var model;
    var prevX=0, prevY= 0, prevZ=0;
    var sliderHor, sliderVer;
    var object;
    var geometry;

    // set the scene size
    var WIDTH = 650,
        HEIGHT = 630;

    // set some camera attributes
    var VIEW_ANGLE = 70,
        ASPECT = WIDTH / HEIGHT,
        NEAR = 0.1,
        FAR = 10000;

    // create a renderer,
    // and a scene
    var renderer = new THREE.WebGLRenderer({clearColor:0x000000, clearAlpha: 1});
    var scene = new THREE.Scene();
    var camera =
        new THREE.PerspectiveCamera(
            VIEW_ANGLE,
            ASPECT,
            NEAR,
            FAR);

    var halfWidth = window.innerWidth / 2;
    var halfHeight = window.innerHeight / 2;
    var mouseX = 0, mouseY = 0;


    var renderOptions = {
        showMoves: true,
        colorLine: new THREE.Color(0xffffff),
        colorMove: new THREE.Color(0x00ff00)
    };


    var buildModel = function(){
        var i,j;
        var cmds = [];

        for(i=0;i<model.length;i++){
            cmds = model[i];
            if(!cmds)continue;
            for(j=0;j<cmds.length;j++){
                if(!cmds[j])continue;
                if(!cmds[j].x)cmds[j].x=prevX;
                if(!cmds[j].y)cmds[j].y=prevY;
                if(!cmds[j].z)cmds[j].z=prevZ;
                if(!cmds[j].extrude){
                }
                else {
                    geometry.vertices.push( new THREE.Vector3(prevX, prevY, prevZ));
                    geometry.vertices.push( new THREE.Vector3(cmds[j].x, cmds[j].y, cmds[j].z));
//                    geometry.colors.push(renderOptions["colorLine"]);
                }
                prevX = cmds[j].x;
                prevY = cmds[j].y;
                prevZ = cmds[j].z;
            }
        }
        var lineMaterial = new THREE.LineBasicMaterial({color: 0xFFFFFF, lineWidth: 2});
        object.add(new THREE.Line(geometry, lineMaterial, THREE.LinePieces));
        geometry.computeBoundingBox();
//        var center = new THREE.Vector3()
//            .add(geometry.boundingBox.min, geometry.boundingBox.max)
//            .divideScalar(2);
//        var scale = 3; // TODO: Auto size
//        object.position = center.multiplyScalar(-scale);
//        object.scale.multiplyScalar(10);
    };

    var debugAxis = function(axisLength){
        //Shorten the vertex function
        function v(x,y,z){
            return new THREE.Vertex(new THREE.Vector3(x,y,z));
        }

        //Create axis (point1, point2, colour)
        function createAxis(p1, p2, color){
            var line, lineGeometry = new THREE.Geometry(),
                lineMat = new THREE.LineBasicMaterial({color: color, lineWidth: 1});
            lineGeometry.vertices.push(p1, p2);
            line = new THREE.Line(lineGeometry, lineMat);
            scene.add(line);
        }

        createAxis(v(-axisLength, 0, 0), v(axisLength, 0, 0), 0xFF0000);
        createAxis(v(0, -axisLength, 0), v(0, axisLength, 0), 0x00FF00);
        createAxis(v(0, 0, -axisLength), v(0, 0, axisLength), 0x0000FF);
    };


// ***** PUBLIC *******
    return {
        init: function(){

            // get the DOM element to attach to
            // - assume we've got jQuery to hand
            var $container = $('#3d_container');

            // the camera starts at 0,0,0
            // so pull it back
            camera.position.y = 300;
            camera.position.z = 400;
            camera.position.x = 200;
            camera.lookAt(new THREE.Vector3(0,0,0));

            // add the camera to the scene
            scene.add(camera);

            // start the renderer
            renderer.setSize(WIDTH, HEIGHT);

            // attach the render-supplied DOM element
            $container.append(renderer.domElement);
        },
        doRender: function(mdl){
            model = mdl;
            prevX=0;
            prevY=0;
            prevZ=0;
            object = new THREE.Object3D();
            geometry = new THREE.Geometry();
            this.init();
            buildModel();

            scene.add(object);
            debugAxis(100);

            var mousemove = function(e){
                mouseX = e.clientX - halfWidth;
                mouseY = e.clientY - halfHeight;
            };
            // Action!
            var render = function(){
//                var time = new Date().getTime() * 0.0007;
//
//                camera.position.y += (- mouseY - camera.position.y) * 0.05;
//                camera.position.z = Math.sin( 0.1 * time) *  750;
//                camera.position.x = Math.cos( 0.2 * time) *  750;

                renderer.render(scene, camera);
                requestAnimationFrame(render);
            }
            render();
            renderer.render(scene, camera);
        }
    }
}());

