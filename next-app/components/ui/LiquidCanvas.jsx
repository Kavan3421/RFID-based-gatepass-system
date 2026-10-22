"use client";

import { useEffect, useRef } from "react";

/**
 * LiquidCanvas: Apple iOS Liquid Glass OS Micro-Refractive Water Ripple Canvas
 * - Completely transparent by default (zero smoke streaks, zero milky smudges, zero pinched holes).
 * - Reacts only to direct pointer movement and clicks with subtle, micro-refractive ripples.
 * - Gentle optical refraction and soft specular highlights that fade cleanly back to 100% transparent.
 * - High-performance WebGL with graceful Canvas2D fallback.
 */
export default function LiquidCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl = null;
    try {
      gl =
        canvas.getContext("webgl2", {
          alpha: true,
          antialias: true,
          premultipliedAlpha: false,
        }) ||
        canvas.getContext("webgl", {
          alpha: true,
          antialias: true,
          premultipliedAlpha: false,
        });
    } catch (_) {
      gl = null;
    }

    let animationFrameId = null;
    let isDisposed = false;

    // Ripple state: stores active pointer ripples
    const ripples = [];
    const MAX_RIPPLES = 8;
    let mouseX = 0.5;
    let mouseY = 0.5;
    let targetMouseX = 0.5;
    let targetMouseY = 0.5;
    let mouseSpeed = 0.0;
    let lastMoveTime = performance.now();
    let lastRippleSpawnTime = 0;
    let prevX = 0.5;
    let prevY = 0.5;

    const handlePointerMove = (e) => {
      const now = performance.now();
      const dt = Math.max(1, now - lastMoveTime);
      const nx = e.clientX / window.innerWidth;
      const ny = 1.0 - e.clientY / window.innerHeight; // Invert for WebGL UV

      const dist = Math.hypot(nx - prevX, ny - prevY);
      const speed = Math.min(1.0, (dist / (dt * 0.001)) * 0.08);
      mouseSpeed = mouseSpeed * 0.7 + speed * 0.3;

      targetMouseX = nx;
      targetMouseY = ny;

      // Spawn subtle ripple on deliberate cursor movement (throttled)
      if (dist > 0.04 && now - lastRippleSpawnTime > 300) {
        ripples.push({
          x: nx,
          y: ny,
          startTime: now,
          strength: Math.min(0.6, 0.25 + mouseSpeed * 0.35),
          duration: 2400, // 2.4s gentle propagation
        });
        lastRippleSpawnTime = now;
        if (ripples.length > MAX_RIPPLES) ripples.shift();
      }

      prevX = nx;
      prevY = ny;
      lastMoveTime = now;
    };

    const handlePointerDown = (e) => {
      const now = performance.now();
      const nx = e.clientX / window.innerWidth;
      const ny = 1.0 - e.clientY / window.innerHeight;

      ripples.push({
        x: nx,
        y: ny,
        startTime: now,
        strength: 0.8,
        duration: 2600,
      });
      lastRippleSpawnTime = now;
      if (ripples.length > MAX_RIPPLES) ripples.shift();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    if (gl) {
      // Vertex Shader
      const vsSource = `
        attribute vec2 a_position;
        varying vec2 v_uv;
        void main() {
          v_uv = (a_position + 1.0) * 0.5;
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;

      // Fragment Shader: Completely transparent resting state; subtle micro-refractive ripples on hover/click
      const fsSource = `
        precision highp float;
        varying vec2 v_uv;

        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec2 u_mouse;
        uniform float u_mouse_speed;
        uniform vec4 u_ripples[8]; // xy: center, z: age (0-1), w: strength
        uniform int u_ripple_count;
        uniform float u_is_light;

        void main() {
          vec2 uv = v_uv;
          float aspect = u_resolution.x / u_resolution.y;

          // If no active ripples and cursor is still, remain 100% transparent
          if (u_ripple_count == 0 && u_mouse_speed < 0.01) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
            return;
          }

          vec2 p = uv;
          p.x *= aspect;

          float h = 0.0;

          // Subtle cursor depression only when moving
          if (u_mouse_speed > 0.02) {
            vec2 mPos = vec2(u_mouse.x * aspect, u_mouse.y);
            float mDist = length(p - mPos);
            float mRadius = 0.08;
            h += exp(-pow(mDist / mRadius, 2.0)) * u_mouse_speed * 0.025;
          }

          // Active ripples: calculate physical wave displacement
          for (int i = 0; i < 8; i++) {
            if (i >= u_ripple_count) break;
            vec4 rip = u_ripples[i];
            float age = rip.z;
            if (age >= 1.0) continue;

            vec2 ripPos = vec2(rip.x * aspect, rip.y);
            float dist = length(p - ripPos);
            float radius = age * 0.42; // Soft propagation ring
            float waveWidth = 0.06;
            float delta = dist - radius;

            // Exponential ring envelope + sinusoidal wavefront
            float wave = exp(-pow(delta / waveWidth, 2.0)) * sin(delta * 24.0 - age * 6.0);
            float decay = pow(1.0 - age, 2.2);
            h += wave * decay * rip.w * 0.04;
          }

          float absH = abs(h);
          if (absH < 0.0005) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
            return;
          }

          // Normal estimation from height gradient
          vec2 eps = vec2(2.0 / u_resolution.x, 2.0 / u_resolution.y);
          vec3 dX = vec3(eps.x, 0.0, h * 6.0);
          vec3 dY = vec3(0.0, eps.y, h * 6.0);
          vec3 normal = normalize(cross(dX, dY));

          // Soft specular highlight on ripple crests
          vec3 lightDir = normalize(vec3(-0.25, 0.85, 0.65));
          vec3 viewDir = vec3(0.0, 0.0, 1.0);
          vec3 halfVec = normalize(lightDir + viewDir);

          float NdotH = max(dot(normal, halfVec), 0.0);
          float spec = pow(NdotH, 32.0) * 0.35;

          // Subtle cyan/emerald or pearl refractive tint
          vec3 tint = mix(vec3(0.12, 0.82, 0.95), vec3(0.85, 0.92, 1.0), u_is_light);
          vec3 rgb = mix(tint, vec3(1.0, 1.0, 1.0), spec * 0.8);

          // Alpha is strictly confined to the ripple crest, fading to zero
          float rippleAlpha = clamp(absH * 4.5 + spec * 0.25, 0.0, 0.22);

          gl_FragColor = vec4(rgb, rippleAlpha);
        }
      `;

      const createShader = (type, source) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, source);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          console.warn("LiquidCanvas shader error:", gl.getShaderInfoLog(s));
          gl.deleteShader(s);
          return null;
        }
        return s;
      };

      const vs = createShader(gl.VERTEX_SHADER, vsSource);
      const fs = createShader(gl.FRAGMENT_SHADER, fsSource);

      if (vs && fs) {
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
          gl.useProgram(program);

          // Fullscreen Quad Buffer
          const quadBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
          gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
            gl.STATIC_DRAW
          );

          const aPosition = gl.getAttribLocation(program, "a_position");
          gl.enableVertexAttribArray(aPosition);
          gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

          const uResolution = gl.getUniformLocation(program, "u_resolution");
          const uTime = gl.getUniformLocation(program, "u_time");
          const uMouse = gl.getUniformLocation(program, "u_mouse");
          const uMouseSpeed = gl.getUniformLocation(program, "u_mouse_speed");
          const uRipples = gl.getUniformLocation(program, "u_ripples");
          const uRippleCount = gl.getUniformLocation(program, "u_ripple_count");
          const uIsLight = gl.getUniformLocation(program, "u_is_light");

          // Alpha blending configuration
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

          const startTime = performance.now();
          let currentLight = 0.0;

          const renderGL = () => {
            if (isDisposed) return;
            const now = performance.now();
            const elapsed = (now - startTime) * 0.001;

            const isLightTarget =
              typeof document !== "undefined" &&
              (document.documentElement.classList.contains("light") ||
                document.documentElement.getAttribute("data-theme") === "light")
                ? 1.0
                : 0.0;
            currentLight += (isLightTarget - currentLight) * 0.1;

            // Pointer interpolation
            mouseX += (targetMouseX - mouseX) * 0.12;
            mouseY += (targetMouseY - mouseY) * 0.12;
            mouseSpeed *= 0.92;

            // Prune expired ripples
            for (let i = ripples.length - 1; i >= 0; i--) {
              const rip = ripples[i];
              const age = (now - rip.startTime) / rip.duration;
              if (age >= 1.0) {
                ripples.splice(i, 1);
              }
            }

            const activeCount = Math.min(ripples.length, MAX_RIPPLES);
            const rippleData = new Float32Array(MAX_RIPPLES * 4);
            for (let i = 0; i < activeCount; i++) {
              const rip = ripples[i];
              const age = Math.min(1.0, (now - rip.startTime) / rip.duration);
              rippleData[i * 4 + 0] = rip.x;
              rippleData[i * 4 + 1] = rip.y;
              rippleData[i * 4 + 2] = age;
              rippleData[i * 4 + 3] = rip.strength;
            }

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.uniform2f(uResolution, canvas.width, canvas.height);
            gl.uniform1f(uTime, elapsed);
            gl.uniform2f(uMouse, mouseX, mouseY);
            gl.uniform1f(uMouseSpeed, mouseSpeed);
            gl.uniform4fv(uRipples, rippleData);
            gl.uniform1i(uRippleCount, activeCount);
            gl.uniform1f(uIsLight, currentLight);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
            animationFrameId = requestAnimationFrame(renderGL);
          };

          animationFrameId = requestAnimationFrame(renderGL);
          return () => {
            isDisposed = true;
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("resize", resize);
          };
        }
      }
    }

    // Canvas2D Fallback: completely transparent canvas with soft micro-rings
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render2D = () => {
      if (isDisposed) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = performance.now();
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        const age = (now - rip.startTime) / rip.duration;
        if (age >= 1.0) {
          ripples.splice(i, 1);
          continue;
        }

        const radius = age * Math.min(canvas.width, canvas.height) * 0.35;
        const alpha = Math.max(0, (1 - age) * 0.12 * rip.strength);
        ctx.beginPath();
        ctx.arc(rip.x * canvas.width, (1.0 - rip.y) * canvas.height, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render2D);
    };

    animationFrameId = requestAnimationFrame(render2D);
    return () => {
      isDisposed = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full block"
      style={{
        width: "100vw",
        height: "100vh",
      }}
      aria-hidden="true"
    />
  );
}
