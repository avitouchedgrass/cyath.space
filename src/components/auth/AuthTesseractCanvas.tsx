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
    let W = container.clientWidth || 600;
    let H = container.clientHeight || 800;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const isDay = theme === "day";
    const bgColor = new THREE.Color(isDay ? 0xf5f3ec : 0x1b1b1b);
    const fgColor = new THREE.Color(isDay ? 0x1c1a18 : 0xffffff);

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

    // 3. 3D Isometric Tesseract (4D Hypercube)
    const tesseractGroup = new THREE.Group();
    scene.add(tesseractGroup);

    const edgeRadius = 0.024;
    const strutMat = new THREE.MeshStandardMaterial({
      color: isDay ? 0x1e2026 : 0xf8fafc,
      roughness: 0.25,
      metalness: 0.85,
    });
    const innerStrutMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.2,
      metalness: 0.9,
    });
    const nodeMat = new THREE.MeshStandardMaterial({
      color: isDay ? 0x0f172a : 0xffffff,
      roughness: 0.2,
      metalness: 0.8,
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

    // Outer Cube (Size 2.2)
    const sOuter = 1.15;
    const outerVertices: THREE.Vector3[] = [];
    for (let x of [-1, 1]) {
      for (let y of [-1, 1]) {
        for (let z of [-1, 1]) {
          outerVertices.push(new THREE.Vector3(x * sOuter, y * sOuter, z * sOuter));
        }
      }
    }

    // Outer edges
    const outerGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      // Node sphere
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(edgeRadius * 1.8, 12, 12), nodeMat);
      sphere.position.copy(outerVertices[i]);
      outerGroup.add(sphere);

      for (let j = i + 1; j < 8; j++) {
        const diff = new THREE.Vector3().subVectors(outerVertices[i], outerVertices[j]);
        const dist = diff.length();
        // Connected if 1 coordinate difference (dist = 2 * sOuter)
        if (Math.abs(dist - sOuter * 2) < 0.05) {
          outerGroup.add(makeCylinderEdge(outerVertices[i], outerVertices[j], strutMat));
        }
      }
    }
    tesseractGroup.add(outerGroup);

    // Inner Cube (Size 0.62)
    const sInner = 0.58;
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

    // 8 Connecting struts from outer to inner vertices
    const connectingGroup = new THREE.Group();
    const connectStrutMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.3,
      metalness: 0.7,
    });
    for (let i = 0; i < 8; i++) {
      connectingGroup.add(makeCylinderEdge(outerVertices[i], innerVertices[i], connectStrutMat, edgeRadius * 0.75));
    }
    tesseractGroup.add(connectingGroup);

    // 4. Post-processing Halftone Screen Shader
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
        uniform sampler2D tDiffuse;
        uniform vec2 uResolution;
        uniform float uGridSize;
        uniform int uMethod;
        uniform vec3 uBgColor;
        uniform vec3 uFgColor;
        uniform float uInvert;
        uniform vec2 uMouse;
        uniform float uMouseStrength;
        varying vec2 vUv;

        void main() {
          vec2 fragCoord = vUv * uResolution;
          vec2 cellCoord = fragCoord / uGridSize;

          // Magnetic Halftone Repel
          vec2 mDiff = vUv - uMouse;
          mDiff.x *= uResolution.x / uResolution.y;
          float mDist = length(mDiff);
          float repelRadius = 0.22;
          if (mDist < repelRadius && uMouseStrength > 0.001) {
            float force = 1.0 - mDist / repelRadius;
            force = force * force * (3.0 - 2.0 * force);
            vec2 repelDir = normalize(mDiff);
            cellCoord += repelDir * force * 5.5 * uMouseStrength;
          }

          vec2 quantizedUv = (floor(cellCoord) * uGridSize + uGridSize * 0.5) / uResolution;
          vec4 tex = texture2D(tDiffuse, quantizedUv);
          float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));

          if (uInvert > 0.5) {
            lum = 1.0 - lum;
          }

          vec2 local = fract(cellCoord) - 0.5;
          float d = length(local);
          float dotSize = sqrt(lum) * 0.52;
          float dotMask = smoothstep(dotSize + 0.04, dotSize - 0.04, d);

          vec3 finalColor = mix(uBgColor, uFgColor, dotMask);
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      uniforms: {
        tDiffuse: { value: null },
        uResolution: { value: new THREE.Vector2(W * dpr, H * dpr) },
        uGridSize: { value: 3.2 * dpr },
        uMethod: { value: 1 },
        uBgColor: { value: bgColor },
        uFgColor: { value: fgColor },
        uInvert: { value: isDay ? 1.0 : 0.0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uMouseStrength: { value: 0.0 },
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
      W = container.clientWidth || 600;
      H = container.clientHeight || 800;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();

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

      // Continuous subtle hypercube rotation
      if (!isDragging) {
        targetRotY += dt * 0.28;
        targetRotX = 0.22 + Math.sin(time * 0.0008) * 0.12;
      }

      curRotX += (targetRotX - curRotX) * 0.08;
      curRotY += (targetRotY - curRotY) * 0.08;
      tesseractGroup.rotation.x = curRotX;
      tesseractGroup.rotation.y = curRotY;

      // Internal cube counter-rotation (4D pulsation illusion)
      innerGroup.rotation.x = -curRotX * 1.5;
      innerGroup.rotation.y = -curRotY * 1.5;
      const innerScale = 0.95 + Math.sin(time * 0.002) * 0.15;
      innerGroup.scale.set(innerScale, innerScale, innerScale);

      // Mouse lerp
      curMouseUvX += (mouseUvX - curMouseUvX) * 0.15;
      curMouseUvY += (1.0 - mouseUvY - curMouseUvY) * 0.15;
      curMouseStrength += (targetMouseActive - curMouseStrength) * 0.08;
      postMaterial.uniforms.uMouse.value.set(curMouseUvX, curMouseUvY);
      postMaterial.uniforms.uMouseStrength.value = curMouseStrength;

      // PASS 1: Render 3D Scene to Target
      renderer.setRenderTarget(renderTarget);
      renderer.render(scene, camera);

      // PASS 2: Halftone Screen-Space Shader
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
