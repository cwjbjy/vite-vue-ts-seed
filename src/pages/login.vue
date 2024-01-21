<template>
  <div>
    <router-link to="/home"> 跳转厂房 </router-link>
    <div id="home"></div>
  </div>
</template>

<script setup>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import building1 from '../assets/Textures/building1.jpg';
import building2 from '../assets/Textures/building2.jpg';
import building3 from '../assets/Textures/building3.jpg';
import building4 from '../assets/Textures/building4.jpg';
import background from '../assets/Textures/background.jpg';
import nx from '../assets/Park3Med/nx.jpg';
import ny from '../assets/Park3Med/ny.jpg';
import nz from '../assets/Park3Med/nz.jpg';
import px from '../assets/Park3Med/px.jpg';
import py from '../assets/Park3Med/py.jpg';
import pz from '../assets/Park3Med/pz.jpg';
import { reactive, onMounted } from 'vue';

const state = reactive({
  camera: null,
  renderer: null,
  light: null,
  loader: null,
  controls: null,
  MATERIAL_COLOR: 'rgb(120, 120, 120)',
  /** 其他随机建筑物的坐标位置数组 */
  randomBuildingPositions: [
    { x: -8, y: 0, z: -5 },
    { x: 19, y: 0, z: -8 },
    { x: -2, y: 0, z: -10 },
    { x: 9, y: 0, z: -10 },
    { x: 25, y: 0, z: -15 },
    { x: -3, y: 0, z: -18 },
    { x: 30, y: 0, z: -18 },
    { x: 35, y: 0, z: -20 },
    { x: 8, y: 0, z: -20 },
    { x: 20, y: 0, z: -20 },
    { x: -18, y: 0, z: -25 },
    { x: -6, y: 0, z: -25 },
    { x: 12, y: 0, z: -25 },
    { x: -3, y: 0, z: -30 },
    { x: -10, y: 0, z: -30 },
    { x: 1, y: 0, z: -30 },
    { x: 42, y: 0, z: -32 },
    { x: 36, y: 0, z: -32 },
    { x: -3, y: 0, z: -35 },
    { x: -12, y: 0, z: -35 },
    { x: -20, y: 0, z: -35 },
    { x: -16, y: 0, z: -40 },
    { x: 16, y: 0, z: -40 },
    { x: 16, y: 0, z: -40 },
    { x: 30, y: 0, z: -40 },
  ],
  urls: [nx, ny, nz, px, py, pz],
  randomBuildingTextures: [building1, building2, building3, building4],
  stats: null,
});

let scene = null;
let buildings = null;

const init = () => {
  let home = document.getElementById('home');

  state.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  state.camera.position.set(0, 30, 90);
  state.camera.lookAt(new THREE.Vector3(0, 0, 0));

  scene = new THREE.Scene();

  state.renderer = new THREE.WebGLRenderer({ antialias: true });
  state.renderer.setClearColor(state.MATERIAL_COLOR);
  state.renderer.shadowMap.enabled = true; // 开启渲染器的阴影功能
  state.renderer.shadowMap.type = THREE.PCFShadowMap; // PCF阴影类型
  state.renderer.setSize(window.innerWidth, window.innerHeight);

  state.loader = new THREE.TextureLoader();

  state.light = new THREE.Group();
  scene.add(state.light);
  setLight();

  // scene.add(new THREE.AxesHelper(100));
  // scene.add(new THREE.GridHelper(120, 120));

  state.controls = new OrbitControls(state.camera, state.renderer.domElement);
  state.controls.maxDistance = 800;

  scene.background = setBackground();

  setGround();
  scene.add(getOrientalPearl());

  buildings = new THREE.Group();
  buildings.name = '建筑';
  scene.add(buildings);
  setBuilding();

  home.appendChild(state.renderer.domElement);

  state.stats = new Stats();
  home.appendChild(state.stats.domElement);

  render();
};
const render = () => {
  state.renderer.render(scene, state.camera);
  requestAnimationFrame(render);
  state.stats.update();
};
const setBackground = () => {
  //360全景视图
  const textureCube = new THREE.CubeTextureLoader().load(state.urls);
  textureCube.mapping = THREE.CubeRefractionMapping;
  return textureCube;
};
const setGround = () => {
  let shape = new THREE.Shape();
  shape.moveTo(50, 50);
  shape.lineTo(-50, 50);
  shape.lineTo(-50, -50);
  shape.lineTo(50, -50);
  shape.lineTo(50, 50);

  let extrudeGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: 3,
    steps: 2,
    bevelThickness: 0,
    bevelSize: 1,
  });

  const texture = state.loader.load(background);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  // // 设置行列的重复次数
  // texture.repeat.set(1, 1);

  let material = new THREE.MeshLambertMaterial({
    color: '#666',
    map: texture,
  });

  let mesh = new THREE.Mesh(extrudeGeometry, material);

  mesh.rotation.x = Math.PI / 2; // 地面旋转90度
  scene.add(mesh);
};
const setLight = () => {
  const light1 = new THREE.PointLight(0xffffff, 1.2);
  light1.position.set(100, 100, 80);
  state.light.add(light1);
  const light2 = new THREE.PointLight(0xffffff, 1.2);
  light2.position.set(-100, -100, 80);
  state.light.add(light2);
  const light3 = new THREE.AmbientLight(0x404040);
  state.light.add(light3);
};
const setBuilding = () => {
  let defauleLength = 16;
  // w, h, d
  for (let i = 0; i < state.randomBuildingPositions.length; i++) {
    let w = Math.random() * 3 + 2; // 随机数(2, 5);
    let d = Math.random() * 3 + 2; // 随机数(2, 5);
    let _h = Math.random() * defauleLength + 5;
    let h = _h < 8 ? _h + 8 : _h; // 随机数(0, 15.5);

    let textureInd = Math.floor(Math.random() * 4);
    let texture = state.loader.load(state.randomBuildingTextures[textureInd]);
    // // 设置贴图的矩阵重复方式
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    // // 设置行列的重复次数
    texture.repeat.set(1, h / 2);

    let geometry = new THREE.BoxGeometry(w, h, d);
    let material = new THREE.MeshPhongMaterial({
      map: texture,
    });
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      state.randomBuildingPositions[i].x,
      state.randomBuildingPositions[i].y + h / 2,
      state.randomBuildingPositions[i].z,
    );
    buildings.add(mesh);
  }
};
const getOrientalPearl = () => {
  let orientalPearl = new THREE.Object3D();
  // 1. 底部圆台 2个圆柱
  let bottom = new THREE.Object3D();
  // 圆台1
  let cylinder1_geometry = new THREE.CylinderGeometry(2, 2, 0.38, 30);
  let cylinder1_material = new THREE.MeshPhongMaterial({
    color: state.MATERIAL_COLOR,
  });
  let cylinder1 = new THREE.Mesh(cylinder1_geometry, cylinder1_material);
  cylinder1.castShadow = true;
  cylinder1.receiveShadow = true;

  // 圆台2
  let cylinder2_geometry = new THREE.CylinderGeometry(1.8, 1.8, 0.2, 30);
  let cylinder2_material = new THREE.MeshPhongMaterial({
    color: state.MATERIAL_COLOR,
  });
  let cylinder2 = new THREE.Mesh(cylinder2_geometry, cylinder2_material);
  cylinder2.position.y = 0.28;
  cylinder2.castShadow = true;
  cylinder2.receiveShadow = true;

  // 底部小斜体圆柱1
  let little_bottom_cylinder1_geometry = new THREE.CylinderGeometry(0.15, 0.15, 3, 30);
  let little_bottom_cylinder1_material = new THREE.MeshPhongMaterial({
    color: state.MATERIAL_COLOR,
  });
  let little_bottom_cylinder1 = new THREE.Mesh(little_bottom_cylinder1_geometry, little_bottom_cylinder1_material);
  little_bottom_cylinder1.position.set(1.1, 1, 0.5);
  little_bottom_cylinder1.rotation.set((Math.PI / 2) * 1.15, (Math.PI / 5.5) * 1.5, (-Math.PI / 2.5) * 1.1);

  // 底部小斜体圆柱2
  let little_bottom_cylinder2_geometry = new THREE.CylinderGeometry(0.15, 0.15, 3, 30);
  let little_bottom_cylinder2_material = new THREE.MeshPhongMaterial({
    color: state.MATERIAL_COLOR,
  });
  let little_bottom_cylinder2 = new THREE.Mesh(little_bottom_cylinder2_geometry, little_bottom_cylinder2_material);
  little_bottom_cylinder2.position.set(-0.05, 1, -1.35);
  little_bottom_cylinder2.rotation.set((Math.PI / 2) * 1.47, -(Math.PI / 5.5) * 1.35, (Math.PI / 2.5) * 0.05);

  // 底部小斜体圆柱3
  let little_bottom_cylinder3_geometry = new THREE.CylinderGeometry(0.15, 0.15, 3, 30);
  let little_bottom_cylinder3_material = new THREE.MeshPhongMaterial({
    color: state.MATERIAL_COLOR,
  });
  let little_bottom_cylinder3 = new THREE.Mesh(little_bottom_cylinder3_geometry, little_bottom_cylinder3_material);
  little_bottom_cylinder3.position.set(-1, 1, 0.8);
  little_bottom_cylinder3.rotation.set(-(Math.PI / 2) * 1.25, (Math.PI / 5.5) * 1, -(Math.PI / 3.5) * 0.9);

  // 底部支柱
  let bottom_cylinder = getBottomCylinder();
  bottom.add(
    cylinder1,
    cylinder2,
    bottom_cylinder,
    little_bottom_cylinder1,
    little_bottom_cylinder2,
    little_bottom_cylinder3,
  );

  // 2. 中间部分 三个圆柱 + 圆球
  let body = new THREE.Object3D();

  // 圆柱1
  let body_cylinder1_geometry = new THREE.CylinderGeometry(0.35, 0.35, 15, 30);
  let body_cylinder1_material = new THREE.MeshPhongMaterial({
    color: state.MATERIAL_COLOR,
  });
  let body_cylinder1 = new THREE.Mesh(body_cylinder1_geometry, body_cylinder1_material);
  body_cylinder1.position.set(0, 7, 0.8);
  // 圆柱2
  let body_cylinder2_geometry = new THREE.CylinderGeometry(0.35, 0.35, 15, 30);
  let body_cylinder2_material = new THREE.MeshPhongMaterial({
    color: state.MATERIAL_COLOR,
  });
  let body_cylinder2 = new THREE.Mesh(body_cylinder2_geometry, body_cylinder2_material);
  body_cylinder2.position.set(0.7, 7, -0.5);
  // 圆柱3
  let body_cylinder3_geometry = new THREE.CylinderGeometry(0.35, 0.35, 15, 30);
  let body_cylinder3_material = new THREE.MeshPhongMaterial({
    color: state.MATERIAL_COLOR,
  });
  let body_cylinder3 = new THREE.Mesh(body_cylinder3_geometry, body_cylinder3_material);
  body_cylinder3.position.set(-0.7, 7, -0.45);

  // 圆环
  let torus1 = getTorus(0.8, 0.2, 16, 10, 2);
  let torus2 = getTorus(0.8, 0.2, 16, 10, 7.5);
  let torus3 = getTorus(0.8, 0.2, 16, 10, 8.6);
  let torus4 = getTorus(0.8, 0.2, 16, 10, 9.7);
  let torus5 = getTorus(0.8, 0.2, 16, 10, 10.8);
  let torus6 = getTorus(0.8, 0.2, 16, 10, 11.9);
  let torus7 = getTorus(0.8, 0.2, 16, 10, 13);

  // 大球
  var sphere_big_geometry = new THREE.SphereGeometry(2, 32, 32);
  var sphere_big_material = new THREE.MeshPhongMaterial({
    color: state.MATERIAL_COLOR,
  });
  var sphere_big = new THREE.Mesh(sphere_big_geometry, sphere_big_material);
  sphere_big.position.y = 5;

  // 中球
  var sphere_middle_geometry = new THREE.SphereGeometry(1.5, 32, 32);
  var sphere_middle_material = new THREE.MeshPhongMaterial({
    color: state.MATERIAL_COLOR,
    // color: "rgb(175, 91, 123)"
  });
  var sphere_middle = new THREE.Mesh(sphere_middle_geometry, sphere_middle_material);
  sphere_middle.position.y = 15;

  body.add(body_cylinder1);
  body.add(body_cylinder2);
  body.add(body_cylinder3);
  body.add(torus1);
  body.add(torus2);
  body.add(torus3);
  body.add(torus4);
  body.add(torus5);
  body.add(torus6);
  body.add(torus7);
  body.add(sphere_big);
  body.add(sphere_middle);

  // 顶部
  let head = new THREE.Object3D();
  // 顶部圆柱1
  let head_cylinder1_geometry = new THREE.CylinderGeometry(0.3, 0.3, 2.5, 5);
  let head_cylinder1_material = new THREE.MeshPhongMaterial({
    color: state.MATERIAL_COLOR,
  });
  let head_cylinder1 = new THREE.Mesh(head_cylinder1_geometry, head_cylinder1_material);
  head_cylinder1.position.y = 17.5;

  // 顶部球1
  var head_sphere_geometry = new THREE.SphereGeometry(0.6, 32, 32);
  var head_sphere_material = new THREE.MeshPhongMaterial({
    color: state.MATERIAL_COLOR,
  });
  var head_sphere = new THREE.Mesh(head_sphere_geometry, head_sphere_material);
  head_sphere.position.y = 19;

  // 顶部圆柱2
  let head_cylinder2_geometry = new THREE.CylinderGeometry(0.25, 0.2, 3, 5);
  let head_cylinder2_material = new THREE.MeshPhongMaterial({
    color: state.MATERIAL_COLOR,
  });
  let head_cylinder2 = new THREE.Mesh(head_cylinder2_geometry, head_cylinder2_material);
  head_cylinder2.position.y = 20;

  let head_torus1 = getTorus(0.15, 0.15, 16, 10, 21.5);

  // 顶部圆柱3
  let head_cylinder3_geometry = new THREE.CylinderGeometry(0.15, 0.15, 2, 10);
  let head_cylinder3_material = new THREE.MeshPhongMaterial({
    color: state.MATERIAL_COLOR,
  });
  let head_cylinder3 = new THREE.Mesh(head_cylinder3_geometry, head_cylinder3_material);
  head_cylinder3.position.y = 22.5;
  let head_torus2 = getTorus(0.13, 0.13, 16, 10, 23.5);

  // 顶部圆柱4
  let head_cylinder4_geometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 10);
  let head_cylinder4_material = new THREE.MeshPhongMaterial({
    color: state.MATERIAL_COLOR,
  });
  let head_cylinder4 = new THREE.Mesh(head_cylinder4_geometry, head_cylinder4_material);
  head_cylinder4.position.y = 25;

  head.add(head_sphere, head_torus1, head_torus2, head_cylinder4);
  head.add(head_cylinder1, head_cylinder2, head_cylinder3);

  orientalPearl.add(bottom);
  orientalPearl.add(body);
  orientalPearl.add(head);
  orientalPearl.castShadow = true;
  orientalPearl.receiveShadow = true;

  return orientalPearl;
};
const getBottomCylinder = () => {
  // 获取底部斜体圆柱
  let object = new THREE.Object3D();

  // 圆柱1
  let bottom_cylinder1_geometry = new THREE.CylinderGeometry(0.2, 0.2, 7, 30);
  let bottom_cylinder1_material = new THREE.MeshPhongMaterial({
    color: state.MATERIAL_COLOR,
  });
  let bottom_cylinder1 = new THREE.Mesh(bottom_cylinder1_geometry, bottom_cylinder1_material);

  // 圆柱2
  let bottom_cylinder2_geometry = new THREE.CylinderGeometry(0.2, 0.2, 7, 30);
  let bottom_cylinder2_material = new THREE.MeshPhongMaterial({
    color: state.MATERIAL_COLOR,
  });
  let bottom_cylinder2 = new THREE.Mesh(bottom_cylinder2_geometry, bottom_cylinder2_material);

  // 圆柱3
  let bottom_cylinder3_geometry = new THREE.CylinderGeometry(0.2, 0.2, 7, 30);
  let bottom_cylinder3_material = new THREE.MeshPhongMaterial({
    color: state.MATERIAL_COLOR,
  });
  let bottom_cylinder3 = new THREE.Mesh(bottom_cylinder3_geometry, bottom_cylinder3_material);

  // 圆柱中间球
  var sphere1 = getBottomSphere();
  var sphere2 = getBottomSphere();
  var sphere3 = getBottomSphere();

  bottom_cylinder1.add(sphere1);
  bottom_cylinder2.add(sphere2);
  bottom_cylinder3.add(sphere3);

  bottom_cylinder1.position.set(2, 2, 1);
  bottom_cylinder1.rotation.set(-(Math.PI / 5.5), Math.PI / 10, Math.PI / 5);

  bottom_cylinder2.position.set(0, 2, -2.5);
  bottom_cylinder2.rotation.set(Math.PI / 4.5, Math.PI / 6, -Math.PI / 1);

  bottom_cylinder3.position.set(-2, 2, 1.5);
  bottom_cylinder3.rotation.set(-Math.PI / 15, Math.PI / 8, (-Math.PI / 10) * 2);

  object.add(bottom_cylinder1, bottom_cylinder2, bottom_cylinder3);
  return object;
};
const getBottomSphere = () => {
  var sphere_geometry = new THREE.SphereGeometry(0.32, 32, 32);
  var sphere_material = new THREE.MeshPhongMaterial({
    color: state.MATERIAL_COLOR,
  });
  var sphere = new THREE.Mesh(sphere_geometry, sphere_material);
  return sphere;
};
const getTorus = (a, b, c, d, y) => {
  let torus_geometry = new THREE.TorusGeometry(a, b, c, d);
  let torus_material = new THREE.MeshPhongMaterial({
    color: state.MATERIAL_COLOR,
  });
  let torus = new THREE.Mesh(torus_geometry, torus_material);
  torus.radius = 8;
  torus.tube = 2;
  torus.radialSegments = 7;
  torus.tubularSegments = 30;
  torus.rotation.x = Math.PI / 2;
  torus.position.y = y;
  return torus;
};

onMounted(() => {
  init();
});
</script>

<style lang="scss">
body {
  color: $test-color;
}
</style>
