import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, User, Lock, Globe2, ArrowLeft, LogIn, KeyRound, ShieldCheck, Loader2 } from 'lucide-react'
import * as THREE from 'three'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import logoImg from '@/images/logotralien.jpg'
import '@/styles/login.css'

// Tọa độ trung tâm Xã Trà Liên, Thành phố Đà Nẵng
const LAT = 15.6674937
const LNG = 108.3945889

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuth()
  const [showPwd, setShowPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [mode, setMode] = useState('login') // 'login' | 'forgot' | 'reset'
  const [showMap, setShowMap] = useState(false)

  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [forgotUsername, setForgotUsername] = useState('')
  const [resetForm, setResetForm] = useState({ otp: '', newPassword: '', confirmPassword: '' })

  const globeRef = useRef(null)
  const mapRef = useRef(null)
  const r = useRef({})

  // ── Mutations ──────────────────────────────────────────────────────────────
  const loginMutation = useMutation({
    mutationFn: (data) => api.post('/api/auth/login', data).then((res) => res.data),
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      navigate('/dashboard', { replace: true })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Đăng nhập thất bại'),
  })

  const forgotMutation = useMutation({
    mutationFn: () => api.post('/api/auth/forgot-password', { username: forgotUsername.trim() }).then((res) => res.data),
    onSuccess: () => {
      toast.success('Mã OTP đã gửi qua Zalo của bạn')
      setMode('reset')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Gửi OTP thất bại'),
  })

  const resetMutation = useMutation({
    mutationFn: () =>
      api.post('/api/auth/reset-password', {
        username: forgotUsername.trim(),
        otp: resetForm.otp.trim(),
        newPassword: resetForm.newPassword,
      }).then((res) => res.data),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.')
      setMode('login')
      setLoginForm((f) => ({ ...f, username: forgotUsername }))
      setForgotUsername('')
      setResetForm({ otp: '', newPassword: '', confirmPassword: '' })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Đặt lại mật khẩu thất bại'),
  })

  // ── Form handlers ──────────────────────────────────────────────────────────
  const handleLogin = (e) => {
    e.preventDefault()
    if (!loginForm.username || !loginForm.password) {
      toast.error('Vui lòng nhập đầy đủ thông tin')
      return
    }
    loginMutation.mutate(loginForm)
  }

  const handleForgot = (e) => {
    e.preventDefault()
    if (!forgotUsername.trim()) { toast.error('Vui lòng nhập tên đăng nhập'); return }
    forgotMutation.mutate()
  }

  const handleReset = (e) => {
    e.preventDefault()
    if (!resetForm.otp.trim()) { toast.error('Vui lòng nhập mã OTP'); return }
    if (resetForm.newPassword.length < 6) { toast.error('Mật khẩu mới phải có ít nhất 6 ký tự'); return }
    if (resetForm.newPassword !== resetForm.confirmPassword) { toast.error('Mật khẩu xác nhận không khớp'); return }
    resetMutation.mutate()
  }

  // ── Three.js helpers ───────────────────────────────────────────────────────
  useEffect(() => { r.current.showMapNow = showMap }, [showMap])

  function latLngToVec3(lat, lng, radius) {
    const phi = (90 - lat) * Math.PI / 180
    const theta = (lng + 180) * Math.PI / 180
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    )
  }

  function makeGlowTexture() {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const g = c.getContext('2d')
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    grd.addColorStop(0, 'rgba(255,228,140,1)')
    grd.addColorStop(0.3, 'rgba(255,205,80,0.55)')
    grd.addColorStop(1, 'rgba(255,205,80,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, 64, 64)
    return new THREE.CanvasTexture(c)
  }

  function initGlobe() {
    const container = globeRef.current
    if (!container) return
    const w = container.clientWidth, h = container.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100)
    camera.position.z = 3.0
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w, h)
    container.appendChild(renderer.domElement)
    r.current.scene = scene; r.current.camera = camera; r.current.renderer = renderer

    const loader = new THREE.TextureLoader()
    loader.crossOrigin = 'anonymous'
    const base = 'https://unpkg.com/three-globe/example/img/'
    const earthMat = new THREE.MeshPhongMaterial({
      map: loader.load(base + 'earth-blue-marble.jpg'),
      bumpMap: loader.load(base + 'earth-topology.png'),
      bumpScale: 0.012,
      specularMap: loader.load(base + 'earth-water.png'),
      specular: new THREE.Color(0x2a4a72),
      shininess: 10,
    })
    const group = new THREE.Group()
    const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), earthMat)
    group.add(earth)
    scene.add(group)
    r.current.group = group

    const atmMat = new THREE.ShaderMaterial({
      vertexShader: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'varying vec3 vN; void main(){ float i = pow(0.62 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(0.32,0.62,1.0,1.0) * i; }',
      blending: THREE.AdditiveBlending, side: THREE.BackSide, transparent: true,
    })
    const atm = new THREE.Mesh(new THREE.SphereGeometry(1.2, 64, 64), atmMat)
    scene.add(atm)

    scene.add(new THREE.AmbientLight(0xbcd2f5, 0.6))
    const dir = new THREE.DirectionalLight(0xffffff, 1.15)
    dir.position.set(2.2, 1.0, 2.8)
    scene.add(dir)

    const pos = latLngToVec3(LAT, LNG, 1.01)
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.011, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd23f })
    )
    dot.position.copy(pos)
    group.add(dot)
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(), color: 0xffffff, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }))
    sprite.scale.set(0.13, 0.13, 1)
    sprite.position.copy(pos)
    group.add(sprite)
    r.current.markerSprite = sprite

    r.current.targetRotY = -Math.atan2(pos.x, pos.z)
    r.current.targetRotX = Math.atan2(pos.y, Math.sqrt(pos.x * pos.x + pos.z * pos.z))
    group.rotation.y = r.current.targetRotY - 0.5
    group.rotation.x = 0.12

    bindInteraction(renderer.domElement)

    r.current.onResize = () => {
      const nw = container.clientWidth, nh = container.clientHeight
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', r.current.onResize)

    const animate = () => {
      r.current.raf = requestAnimationFrame(animate)
      if (!r.current.dragging && !r.current.flying && !r.current.showMapNow) {
        group.rotation.y += 0.0006
      }
      if (r.current.markerSprite) {
        const s = 0.12 + Math.sin(performance.now() * 0.003) * 0.028
        r.current.markerSprite.scale.set(s, s, 1)
      }
      renderer.render(scene, camera)
    }
    animate()
  }

  function bindInteraction(dom) {
    let isDown = false, lastX = 0, lastY = 0, moved = 0
    const onDown = (e) => {
      if (r.current.showMapNow) return
      isDown = true; r.current.dragging = true; lastX = e.clientX; lastY = e.clientY; moved = 0
      dom.style.cursor = 'grabbing'
    }
    const onMove = (e) => {
      if (!isDown || !r.current.group) return
      const dx = e.clientX - lastX, dy = e.clientY - lastY
      lastX = e.clientX; lastY = e.clientY
      moved += Math.abs(dx) + Math.abs(dy)
      r.current.group.rotation.y += dx * 0.005
      r.current.group.rotation.x += dy * 0.005
      r.current.group.rotation.x = Math.max(-1.2, Math.min(1.2, r.current.group.rotation.x))
    }
    const onUp = () => {
      if (!isDown) return
      isDown = false
      dom.style.cursor = 'grab'
      setTimeout(() => { r.current.dragging = false }, 350)
      if (moved < 6 && !r.current.flying && !r.current.showMapNow) flyTo()
    }
    const onWheel = (e) => {
      if (!r.current.camera) return
      e.preventDefault()
      r.current.camera.position.z = Math.max(1.55, Math.min(4.2, r.current.camera.position.z + e.deltaY * 0.0015))
    }
    dom.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    dom.addEventListener('wheel', onWheel, { passive: false })
    r.current.cleanupInteraction = () => {
      dom.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      dom.removeEventListener('wheel', onWheel)
    }
  }

  function flyTo() {
    if (r.current.flying || !r.current.group) return
    r.current.flying = true
    const g = r.current.group, cam = r.current.camera
    const startY = g.rotation.y, startX = g.rotation.x, startZ = cam.position.z
    let ty = r.current.targetRotY
    while (ty - startY > Math.PI) ty -= 2 * Math.PI
    while (ty - startY < -Math.PI) ty += 2 * Math.PI
    const tx = r.current.targetRotX, tz = 1.5
    const dur = 2000, t0 = performance.now()
    const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    let done = false
    const finish = () => {
      if (done) return
      done = true
      g.rotation.y = ty; g.rotation.x = tx; cam.position.z = tz
      if (globeRef.current) globeRef.current.style.opacity = '0'
      setTimeout(() => {
        r.current.flying = false
        setShowMap(true)
        setTimeout(() => initMap(), 220)
      }, 550)
    }
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur)
      const e = ease(p)
      g.rotation.y = startY + (ty - startY) * e
      g.rotation.x = startX + (tx - startX) * e
      cam.position.z = startZ + (tz - startZ) * e
      if (p < 1) requestAnimationFrame(step)
      else finish()
    }
    requestAnimationFrame(step)
    setTimeout(finish, dur + 350)
  }

  function backToGlobe() {
    if (r.current.lmap) { try { r.current.lmap.remove() } catch { /* noop */ } r.current.lmap = null }
    setShowMap(false)
    r.current.flying = false
    if (r.current.camera) r.current.camera.position.z = 3.0
    if (r.current.group) {
      r.current.group.rotation.y = r.current.targetRotY - 0.5
      r.current.group.rotation.x = 0.12
    }
    if (globeRef.current) globeRef.current.style.opacity = '1'
  }

  function initMap() {
    if (!mapRef.current) { setTimeout(initMap, 90); return }
    const el = mapRef.current
    if (r.current.lmap) { try { r.current.lmap.remove() } catch { /* noop */ } r.current.lmap = null }

    const map = L.map(el, { center: [LAT, LNG], zoom: 13, zoomControl: true, attributionControl: true })
    r.current.lmap = map

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19, attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
    }).addTo(map)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19, opacity: 0.9,
    }).addTo(map)

    setTimeout(() => { try { map.invalidateSize() } catch { /* noop */ } }, 140)

    const pinIcon = L.divIcon({
      className: 'dailoc-pin',
      html: '<div style="width:22px;height:22px;background:#2563eb;border:2.5px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 7px rgba(0,0,0,0.45);"></div>',
      iconSize: [22, 22], iconAnchor: [11, 22],
    })
    L.marker([LAT, LNG], { icon: pinIcon, interactive: false }).addTo(map)

    loadBoundary(map)
  }

  function loadBoundary(map) {
    const url = 'https://nominatim.openstreetmap.org/search?format=geojson&polygon_geojson=1&limit=1&q=' +
      encodeURIComponent('Xã Trà Liên, Đà Nẵng')
    fetch(url, { headers: { Accept: 'application/json' } })
      .then((res) => res.json())
      .then((d) => {
        if (!r.current.lmap || r.current.lmap !== map) return
        if (!d?.features?.length) return
        const geom = d.features[0].geometry
        if (!geom || (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon')) return
        const layer = L.geoJSON(geom, {
          style: { color: '#2563eb', weight: 3, dashArray: '7 6', fillColor: '#2563eb', fillOpacity: 0.05, lineJoin: 'round' },
        }).addTo(map)
        try { map.fitBounds(layer.getBounds(), { padding: [60, 60], maxZoom: 14 }) } catch { /* noop */ }
      })
      .catch(() => { })
  }

  useEffect(() => {
    initGlobe()
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const inst = r.current
      if (inst.raf) cancelAnimationFrame(inst.raf)
      if (inst.onResize) window.removeEventListener('resize', inst.onResize)
      if (inst.cleanupInteraction) inst.cleanupInteraction()
      if (inst.lmap) { try { inst.lmap.remove() } catch { /* noop */ } inst.lmap = null }
      if (inst.renderer) {
        try { inst.renderer.domElement.remove() } catch { /* noop */ }
        try { inst.renderer.dispose() } catch { /* noop */ }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isPending = loginMutation.isPending || forgotMutation.isPending || resetMutation.isPending

  return (
    <div className="login-page">
      {/* Globe 3D */}
      <div ref={globeRef} className="login-globe-layer" />

      {/* Satellite map (sau khi click vào quả địa cầu) */}
      {showMap && (
        <div className="login-map-layer">
          <div ref={mapRef} className="login-map-el" />
          <div className="login-map-badge">
            <span className="dash" />
            <span className="label">Ranh giới xã Trà Liên</span>
          </div>
        </div>
      )}

      {/* Gradient mờ bên phải */}
      <div className="login-right-gradient" />

      {/* Cột phải: logo + card đăng nhập */}
      <div className="login-right-col">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-brand-logo">
            <img src={logoImg} alt="Logo UBND Xã Trà Liên" />
          </div>
          <div>
            <div className="login-brand-title">UBND Xã Trà Liên</div>
            <div className="login-brand-sub">Xã Trà Liên · Thành Phố Đà Nẵng</div>
          </div>
        </div>

        {/* Card */}
        <div className="login-card">

          {/* ── MODE: login ── */}
          {mode === 'login' && (
            <>
              <div className="login-card-title">Đăng nhập</div>
              <div className="login-card-sub">Dành cho cán bộ UBND Xã Trà Liên</div>

              <form onSubmit={handleLogin} className="login-form">
                <div className="login-field">
                  <label>TÊN ĐĂNG NHẬP</label>
                  <div className="login-input-wrap">
                    <User size={17} className="login-input-icon" stroke="#9aa9bd" />
                    <input
                      type="text"
                      autoComplete="username"
                      autoFocus
                      value={loginForm.username}
                      onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))}
                      placeholder="Nhập tên đăng nhập"
                      className="login-input"
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label>MẬT KHẨU</label>
                  <div className="login-input-wrap">
                    <Lock size={17} className="login-input-icon" stroke="#9aa9bd" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={loginForm.password}
                      onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Nhập mật khẩu"
                      className="login-input has-toggle"
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)} className="login-eye-btn">
                      {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={isPending} className="login-submit">
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                  {isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
              </form>

              <div className="login-forgot-wrap">
                <button
                  type="button"
                  className="login-forgot-link"
                  onClick={() => setMode('forgot')}
                >
                  Quên mật khẩu?
                </button>
              </div>

              <div className="login-divider" />

              <div className="login-features">
                <Feature label="Tiếp nhận qua Zalo" />
                <Feature label="Theo dõi xử lý" />
                <Feature label="Phản hồi nhanh" />
              </div>
            </>
          )}

          {/* ── MODE: forgot ── */}
          {mode === 'forgot' && (
            <>
              <button type="button" className="login-mode-back" onClick={() => setMode('login')}>
                <ArrowLeft size={13} /> Quay lại đăng nhập
              </button>
              <div className="login-mode-icon" style={{ background: '#fef2f2' }}>
                <KeyRound size={22} color="#2563eb" />
              </div>
              <div className="login-card-title">Quên mật khẩu</div>
              <div className="login-card-sub">Nhập tên đăng nhập. Hệ thống sẽ gửi mã OTP 6 số qua Zalo của bạn.</div>

              <form onSubmit={handleForgot} className="login-form">
                <div className="login-field">
                  <label>TÊN ĐĂNG NHẬP</label>
                  <div className="login-input-wrap">
                    <User size={17} className="login-input-icon" stroke="#9aa9bd" />
                    <input
                      type="text"
                      autoFocus
                      value={forgotUsername}
                      onChange={e => setForgotUsername(e.target.value)}
                      placeholder="Nhập tên đăng nhập"
                      className="login-input"
                    />
                  </div>
                </div>
                <button type="submit" disabled={isPending} className="login-submit">
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  {isPending ? 'Đang gửi...' : 'Gửi mã OTP qua Zalo'}
                </button>
              </form>
            </>
          )}

          {/* ── MODE: reset ── */}
          {mode === 'reset' && (
            <>
              <button type="button" className="login-mode-back" onClick={() => setMode('forgot')}>
                <ArrowLeft size={13} /> Gửi lại mã OTP
              </button>
              <div className="login-mode-icon" style={{ background: '#ecfdf5' }}>
                <ShieldCheck size={22} color="#059669" />
              </div>
              <div className="login-card-title">Đặt lại mật khẩu</div>
              <div className="login-card-sub">Nhập mã OTP đã gửi qua Zalo và mật khẩu mới.</div>
              <div className="login-account-pill">
                <span>Tài khoản:</span>
                <strong>{forgotUsername}</strong>
              </div>

              <form onSubmit={handleReset} className="login-form">
                <div className="login-field">
                  <label>MÃ OTP (6 SỐ)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="_ _ _ _ _ _"
                    autoFocus
                    value={resetForm.otp}
                    onChange={e => setResetForm(f => ({ ...f, otp: e.target.value.replace(/\D/g, '') }))}
                    className="login-otp-input"
                  />
                </div>
                <div className="login-field">
                  <label>MẬT KHẨU MỚI</label>
                  <div className="login-input-wrap">
                    <Lock size={17} className="login-input-icon" stroke="#9aa9bd" />
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      placeholder="Tối thiểu 6 ký tự"
                      value={resetForm.newPassword}
                      onChange={e => setResetForm(f => ({ ...f, newPassword: e.target.value }))}
                      className="login-input has-toggle"
                    />
                    <button type="button" onClick={() => setShowNewPwd(v => !v)} className="login-eye-btn">
                      {showNewPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="login-field">
                  <label>XÁC NHẬN MẬT KHẨU</label>
                  <div className="login-input-wrap">
                    <Lock size={17} className="login-input-icon" stroke="#9aa9bd" />
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      placeholder="Nhập lại mật khẩu mới"
                      value={resetForm.confirmPassword}
                      onChange={e => setResetForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      className="login-input has-toggle"
                      style={resetForm.confirmPassword && resetForm.confirmPassword !== resetForm.newPassword ? { borderColor: '#dc2626' } : {}}
                    />
                    <button type="button" onClick={() => setShowNewPwd(v => !v)} className="login-eye-btn">
                      {showNewPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {resetForm.confirmPassword && resetForm.confirmPassword !== resetForm.newPassword && (
                    <p className="login-pw-mismatch">Mật khẩu xác nhận không khớp</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className={`login-submit login-submit-green`}
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  {isPending ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="login-footer">
          Khu vực dành riêng cho cán bộ UBND • Liên hệ quản trị để được hỗ trợ
        </div>
      </div>

      {/* Gợi ý kéo/nhấp địa cầu */}
      {!showMap && (
        <div className="login-globe-hint">
          <Globe2 size={16} color="#ffd23f" />
          <span>Kéo để xoay • cuộn để phóng to • nhấp vào địa cầu để bay tới Trà Liên</span>
        </div>
      )}

      {/* Nút quay lại từ bản đồ */}
      {showMap && (
        <button onClick={backToGlobe} className="login-back-btn">
          <ArrowLeft size={17} color="#fca5a5" />
          <span>Quay lại quả địa cầu</span>
        </button>
      )}
    </div>
  )
}

function Feature({ label }) {
  return (
    <div className="login-feature">
      <span className="dot">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <span className="label">{label}</span>
    </div>
  )
}
