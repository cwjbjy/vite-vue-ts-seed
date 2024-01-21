<template>
  <div class="home">
    <div id="factory"></div>
  </div>
</template>

<script setup>
import { reactive, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { DDSLoader } from 'three/examples/jsm/loaders/DDSLoader.js';

const state = reactive({
  camera: null,
  renderer: null,
  BACKGROUND_COLOR: '#010723',
  raycaster: null,
  pointer: {},
  mouse: {},
  INTERSECTED: null,
});

let scene = null;

const init = () => {
  let factory = document.getElementById('factory');

  state.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
  state.camera.position.set(800, 600, 350);
  state.camera.lookAt(new THREE.Vector3(0, 0, 0));

  scene = new THREE.Scene();

  setLight();

  state.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  state.renderer.setClearAlpha(0.2);
  state.renderer.setSize(window.innerWidth, window.innerHeight);

  model();

  state.raycaster = new THREE.Raycaster();

  factory.appendChild(state.renderer.domElement);

  animate();

  window.addEventListener('resize', onWindowResize);
};
const render = () => {
  state.renderer.render(scene, state.camera);
};
const animate = () => {
  requestAnimationFrame(animate);
  render();
};
const onWindowResize = () => {
  state.camera.aspect = window.innerWidth / window.innerHeight;
  state.camera.updateProjectionMatrix();

  state.renderer.setSize(window.innerWidth, window.innerHeight);
};
const setLight = () => {
  // const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
  // scene.add(ambientLight);
  const ambientLight = new THREE.AmbientLight(0xcccccc, 1);
  scene.add(ambientLight);
  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(1000, 1000, 0);
  scene.add(pointLight);

  // const pointLight = new THREE.PointLight(0xffffff, 1);
  // pointLight.position.set(-2458, 1003, 786);
  // scene.add(pointLight);

  // const pointLight2 = new THREE.PointLight(0xffffff, 1);
  // pointLight2.position.set(-887, 698, -885);
  // scene.add(pointLight2);

  // const pointLight3 = new THREE.PointLight(0xffffff, 1);
  // pointLight3.position.set(240, 74, -833);
  // scene.add(pointLight3);

  // const pointLight4 = new THREE.PointLight(0xffffff, 1);
  // pointLight4.position.set(45, 627, 799);
  // scene.add(pointLight4);
};
const model = () => {
  const manager = new THREE.LoadingManager();
  manager.addHandler(/\.dds$/i, new DDSLoader());

  new MTLLoader(manager).load('/city.mtl', (materials) => {
    materials.preload();
    new OBJLoader(manager).setMaterials(materials).load(
      '/city.obj',
      (object) => {
        const group = new THREE.Group();
        const group1 = new THREE.Group();
        group1.name = '厂房一';
        const group2 = new THREE.Group();
        group2.name = '厂房二';
        const group3 = new THREE.Group();
        group3.name = '厂房三';
        const group4 = new THREE.Group();
        group4.name = '厂房四';
        const group5 = new THREE.Group();
        group5.name = '非厂房区';

        group.add(group1);
        group.add(group2);
        group.add(group3);
        group.add(group4);
        group.add(group5);

        let arr1 = [],
          arr2 = [],
          arr3 = [],
          arr4 = [],
          arr5 = [];

        object.children.forEach((item) => {
          let name = item.name.substr(0, 3);
          if (name == '厂房一') {
            arr1.push(item);
          } else if (name == '厂房二') {
            arr2.push(item);
          } else if (name == '厂房三') {
            arr3.push(item);
          } else if (name == '厂房四') {
            arr4.push(item);
          } else {
            arr5.push(item);
          }
        });

        group1.add(...arr1);
        group2.add(...arr2);
        group3.add(...arr3);
        group4.add(...arr4);
        group5.add(...arr5);
        group.position.z = 100;
        group.position.x = 450;
        scene.add(group);
      },
      function (xhr) {
        if (xhr.lengthComputable) {
          // const percentComplete = (xhr.loaded / xhr.total) * 100;
          // console.log(Math.round(percentComplete, 2) + '% downloaded');
        }
      },
    );
  });
};

const onPointerMove = (event) => {
  event.preventDefault();
  state.mouse.x = event.clientX;
  state.mouse.y = event.clientY;
  state.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  state.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  Fire();
};
const Fire = () => {
  state.raycaster.setFromCamera(state.pointer, state.camera);
  const intersects = state.raycaster.intersectObjects(scene.children, true);
  if (intersects.length > 0) {
    let mesh = intersects[0].object;
    let name = mesh.name.substr(0, 3);
    if (['厂房一', '厂房二', '厂房三', '厂房四'].includes(name)) {
      restore();
      scene.children[2].children.forEach((item) => {
        if (item.name == name) {
          state.INTERSECTED = item;
        }
      });
      state.INTERSECTED.children.forEach((item) => {
        if (Array.isArray(item.material)) {
          item.material[0] = item.material[0].clone();
          item.material[1] = item.material[1].clone();
          state.INTERSECTED.currentHexArr = [];
          state.INTERSECTED.currentHexArr[0] = item.material[0].emissive.getHex();
          state.INTERSECTED.currentHexArr[1] = item.material[1].emissive.getHex();
          item.material[0].emissive.setHex(0x147646);
          item.material[1].emissive.setHex(0x37c499);
        } else {
          item.material = item.material.clone();
          state.INTERSECTED.currentHex = item.material.emissive.getHex();
          item.material.emissive.setHex(0x147646);
        }
      });
    } else {
      restore();
    }
  } else {
    restore();
  }
};
const restore = () => {
  state.INTERSECTED &&
    state.INTERSECTED.children.forEach((item) => {
      if (Array.isArray(item.material)) {
        item.material[0].emissive.setHex(state.INTERSECTED.currentHexArr[0]);
        item.material[1].emissive.setHex(state.INTERSECTED.currentHexArr[1]);
      } else {
        item.material.emissive.setHex(state.INTERSECTED.currentHex);
      }
    });
  state.INTERSECTED = null;
};

onMounted(() => {
  init();
  document.addEventListener('click', onPointerMove);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onPointerMove);
});
</script>

<style scoped>
.infoBox {
  position: absolute;
  width: 165px;
  height: 80px;
  background-color: #000a2173;
  z-index: 99;
  top: 0;
  color: #fff;
  font-size: 12px;
}

.home {
  margin: 0;
  overflow: hidden;
  background-image: url('../assets/ground/ground.jpg');
  background-size: 100% 100%;
  background-repeat: no-repeat;
}
</style>
