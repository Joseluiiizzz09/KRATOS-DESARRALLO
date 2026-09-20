/**
 * Fluid Orb — animated WebGL orb with drifting fluid shading.
 * Vanilla JS port of https://github.com/swamimalode07/rare-ui (fluid-orb component).
 * No framework/build step required; usable directly on any <canvas>.
 */
(function () {
  'use strict';

  var VERT = [
    'attribute vec2 a_pos;',
    'void main() {',
    '  gl_Position = vec4(a_pos, 0.0, 1.0);',
    '}',
  ].join('\n');

  var FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    '',
    'uniform vec2 u_resolution;',
    'uniform float u_time;',
    'uniform vec3 u_color;',
    '',
    'float hash(vec2 p) {',
    '  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);',
    '}',
    '',
    'float noise(vec2 p) {',
    '  vec2 i = floor(p);',
    '  vec2 f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(',
    '    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),',
    '    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),',
    '    u.y',
    '  );',
    '}',
    '',
    'float fbm(vec2 p) {',
    '  float v = 0.0;',
    '  float a = 0.6;',
    '  for (int i = 0; i < 3; i++) {',
    '    v += a * noise(p);',
    '    p *= 2.0;',
    '    a *= 0.5;',
    '  }',
    '  return v;',
    '}',
    '',
    'void main() {',
    '  vec2 uv = gl_FragCoord.xy / u_resolution.xy;',
    '  float t = u_time * 0.22;',
    '',
    '  vec2 drift = vec2(',
    '    sin(t) + 0.6 * sin(t * 1.7 + 1.3),',
    '    cos(t * 0.8) + 0.6 * cos(t * 1.3 + 2.1)',
    '  );',
    '',
    '  vec2 p = vec2(uv.x * 1.8, uv.y * 1.0) + drift * 0.7;',
    '',
    '  vec2 q = vec2(fbm(p + drift), fbm(p + vec2(3.2, 1.5) - drift));',
    '  float f = fbm(p + 1.2 * q);',
    '',
    '  float g = clamp(1.0 - uv.y, 0.0, 1.0);',
    '  float anchor = smoothstep(0.0, 0.3, uv.y);',
    '  float shade = clamp(g + (f - 0.5) * 0.8 * anchor, 0.0, 1.0);',
    '',
    '  vec3 white = vec3(0.99, 1.0, 1.0);',
    '  vec3 light = mix(white, u_color, 0.5);',
    '  vec3 dark = u_color;',
    '',
    '  vec3 col = white;',
    '  col = mix(col, light, smoothstep(0.28, 0.52, shade));',
    '  col = mix(col, dark, smoothstep(0.58, 0.88, shade));',
    '',
    '  float edge = smoothstep(0.5, 0.49, distance(uv, vec2(0.5)));',
    '',
    '  gl_FragColor = vec4(col * edge, edge);',
    '}',
  ].join('\n');

  function hexToRgb(hex) {
    var h = String(hex || '').replace('#', '').trim();
    if (h.length === 3) {
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    var n = parseInt(h, 16);
    if (h.length !== 6 || isNaN(n)) return [0.1, 0.45, 0.95];
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function compile(gl, type, src) {
    var shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  /**
   * Mounts an animated fluid orb into the given canvas element.
   * @param {HTMLCanvasElement} canvas
   * @param {{size?: number, color?: string}} [options]
   * @returns {{destroy: function(): void}}
   */
  function mountFluidOrb(canvas, options) {
    var opts = options || {};
    var size = opts.size || 240;
    var color = opts.color || '#1A73F2';

    var gl = canvas.getContext('webgl', { antialias: true, alpha: true });
    if (!gl) return { destroy: function () {} };

    var program = gl.createProgram();
    var vert = compile(gl, gl.VERTEX_SHADER, VERT);
    var frag = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!program || !vert || !frag) return { destroy: function () {} };

    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return { destroy: function () {} };
    }
    gl.useProgram(program);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var uResolution = gl.getUniformLocation(program, 'u_resolution');
    var uTime = gl.getUniformLocation(program, 'u_time');
    var rgb = hexToRgb(color);
    gl.uniform3f(gl.getUniformLocation(program, 'u_color'), rgb[0], rgb[1], rgb[2]);

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var px = Math.round(size * dpr);
    canvas.width = px;
    canvas.height = px;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    gl.viewport(0, 0, px, px);
    gl.uniform2f(uResolution, px, px);

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var start = performance.now();
    var raf = 0;

    function render(now) {
      gl.uniform1f(uTime, reduce ? 0 : (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!reduce) raf = requestAnimationFrame(render);
    }
    render(start);

    return {
      destroy: function () {
        cancelAnimationFrame(raf);
        gl.deleteProgram(program);
        gl.deleteShader(vert);
        gl.deleteShader(frag);
        gl.deleteBuffer(buffer);
      },
    };
  }

  /** Auto-mounts every `[data-fluid-orb]` canvas found on the page. */
  function autoMount() {
    document.querySelectorAll('canvas[data-fluid-orb]').forEach(function (canvas) {
      mountFluidOrb(canvas, {
        size: Number(canvas.getAttribute('data-size')) || canvas.width || 40,
        color: canvas.getAttribute('data-color') || '#1A73F2',
      });
    });
  }

  window.mountFluidOrb = mountFluidOrb;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount);
  } else {
    autoMount();
  }
})();
