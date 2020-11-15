import StringParser from './StringParser'
import OBJObject from './OBJObject'
import MTLDoc from './MTLDoc'


import nomralUtils from './Normal'
// Analyze the material file
function onReadMTLFile(fileString, mtl) {
    var lines = fileString.split('\n');  // Break up into lines and store them as array
    lines.push(null);           // Append null
    var index = 0;              // Initialize index of line
  
    // Parse line by line
    var line;      // A string in the line to be parsed
    var name = ""; // Material name
    var sp = new StringParser();  // Create StringParser
    while ((line = lines[index++]) != null) {
      sp.init(line);                  // init StringParser
      var command = sp.getWord();     // Get command
      if(command == null)	 continue;  // check null command
  
      switch(command){
      case '#':
        continue;    // Skip comments
      case 'newmtl': // Read Material chunk
        name = mtl.parseNewmtl(sp);    // Get name
        continue; // Go to the next line
      case 'Kd':   // Read normal
        if(name == "") continue; // Go to the next line because of Error
        var material = mtl.parseRGB(sp, name);
        mtl.materials.push(material);
        name = "";
        continue; // Go to the next line
        default:
            break
      }
    }
    mtl.complete = true;
  }

//------------------------------------------------------------------------------
// OBJParser
//------------------------------------------------------------------------------

// OBJDoc object
// Constructor
var OBJDoc = function(fileName) {
    this.fileName = fileName;
    this.mtls = new Array(0);      // Initialize the property for MTL
    this.objects = new Array(0);   // Initialize the property for Object
    this.vertices = new Array(0);  // Initialize the property for Vertex
    this.normals = new Array(0);   // Initialize the property for Normal
  }
  
  // Parsing the OBJ file
  OBJDoc.prototype.parse = function(fileString, scale, reverse) {
    var lines = fileString.split('\n');  // Break up into lines and store them as array
    lines.push(null); // Append null
    var index = 0;    // Initialize index of line
  
    var currentObject = null;
    var currentMaterialName = "";
    
    // Parse line by line
    var line;         // A string in the line to be parsed
    var sp = new StringParser();  // Create StringParser
    while ((line = lines[index++]) != null) {
      sp.init(line);                  // init StringParser
      var command = sp.getWord();     // Get command
      if(command == null)	 continue;  // check null command
  
      switch(command){
        case '#':
            continue;  // Skip comments
        case 'mtllib':     // Read Material chunk
            var path = this.parseMtllib(sp, this.fileName);
            var mtl = new MTLDoc.MTLDoc();   // Create MTL instance
            this.mtls.push(mtl);
            var request = new XMLHttpRequest();
            request.onreadystatechange = function() {
            if (request.readyState == 4) {
                if (request.status != 404) {
                onReadMTLFile(request.responseText, mtl);
                }else{
                mtl.complete = true;
                }
            }
            }
            request.open('GET', path, true);  // Create a request to acquire the file
            request.send();                   // Send the request
            continue; // Go to the next line
        case 'o':
        case 'g':   // Read Object name
            var object = this.parseObjectName(sp);
            this.objects.push(object);
            currentObject = object;
            continue; // Go to the next line
        case 'v':   // Read vertex
            var vertex = this.parseVertex(sp, scale);
            this.vertices.push(vertex); 
            continue; // Go to the next line
        case 'vn':   // Read normal
            var normal = this.parseNormal(sp);
            this.normals.push(normal); 
            continue; // Go to the next line
        case 'usemtl': // Read Material name
            currentMaterialName = this.parseUsemtl(sp);
            continue; // Go to the next line
        case 'f': // Read face
            var face = this.parseFace(sp, currentMaterialName, this.vertices, reverse);
            currentObject.addFace(face);
            continue; // Go to the next line
            default:
                break
      }
    }
  
    return true;
  }
  
  OBJDoc.prototype.parseMtllib = function(sp, fileName) {
    // Get directory path
    var i = fileName.lastIndexOf("/");
    var dirPath = "";
    if(i > 0) dirPath = fileName.substr(0, i+1);
  
    return dirPath + sp.getWord();   // Get path
  }
  
  OBJDoc.prototype.parseObjectName = function(sp) {
    var name = sp.getWord();
    return (new OBJObject.OBJObject(name));
  }
  
  OBJDoc.prototype.parseVertex = function(sp, scale) {
    var x = sp.getFloat() * scale;
    var y = sp.getFloat() * scale;
    var z = sp.getFloat() * scale;
    return (new OBJObject.Vertex(x, y, z));
  }
  
  OBJDoc.prototype.parseNormal = function(sp) {
    var x = sp.getFloat();
    var y = sp.getFloat();
    var z = sp.getFloat();
    return (new OBJObject.Normal(x, y, z));
  }
  
  OBJDoc.prototype.parseUsemtl = function(sp) {
    return sp.getWord();
  }
  
  OBJDoc.prototype.parseFace = function(sp, materialName, vertices, reverse) {  
    var face = new OBJObject.Face(materialName);
    // get indices
    for(;;){
      var word = sp.getWord();
      if(word == null) break;
      var subWords = word.split('/');
      if(subWords.length >= 1){
        var vi = parseInt(subWords[0]) - 1;
        face.vIndices.push(vi);
      }
      if(subWords.length >= 3){
        var ni = parseInt(subWords[2]) - 1;
        face.nIndices.push(ni);
      }else{
        face.nIndices.push(-1);
      }
    }
  
    // calc normal
    var v0 = [
      vertices[face.vIndices[0]].x,
      vertices[face.vIndices[0]].y,
      vertices[face.vIndices[0]].z];
    var v1 = [
      vertices[face.vIndices[1]].x,
      vertices[face.vIndices[1]].y,
      vertices[face.vIndices[1]].z];
    var v2 = [
      vertices[face.vIndices[2]].x,
      vertices[face.vIndices[2]].y,
      vertices[face.vIndices[2]].z];
  
    // 面の法線を計算してnormalに設定
    var normal = nomralUtils.calcNormal(v0, v1, v2);
    // 法線が正しく求められたか調べる
    if (normal == null) {
      if (face.vIndices.length >= 4) { // 面が四角形なら別の3点の組み合わせで法線計算
        var v3 = [
          vertices[face.vIndices[3]].x,
          vertices[face.vIndices[3]].y,
          vertices[face.vIndices[3]].z];
        normal = nomralUtils.calcNormal(v1, v2, v3);
      }
      if(normal == null){         // 法線が求められなかったのでY軸方向の法線とする
        normal = [0.0, 1.0, 0.0];
      }
    }
    if(reverse){
      normal[0] = -normal[0];
      normal[1] = -normal[1];
      normal[2] = -normal[2];
    }
    face.normal = new OBJObject.Normal(normal[0], normal[1], normal[2]);
  
    // Devide to triangles if face contains over 3 points.
    if(face.vIndices.length > 3){
      var n = face.vIndices.length - 2;
      var newVIndices = new Array(n * 3);
      var newNIndices = new Array(n * 3);
      for(var i=0; i<n; i++){
        newVIndices[i * 3 + 0] = face.vIndices[0];
        newVIndices[i * 3 + 1] = face.vIndices[i + 1];
        newVIndices[i * 3 + 2] = face.vIndices[i + 2];
        newNIndices[i * 3 + 0] = face.nIndices[0];
        newNIndices[i * 3 + 1] = face.nIndices[i + 1];
        newNIndices[i * 3 + 2] = face.nIndices[i + 2];
      }
      face.vIndices = newVIndices;
      face.nIndices = newNIndices;
    }
    face.numIndices = face.vIndices.length;
  
    return face;
  }

  export default OBJDoc

