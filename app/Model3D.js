// 실시간 3D 뷰어 POC — expo-gl + three로 애니 GLB/GLTF를 GPU 스켈레톤 애니 렌더.
//   스프라이트(프레임 넘기기) 대비 부드러움·입체감 검증용. 성공 시 전투 화면 전면 전환.
import React, { useRef } from 'react';
import { View } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Asset } from 'expo-asset';

const MODEL = require('../assets/models/yellowdragon.gltf');

export default function Model3D({ size = 220, clip = 'Idle' }) {
  const raf = useRef(null);

  const onContextCreate = async (gl) => {
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
    const renderer = new Renderer({ gl });
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0); // 투명 배경

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);

    // 3점 조명(스프라이트 렌더와 톤 맞춤)
    const key = new THREE.DirectionalLight(0xfff2e0, 3.0); key.position.set(-3, 4, 5); scene.add(key);
    const fill = new THREE.DirectionalLight(0xd8e4ff, 1.0); fill.position.set(4, 1, 2); scene.add(fill);
    scene.add(new THREE.AmbientLight(0x8fa0c0, 1.0));

    let mixer = null;
    const clock = new THREE.Clock();
    try {
      const asset = Asset.fromModule(MODEL);
      await asset.downloadAsync();
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(asset.localUri || asset.uri);
      const model = gltf.scene;

      // 중심 정렬 + 카메라 프레이밍
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const sz = box.getSize(new THREE.Vector3());
      model.position.sub(center);
      scene.add(model);
      const span = Math.max(sz.x, sz.y, sz.z) || 1;
      camera.position.set(span * 0.6, span * 0.35, span * 1.7);
      camera.lookAt(0, 0, 0);

      // 애니 재생(idle 우선)
      if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(model);
        const a = gltf.animations.find((x) => clip && x.name.toLowerCase().includes(clip.toLowerCase())) || gltf.animations[0];
        mixer.clipAction(a).play();
      }
    } catch (e) {
      console.log('[Model3D] load error:', e && e.message);
    }

    const render = () => {
      raf.current = requestAnimationFrame(render);
      if (mixer) mixer.update(clock.getDelta());
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    render();
  };

  return (
    <View style={{ width: size, height: size }}>
      <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />
    </View>
  );
}
