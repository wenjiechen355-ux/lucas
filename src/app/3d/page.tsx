'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Loader2, RotateCcw, Info } from 'lucide-react'

export default function ThreeDScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hovered, setHovered] = useState('')
  const controlsRef = useRef<OrbitControls | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const w = container.clientWidth
    const h = container.clientHeight || 600

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x080c18)
    scene.fog = new THREE.Fog(0x080c18, 3, 12)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 50)
    camera.position.set(0, 1.2, 4.5)
    camera.lookAt(0, 0.7, 0)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)

    // Lights
    const ambient = new THREE.AmbientLight(0x334466, 2)
    scene.add(ambient)

    const key = new THREE.DirectionalLight(0xffffff, 3)
    key.position.set(2, 3, 2)
    key.castShadow = true
    scene.add(key)

    const fill = new THREE.DirectionalLight(0x4488cc, 1.5)
    fill.position.set(-2, 1, -1)
    scene.add(fill)

    const rim = new THREE.DirectionalLight(0x88ccff, 2)
    rim.position.set(0, -0.5, -2)
    scene.add(rim)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 0.7, 0)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.4
    controls.minDistance = 2
    controls.maxDistance = 8
    controls.maxPolarAngle = Math.PI * 0.7
    controlsRef.current = controls

    // Load GLB
    const loader = new GLTFLoader()
    loader.load(
      '/3d_scene.glb',
      (gltf) => {
        // Center the model
        const box = new THREE.Box3().setFromObject(gltf.scene)
        const center = box.getCenter(new THREE.Vector3())
        gltf.scene.position.sub(center)
        gltf.scene.position.y += 0.2
        scene.add(gltf.scene)

        // Store individual objects for raycaster
        gltf.scene.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })

        setLoading(false)
      },
      (progress) => {
        // Loading progress
      },
      (err: any) => {
        setError('3D 场景加载失败：' + (err?.message || '未知错误'))
        setLoading(false)
      }
    )

    // Raycaster for hover
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    let meshes: THREE.Mesh[] = []

    function onMouseMove(e: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      if (sceneRef.current) {
        sceneRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh && child.parent !== sceneRef.current) {
            meshes.push(child as THREE.Mesh)
          }
        })
      }

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(meshes, false)
      if (intersects.length > 0) {
        const obj = intersects[0].object
        const name = obj.name || (obj.parent?.name || '')
        setHovered(name)
      } else {
        setHovered('')
      }
      meshes = []
    }

    window.addEventListener('mousemove', onMouseMove)

    // Animation loop
    function animate() {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Resize
    function onResize() {
      camera.aspect = container.clientWidth / (container.clientHeight || 600)
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight || 600)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  function resetView() {
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0.7, 0)
      controlsRef.current.update()
    }
  }

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#080c18] z-10">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-3" />
            <p className="text-sm text-gray-400">加载 3D 场景中...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#080c18] z-10">
          <div className="text-center max-w-md p-6">
            <p className="text-red-400 text-sm mb-2">{error}</p>
            <p className="text-xs text-gray-500">请确认 public/3d_scene.glb 文件存在</p>
          </div>
        </div>
      )}

      {/* 3D Canvas */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Controls overlay */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2">
        <button
          onClick={resetView}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg text-xs text-white/80 hover:bg-white/20 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> 重置视角
        </button>
      </div>

      {/* Hover info */}
      {hovered && (
        <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg text-xs text-cyan-300 flex items-center gap-1.5">
          <Info className="w-3 h-3" />
          {hovered}
        </div>
      )}

      {/* Instructions */}
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/5 backdrop-blur-sm rounded-lg text-xs text-white/40">
        🖱 拖拽旋转 · 滚轮缩放 · 右键平移
      </div>
    </div>
  )
}
