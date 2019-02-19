gCodeVisualizer - a web-based visual gcode viewer and analyzer.
Available online at http://gcode.ws/

If you want to use it locally with chrome - you will need to add "--allow-file-access-from-files" command line parameter,
which is unsafe (and you should never browse internet with that option "on").

### Docker Setup Instructions:

1. Build docker image
``` bash
docker build -t gcodews .
```

2. Run docker image
``` bash
docker docker run --name gcodews -d -p 8080:80 gcodews
```

3. Access site via port `8080` on your browser
```
localhost:8080
127.0.0.1:8080
X.X.X.X:8080
<domain-name>:8080
```