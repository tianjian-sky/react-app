//------------------------------------------------------------------------------
// MTLDoc Object
//------------------------------------------------------------------------------
var MTLDoc = function() {
    this.complete = false; // MTL is configured correctly
    this.materials = new Array(0);
  }
  
  MTLDoc.prototype.parseNewmtl = function(sp) {
    return sp.getWord();         // Get name
  }
  
  MTLDoc.prototype.parseRGB = function(sp, name) {
    var r = sp.getFloat();
    var g = sp.getFloat();
    var b = sp.getFloat();
    return (new Material(name, r, g, b, 1));
  }
  
    //------------------------------------------------------------------------------
  // Color Object
  //------------------------------------------------------------------------------
  var Color = function(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
  
  //------------------------------------------------------------------------------
  // Material Object
  //------------------------------------------------------------------------------
  var Material = function(name, r, g, b, a) {
    this.name = name;
    this.color = new Color(r, g, b, a);
  }

  export default {
    MTLDoc,
    Material,
    Color
  }
  