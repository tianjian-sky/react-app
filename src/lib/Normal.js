
import Cuon from './cuon-matrix'


/**
 * 给定三个点，计算他们所构成点的法向量
 * @param {*} p0 
 * @param {*} p1 
 * @param {*} p2 
 */
function calcNormal(p0, p1, p2) {
    // v0: a vector from p1 to p0, v1; a vector from p1 to p2
    var v0 = new Float32Array(3);
    var v1 = new Float32Array(3);
    for (var i = 0; i < 3; i++){
      v0[i] = p0[i] - p1[i];
      v1[i] = p2[i] - p1[i];
    }
  
    // The cross product of v0 and v1
    var c = new Float32Array(3);
    c[0] = v0[1] * v1[2] - v0[2] * v1[1];
    c[1] = v0[2] * v1[0] - v0[0] * v1[2];
    c[2] = v0[0] * v1[1] - v0[1] * v1[0];
  
    // Normalize the result
    var v = new Cuon.Vector3(c);
    v.normalize();
    return v.elements;
  }
  
  export default {
    calcNormal
  }
