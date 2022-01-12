import * as THREE from 'three';
import { gsap, Power4 } from 'gsap'
import image1 from '../src/images/image1.jpg'
import image2 from '../src/images/image2.jpg'
import dispFilter from '../src/images/filter.jpg'
const vertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`
const fragment = `
  varying vec2 vUv;
  uniform sampler2D texture1;
  uniform sampler2D texture2;
  uniform sampler2D filterTexture;
  uniform float displacement;
  uniform float effect;
  uniform vec2 resolution;
  uniform vec2 imageResolution;
  vec2 fitCover(vec2 coord, vec2 inputResolution, vec2 outputResolution) {
    vec2 ratio = vec2(
      min((outputResolution.x / outputResolution.y) / (inputResolution.x / inputResolution.y), 1.0),
      min((outputResolution.y / outputResolution.x) / (inputResolution.y / inputResolution.x), 1.0)
    );
    return coord * ratio + (1. - ratio) * 0.5;
  }
  void main() {
    vec2 uv = fitCover(vUv, imageResolution, resolution);
    vec4 disp = texture2D(filterTexture, uv);
    vec2 position1 = vec2(uv.x + displacement * (disp.r * effect), uv.y);
    vec2 position2 = vec2(uv.x - (1.0 - displacement) /2.0 * (disp.r * effect), uv.y);
    vec4 samplerColor1 = texture2D(texture1, position1);
    vec4 samplerColor2 = texture2D(texture2, position2);
    vec4 mixColor = mix(samplerColor1, samplerColor2, displacement);
    gl_FragColor = mixColor;
  }
`
const canvas = document.getElementById('canvas')!
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
  canvas.offsetWidth / -2,
  canvas.offsetWidth / 2,
  canvas.offsetHeight / 2,
  canvas.offsetHeight / -2,
  1,
  1000
);
camera.position.z = 1;
const renderer = new THREE.WebGLRenderer({
  antialias: false
});
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setClearColor(0xFFFFFF, 0.0)
renderer.setSize(canvas.offsetWidth, canvas.offsetHeight)
canvas.appendChild(renderer.domElement)
const loader = new THREE.TextureLoader()
const texture1 = loader.load(image1)
const texture2 = loader.load(image2)
texture1.magFilter = THREE.LinearFilter
texture2.magFilter = THREE.LinearFilter
texture1.minFilter = THREE.LinearFilter
texture2.minFilter = THREE.LinearFilter
texture1.anisotropy = renderer.getMaxAnisotropy()
texture2.anisotropy = renderer.getMaxAnisotropy()
const filter = loader.load(dispFilter)
filter.wrapS = THREE.RepeatWrapping
filter.wrapT = THREE.RepeatWrapping
const intensity = 0.3
const material = new THREE.ShaderMaterial({
  uniforms: {
    effect: { value: intensity },
    displacement: { value: 0.0 },
    texture1: { value: texture1 },
    texture2: { value: texture2 },
    filterTexture: { value: filter },
    resolution: { value: new THREE.Vector2(canvas.offsetWidth, canvas.offsetHeight) },
    imageResolution: { value: new THREE.Vector2(3456, 5184)},
  },
  vertexShader: vertex,
  fragmentShader: fragment,
  transparent: true,
  opacity: 1.0
})
const geometry = new THREE.PlaneBufferGeometry(
  canvas.offsetWidth, canvas.offsetHeight, 1
)
const object = new THREE.Mesh(geometry, material)
scene.add(object)
canvas.addEventListener('mouseenter', () => {
  gsap.to(material.uniforms.displacement, 0.8, {
    value: 1.0,
    ease: Power4.easeOut
  })
})
canvas.addEventListener('mouseleave', () => {
  gsap.to(material.uniforms.displacement, 0.8, {
    value: 0,
    ease: Power4.easeOut
  })
})
window.addEventListener("resize", () => {
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
  material.uniforms.resolution.value = new THREE.Vector2(canvas.offsetWidth, canvas.offsetHeight)
});
const animate = () => {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
animate()