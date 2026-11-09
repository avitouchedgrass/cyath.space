"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface AuthCanvasProps {
  theme?: "night" | "day";
  className?: string;
}

export function AuthTesseractCanvas({ theme = "night", className = "" }: AuthCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animId: number;
    let W = container.clientWidth || window.innerWidth;
    let H = container.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const isDay = theme === "day";
    const bgVec = isDay ? new THREE.Vector3(245 / 255, 243 / 255, 236 / 255) : new THREE.Vector3(27 / 255, 27 / 255, 27 / 255);
    const fgVec = isDay ? new THREE.Vector3(28 / 255, 26 / 255, 24 / 255) : new THREE.Vector3(1.0, 1.0, 1.0);
    const bgColor = new THREE.Color().setRGB(bgVec.x, bgVec.y, bgVec.z, THREE.LinearSRGBColorSpace);

    // 1. Renderer & Render Targets
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(W, H, false);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(bgColor, 1);

    const renderTarget = new THREE.WebGLRenderTarget(W * dpr, H * dpr, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });

    // 2. 3D Scene
    const scene = new THREE.Scene();
    scene.background = bgColor;

    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(0, 1.2, 5.8);
    camera.lookAt(0, 0, 0);

    // Lights
    const ambLight = new THREE.AmbientLight(isDay ? 0xe8e4d8 : 0x4b5563, isDay ? 2.4 : 2.8);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, isDay ? 3.2 : 3.6);
    dirLight.position.set(4.0, 5.0, 4.0);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, isDay ? 1.4 : 2.4);
    rimLight.position.set(-3.5, 2.5, -2.5);
    scene.add(rimLight);

    // 3. 3D Isometric Tesseract
    const tesseractGroup = new THREE.Group();
    const isDesktop = W >= 1024;
    tesseractGroup.position.set(isDesktop ? -2.10 : 0, isDesktop ? 0.05 : 0.65, 0);
    scene.add(tesseractGroup);

    // Architectural scale: compact & balanced, crisp presence
    const edgeRadius = 0.021;
    const sOuter = 0.88;
    const sInner = 0.44;

    const strutMat = new THREE.MeshStandardMaterial({
      color: isDay ? 0x1e2026 : 0xf8fafc,
      roughness: 0.20,
      metalness: 0.88,
    });
    const innerStrutMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.16,
      metalness: 0.92,
    });
    const nodeMat = new THREE.MeshStandardMaterial({
      color: isDay ? 0x0f172a : 0xffffff,
      roughness: 0.18,
      metalness: 0.85,
    });

    function makeCylinderEdge(p1: THREE.Vector3, p2: THREE.Vector3, mat: THREE.Material, radius = edgeRadius) {
      const v = new THREE.Vector3().subVectors(p2, p1);
      const len = v.length();
      const geo = new THREE.CylinderGeometry(radius, radius, len, 8);
      const mesh = new THREE.Mesh(geo, mat);
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      mesh.position.copy(mid);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());
      return mesh;
    }

    // Outer Cube Vertices
    const outerVertices: THREE.Vector3[] = [];
    for (let x of [-1, 1]) {
      for (let y of [-1, 1]) {
        for (let z of [-1, 1]) {
          outerVertices.push(new THREE.Vector3(x * sOuter, y * sOuter, z * sOuter));
        }
      }
    }

    const outerGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(edgeRadius * 1.8, 12, 12), nodeMat);
      sphere.position.copy(outerVertices[i]);
      outerGroup.add(sphere);

      for (let j = i + 1; j < 8; j++) {
        const diff = new THREE.Vector3().subVectors(outerVertices[i], outerVertices[j]);
        const dist = diff.length();
        if (Math.abs(dist - sOuter * 2) < 0.05) {
          outerGroup.add(makeCylinderEdge(outerVertices[i], outerVertices[j], strutMat));
        }
      }
    }
    tesseractGroup.add(outerGroup);

    // Inner Cube Vertices
    const innerVertices: THREE.Vector3[] = [];
    for (let x of [-1, 1]) {
      for (let y of [-1, 1]) {
        for (let z of [-1, 1]) {
          innerVertices.push(new THREE.Vector3(x * sInner, y * sInner, z * sInner));
        }
      }
    }

    const innerGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(edgeRadius * 1.5, 12, 12), innerStrutMat);
      sphere.position.copy(innerVertices[i]);
      innerGroup.add(sphere);

      for (let j = i + 1; j < 8; j++) {
        const diff = new THREE.Vector3().subVectors(innerVertices[i], innerVertices[j]);
        const dist = diff.length();
        if (Math.abs(dist - sInner * 2) < 0.05) {
          innerGroup.add(makeCylinderEdge(innerVertices[i], innerVertices[j], innerStrutMat, edgeRadius * 0.85));
        }
      }
    }
    tesseractGroup.add(innerGroup);

    // 8 Connecting Struts
    const connectingGroup = new THREE.Group();
    const connectStrutMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.28,
      metalness: 0.75,
    });
    for (let i = 0; i < 8; i++) {
      connectingGroup.add(makeCylinderEdge(outerVertices[i], innerVertices[i], connectStrutMat, edgeRadius * 0.75));
    }
    tesseractGroup.add(connectingGroup);

    // 4. Exact Landing Page GPU Halftone Shader
    const postScene = new THREE.Scene();
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const postMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D tDiffuse;
        uniform vec2 uResolution;
        uniform float uGridSize;
        uniform vec3 uBgColor;
        uniform vec3 uFgColor;
        uniform float uInvert;
        uniform vec2 uMouse;
        uniform float uMouseStrength;
        uniform float uIsDesktop;

        void main() {
          vec2 fragCoord = vUv * uResolution;
          vec2 cellCoord = fragCoord / uGridSize;

          // Magnetic Halftone Repel displacement
          vec2 mDiff = vUv - uMouse;
          mDiff.x *= uResolution.x / uResolution.y;
          float mDist = length(mDiff);
          float repelRadius = 0.20;
          if (mDist < repelRadius && uMouseStrength > 0.001) {
            float force = 1.0 - mDist / repelRadius;
            force = force * force * (3.0 - 2.0 * force);
            vec2 repelDir = normalize(mDiff);
            cellCoord += repelDir * force * 5.0 * uMouseStrength;
          }

          vec2 quantizedUv = (floor(cellCoord) * uGridSize + uGridSize * 0.5) / uResolution;
          vec4 tex = texture2D(tDiffuse, quantizedUv);
          float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));

          // Check whether cell is empty scene background or 3D geometry
          float bgDist = length(tex.rgb - uBgColor);
          bool isBg = (bgDist < 0.025);

          // Horizontal Dither Fade:
          // Pushed till the exact centre of viewport (vUv.x = 0.50)
          float fade = 1.0;
          if (uIsDesktop > 0.5) {
            fade = 1.0 - smoothstep(0.47, 0.52, vUv.x);
          } else {
            fade = 1.0 - smoothstep(0.42, 0.58, 1.0 - vUv.y);
          }

          vec2 local = fract(cellCoord) - 0.5;
          float d = length(local);

          if (uInvert > 0.5) {
            // DAY MODE: Archival Vellum (#F5F3EC) + Charcoal Ink Dots
            float inkDensity;
            if (isBg) {
              inkDensity = 0.075 * fade;
            } else {
              inkDensity = clamp((0.96 - lum) / 0.82, 0.0, 1.0);
              inkDensity = mix(inkDensity * 0.25, inkDensity, max(fade, 0.65));
            }

            float dotSize = sqrt(inkDensity) * 0.52;
            float dotMask = smoothstep(dotSize + 0.035, dotSize - 0.035, d);
            vec3 inkColor = mix(uFgColor, tex.rgb * 0.45, 0.28);
            vec3 finalColor = mix(uBgColor, inkColor, dotMask);
            gl_FragColor = vec4(finalColor, 1.0);
          } else {
            // NIGHT MODE: Neutral Graphite (#1B1B1B) + Gleaming Chrome / Cyan Dots
            float lightDensity;
            if (isBg) {
              lightDensity = 0.11 * fade;
            } else {
              lightDensity = clamp(lum * 1.30, 0.0, 1.0);
              lightDensity = mix(lightDensity * 0.25, lightDensity, max(fade, 0.65));
            }

            float dotSize = sqrt(lightDensity) * 0.52;
            float dotMask = smoothstep(dotSize + 0.035, dotSize - 0.035, d);
            vec3 dotColor = mix(uFgColor, tex.rgb * 1.35, 0.40);
            vec3 finalColor = mix(uBgColor, dotColor, dotMask);
            gl_FragColor = vec4(finalColor, 1.0);
          }
        }
      `,
      uniforms: {
        tDiffuse: { value: null },
        uResolution: { value: new THREE.Vector2(W * dpr, H * dpr) },
        uGridSize: { value: 3.2 * dpr },
        uBgColor: { value: bgVec },
        uFgColor: { value: fgVec },
        uInvert: { value: isDay ? 1.0 : 0.0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uMouseStrength: { value: 0.0 },
        uIsDesktop: { value: isDesktop ? 1.0 : 0.0 },
      },
      depthWrite: false,
      depthTest: false,
    });

    const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMaterial);
    postScene.add(postQuad);

    // 5. Interaction State
    let isDragging = false;
    let prevMouseX = 0,
      prevMouseY = 0;
    let targetRotX = 0.28,
      targetRotY = 0.52;
    let curRotX = 0.28,
      curRotY = 0.52;
    let mouseUvX = 0.5,
      mouseUvY = 0.5;
    let curMouseUvX = 0.5,
      curMouseUvY = 0.5;
    let curMouseStrength = 0.0;
    let targetMouseActive = 0.0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseUvX = Math.max(0, Math.min(1, x));
      mouseUvY = Math.max(0, Math.min(1, y));
      targetMouseActive = 1.0;

      if (isDragging) {
        const dx = e.clientX - prevMouseX;
        const dy = e.clientY - prevMouseY;
        targetRotY += dx * 0.008;
        targetRotX += dy * 0.006;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const onMouseLeave = () => {
      isDragging = false;
      targetMouseActive = 0.0;
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);

    const onResize = () => {
      if (!container) return;
      W = container.clientWidth || window.innerWidth;
      H = container.clientHeight || window.innerHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();

      const desktopNow = W >= 1024;
      tesseractGroup.position.set(desktopNow ? -2.10 : 0, desktopNow ? 0.05 : 0.65, 0);
      postMaterial.uniforms.uIsDesktop.value = desktopNow ? 1.0 : 0.0;

      renderer.setSize(W, H, false);
      renderTarget.setSize(W * dpr, H * dpr);
      postMaterial.uniforms.uResolution.value.set(W * dpr, H * dpr);
      postMaterial.uniforms.uGridSize.value = 3.2 * dpr;
    };
    window.addEventListener("resize", onResize);

    // 6. Animation Loop
    let lastTime = 0;
    const animate = (time: number) => {
      const dt = (time - lastTime) * 0.001 || 0.016;
      lastTime = time;

      if (!isDragging) {
        targetRotY += dt * 0.28;
        targetRotX = 0.22 + Math.sin(time * 0.0008) * 0.12;
      }

      curRotX += (targetRotX - curRotX) * 0.08;
      curRotY += (targetRotY - curRotY) * 0.08;
      tesseractGroup.rotation.x = curRotX;
      tesseractGroup.rotation.y = curRotY;

      innerGroup.rotation.x = -curRotX * 1.5;
      innerGroup.rotation.y = -curRotY * 1.5;
      const innerScale = 0.95 + Math.sin(time * 0.002) * 0.15;
      innerGroup.scale.set(innerScale, innerScale, innerScale);

      curMouseUvX += (mouseUvX - curMouseUvX) * 0.15;
      curMouseUvY += (1.0 - mouseUvY - curMouseUvY) * 0.15;
      curMouseStrength += (targetMouseActive - curMouseStrength) * 0.08;
      postMaterial.uniforms.uMouse.value.set(curMouseUvX, curMouseUvY);
      postMaterial.uniforms.uMouseStrength.value = curMouseStrength;

      renderer.setRenderTarget(renderTarget);
      renderer.render(scene, camera);

      renderer.setRenderTarget(null);
      postMaterial.uniforms.tDiffuse.value = renderTarget.texture;
      renderer.render(postScene, postCamera);

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);

      renderer.dispose();
      renderTarget.dispose();
      postMaterial.dispose();
      strutMat.dispose();
      innerStrutMat.dispose();
      nodeMat.dispose();
      connectStrutMat.dispose();
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing ${className}`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
