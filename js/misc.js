/**
 * User: hudbrog (hudbrog@gmail.com)
 * Date: 10/21/12
 * Time: 7:45 AM
 */
var GCODE = {};

GCODE.miscObject = (function(){
    var reader;

    var tabSelector = ["2d","3d"];

    return {
        handleFileSelect: function(evt) {
            console.log("handleFileSelect");
            evt.stopPropagation();
            evt.preventDefault();

            var files = evt.dataTransfer?evt.dataTransfer.files:evt.target.files; // FileList object.

            // files is a FileList of File objects. List some properties.
            var output = [];
            for (var i = 0, f; f = files[i]; i++) {
                output.push('<li>', escape(f.name), ' - ',
                    f.size, ' bytes, last modified: ',
                    f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                    '</li>');
                if(f.name.toLowerCase().match(/^.*\.gcode/)){
                    output.push('<li>File extensions suggests GCODE</li>');
                    output.push('<li>You should press "Render GCode" button now.</li>');

                }else{
                    output.push('<li><strong>You should only upload *.gcode files! I will not work with this one!</strong></li>');
                    $( "submit_button" ).button("disable");
                    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
                    return;
                }

                reader = new FileReader();
                reader.onload = function(theFile){
                    GCODE.gCodeReader.loadFile(theFile);
                };
                reader.readAsText(f);
            }

            document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
//            document.getElementById('submit_button').disabled=false;

            $( "#submit_button" ).button("enable");

        },

        handleDragOver: function(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            evt.target.dropEffect = 'copy'; // Explicitly show this is a copy.
        },

        initHandlers: function(){
            console.log("Application initialized");
            var dropZone = document.getElementById('drop_zone');
            dropZone.addEventListener('dragover', GCODE.miscObject.handleDragOver, false);
            dropZone.addEventListener('drop', GCODE.miscObject.handleFileSelect, false);

            document.getElementById('file').addEventListener('change', GCODE.miscObject.handleFileSelect, false);

            $(function() {
                $( "#submit_button" )
                    .button()
                    .click(function( event ) {
                        _gaq.push(['_trackEvent', 'renderButton', 'clicked']);
                        $("#tabs-min").tabs("select", "#tabs-1");
                        GCODE.gCodeReader.parseGCode();
                        event.preventDefault();
                    });
            });


            $('#tabs-min').bind('tabsselect', function(event, ui) {
                console.log("got tab select");
                if(tabSelector[ui.index]&&tabSelector[ui.index]=="3d"&&!GCODE.renderer3d.isModelReady()){
                    console.log("we are going to 3d mode");
//                    $(function() {
//                        $( "#dialog-modal" ).dialog({
//                            height: 140,
//                            modal: true
//                        });
//                    });
//                    $(function() {
//                        $( "#progressbar" ).progressbar({
//                            value: 0
//                        });
//                    });
                    GCODE.renderer3d.doRender();
                };

            });


            GCODE.miscObject.processOptions();

        },

        processOptions: function(){
            if(document.getElementById('sortLayersCheckbox').checked)GCODE.gCodeReader.setOption({sortLayers: true});
            else GCODE.gCodeReader.setOption({sortLayers: false});
            if(document.getElementById('purgeEmptyLayersCheckbox').checked)GCODE.gCodeReader.setOption({purgeEmptyLayers: true});
            else GCODE.gCodeReader.setOption({purgeEmptyLayers: false});
            if(document.getElementById('showMovesCheckbox').checked)GCODE.renderer.setOption({showMoves: true});
            else GCODE.renderer.setOption({showMoves: false});
            if(document.getElementById('showRetractsCheckbox').checked)GCODE.renderer.setOption({showRetracts: true});
            else GCODE.renderer.setOption({showRetracts: false});
        }
    }
}());