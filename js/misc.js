/**
 * User: hudbrog (hudbrog@gmail.com)
 * Date: 10/21/12
 * Time: 7:45 AM
 */
var GCODE = {};

GCODE.miscObject = (function(){
    var reader;

    return {
        handleFileSelect: function(evt) {
            console.log("handleFileSelect");
            evt.stopPropagation();
            evt.preventDefault();

            var files = evt.dataTransfer?evt.dataTransfer.files:evt.target.files; // FileList object.

            // files is a FileList of File objects. List some properties.
            var output = [];
            for (var i = 0, f; f = files[i]; i++) {
                output.push('<li><strong>', escape(f.name), '</strong> - ',
                    f.size, ' bytes, last modified: ',
                    f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                    '</li>');
                if(f.name.toLowerCase().match(/^.*\.gcode/)){
                    output.push('<li>File extensions suggests GCODE</li>');
                }else{
                    $( "submit_button" ).button("disable");
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
            $( "input[type=submit], a, button" ).button("enable");
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
                $( "input[type=submit], a, button" )
                    .button()
                    .click(function( event ) {
                        GCODE.gCodeReader.parseGCode();
                        event.preventDefault();
                    });
            });

        },

        processOptions: function(){
            if(document.getElementById('sortLayersCheckbox').checked)GCODE.gCodeReader.setOption({sortLayers: true});
            else GCODE.gCodeReader.setOption({sortLayers: false});
            if(document.getElementById('purgeEmptyLayersCheckbox').checked)GCODE.gCodeReader.setOption({purgeEmptyLayers: true});
            else GCODE.gCodeReader.setOption({purgeEmptyLayers: false});
            if(document.getElementById('showMovesCheckbox').checked)GCODE.renderer.setOption({showMoves: true});
            else GCODE.renderer.setOption({showMoves: false});
        }
    }
}());