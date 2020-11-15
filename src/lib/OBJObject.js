
    //------------------------------------------------------------------------------
  // Vertex Object
  //------------------------------------------------------------------------------
  var Vertex = function(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  
  //------------------------------------------------------------------------------
  // Normal Object
  //------------------------------------------------------------------------------
  var Normal = function(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  


  //------------------------------------------------------------------------------
// Face Object
//------------------------------------------------------------------------------
var Face = function(materialName) {
    this.materialName = materialName;
    if(materialName == null)  this.materialName = "";
    this.vIndices = new Array(0);
    this.nIndices = new Array(0);
  }
  
  //------------------------------------------------------------------------------
  // DrawInfo Object
  //------------------------------------------------------------------------------
  var DrawingInfo = function(vertices, normals, colors, indices) {
    this.vertices = vertices;
    this.normals = normals;
    this.colors = colors;
    this.indices = indices;
  }
  



//------------------------------------------------------------------------------
// OBJObject Object
//------------------------------------------------------------------------------
var OBJObject = function(name) {
    this.name = name;
    this.faces = new Array(0);
    this.numIndices = 0;
  }
  
  OBJObject.prototype.addFace = function(face) {
    this.faces.push(face);
    this.numIndices += face.numIndices;
  }

  
  export default {
      Face,
      OBJObject,
      Vertex,
      Normal,
      DrawingInfo,
  }
