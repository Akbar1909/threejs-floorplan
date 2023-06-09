import * as THREE from "three";
import {
  CSS3DRenderer,
  CSS3DObject,
} from "three/addons/renderers/CSS3DRenderer.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/addons/renderers/CSS2DRenderer.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { GUI } from "dat.gui";
import { OrbitControls } from "./services/OrbitControls";
import * as ThreeMeshUI from "three-mesh-ui";
import { Text } from "troika-three-text";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { DragControls } from "three/addons/controls/DragControls.js";
import jsonHalls from "./halls.json";
import currentHall3Json from "./currentHall3.json";
import rcJson from "./rc.json";
import dmgHall2 from "./dmgHall2.json";
import pavilionJson from "./pavilion.json";
import pavilionJson1 from "./pavilion1.json";

const WIDTH = window.innerWidth - 300;
const HEIGHT = window.innerHeight - 100;

function createPoint(vector3, name) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([vector3.x, vector3.y, vector3.z], 3, true)
  );
  const material = new THREE.PointsMaterial({
    color: 0x888888,
    size: 10,
    sizeAttenuation: false,
  });
  const mesh = new THREE.Points(geometry, material);
  mesh.userData = { type: "stand-name", text: "lorem lorem lorem" };
  return mesh;
}

function createCSS2DLabel(vector3, rectSize) {
  console.log(vector3, rectSize);
  const box = document.createElement("div");
  box.className = "label";
  box.textContent =
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry";
  box.style.width = `${rectSize.x}px`;
  // box.style.backgroundColor = "transparent";
  var pos = new THREE.Vector3(400, 0, 0);
  const label = new CSS2DObject(box);
  label.userData.type = "stand-label";
  label.visible = false;
  label.position.set(vector3.x, vector3.y, vector3.z);
  // label.center.set(0, 1);

  // console.log(earthLabel);

  return label;
}

const fontLoader = new FontLoader();

function createText({ vector3, text, add, visible = false, rectSize, isRect }) {
  fontLoader.load(
    "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
    (font) => {
      const myText = new Text();
      add(myText);
      const testText = text;
      let fontSize = 10;

      // Set properties to configure:
      myText.wrapS = THREE.RepeatWrapping;
      // myText.anchorX = "left";
      myText.depthOffset = 1;
      myText.text = testText;
      // myText.text =
      //   selectedHall.name +
      //   `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum ${index}`;
      myText.fontSize = fontSize;
      myText.position.copy(vector3);

      if (isRect) {
        myText.position.x = myText.position.x - rectSize.x / 2;
        myText.position.y = myText.position.y + rectSize.y / 2;
        myText.maxWidth = rectSize.x;
      }

      // console.log({ rectCenter, rectMeshBoundingBox });

      myText.color = 0x333645;
      // myText.overflowWrap = "break-word";
      // myText.textAlign = "center";
      myText.userData.type = "stand-text";
      myText.fillOpacity = 0;
      // myText.outlineOffsetX = "1%";

      // Update the rendering:
      myText.sync();
    }
  );
}

function findCenterOfGravity(points) {
  // var points = [
  //   new THREE.Vector2(0, 0),
  //   new THREE.Vector2(1, 0),
  //   new THREE.Vector2(1, 1),
  //   new THREE.Vector2(0, 1),
  //   // Add more points as needed
  // ];

  const center = new THREE.Vector2(0, 0);

  // Calculate the sum of all the point positions
  for (let i = 0; i < points.length; i++) {
    center.add(points[i]);
  }

  // Divide the sum by the total number of points to get the average position
  center.divideScalar(points.length);

  return center;
}

function calculateImageAspectRation(width, height) {
  return width / height;
}

export const options = [
  {
    label: "Alpha",
    value: "alpha",
  },
  {
    label: "Current HAll 3",
    value: "currentHall3",
  },
  {
    label: "Rc",
    value: "rc",
  },
  {
    label: "Dmg Hall2",
    value: "dmg-hall2",
  },
  {
    label: "Pavilion",
    value: "pavilion",
  },
  {
    label: "Pavilion 1",
    value: "pavilion1",
  },
];

function getFloorplanInfo(value) {
  if (value === "currentHall3") {
    return {
      halls: currentHall3Json,
      image: "/currentHall3.png",
    };
  }

  if (value === "rc") {
    return {
      halls: rcJson,
      image: "/rc.jpeg",
    };
  }

  if (value === "dmg-hall2") {
    return {
      halls: dmgHall2,
      image: "/dmgHall2.png",
    };
  }
  if (value === "pavilion1") {
    return {
      halls: pavilionJson1,
      image: "/plane2.png",
    };
  }
  if (value === "pavilion") {
    return {
      halls: pavilionJson,
      image: "/pavilion.png",
    };
  }
  return {
    halls: jsonHalls,
    image: "/floorplan.png",
  };
}

let scene,
  camera,
  renderer,
  mouse,
  raycaster,
  controls,
  dragControls,
  mouse3D,
  scale = 1,
  zoomFactor = 1,
  zoomChanged = false,
  enableSelection = false,
  draggableObjects = [],
  group,
  points = [],
  plane,
  labelRenderer;

const isPerspective = false;

// NOTE Dat GUI
const gui = new GUI();
// const controlsFolder = gui.addFolder("controls");
// const textFolder = gui.addFolder("text");
// const cameraFolder = gui.addFolder("camera");

// cameraFolder.open();

function init(canvas, handleStandClick, value) {
  if (!canvas) {
    return;
  }

  let { halls, image } = getFloorplanInfo(value);

  halls = halls.map((hall) => ({
    ...hall,
    coords: JSON.parse(hall.coords),
  }));

  // NOTE scene -------
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x505050);

  // NOTE camera ------
  camera = isPerspective
    ? new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 1, 1000)
    : new THREE.OrthographicCamera(
        WIDTH / -1,
        WIDTH / 1,
        HEIGHT / 1,
        HEIGHT / -1,
        1,
        1000
      );
  camera.aspect = WIDTH / HEIGHT;
  camera.position.z = 5;
  camera.position.x = 0;
  camera.position.y = 0;

  // NOTE rerender ------
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    logarithmicDepthBuffer: true,
    depth: false,
  });
  renderer.xr.enabled = true;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(WIDTH, HEIGHT);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.sortObjects = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  // NOTE label renderer
  const labelContainer = document.getElementById("floorplan");
  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(WIDTH, HEIGHT);
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.bottom = "0px";
  labelRenderer.domElement.style.right = "0px";
  labelContainer.appendChild(labelRenderer.domElement);

  // NOTE controls ------
  controls = new OrbitControls(camera, canvas);
  controls.enableRotate = false;
  controls.zoomToCursor = true;
  controls.zoomSpeed = 2;
  controls.minZoom = 0;
  controls.maxZoom = 10;
  controls.screenSpacePanning = true;

  // NOTE Raycaster and mouse ------
  mouse = new THREE.Vector2();
  mouse3D = new THREE.Vector3();
  raycaster = new THREE.Raycaster();

  // NOTE Texture loader -----
  const loader = new THREE.TextureLoader();

  const texture = loader.load(image, (loadedTexture) => {
    texture.generateMipmaps = false;
    // texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.NearestFilter;

    texture.needsUpdate = true;

    const { width: imageWidth, height: imageHeight } = loadedTexture.image;
    const imageAspectRatio = imageWidth / imageHeight;

    // NOTE Plane ----- general

    const planeWidth = 2000; // Desired plane width
    const planeHeight = planeWidth / imageAspectRatio;

    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
    const material = new THREE.MeshBasicMaterial({
      map: loadedTexture,
      // transparent: true,
    });
    // fix z-fighting issue
    material.depthWrite = false;
    plane = new THREE.Mesh(geometry, material);

    halls.forEach((selectedHall, index) => {
      if (!Array.isArray(selectedHall?.coords)) {
        return;
      }

      console.log(selectedHall);

      const planeCoordinates = selectedHall.coords.map(function (coord) {
        const rectX = parseFloat(coord[0]);
        const rectY = parseFloat(coord[1]);
        const planeX = (rectX / imageWidth) * planeWidth - planeWidth / 2;
        const planeY = -((rectY / imageHeight) * planeHeight - planeHeight / 2);
        return [planeX, planeY];
      });

      const rectShape = new THREE.Shape();
      rectShape.moveTo(planeCoordinates[0][0], planeCoordinates[0][1]);
      for (let i = 1; i < planeCoordinates.length; i++) {
        rectShape.lineTo(planeCoordinates[i][0], planeCoordinates[i][1]);
      }
      rectShape.lineTo(planeCoordinates[0][0], planeCoordinates[0][1]);

      // NOTE create rect mesh started

      const rectGeometry = new THREE.ShapeGeometry(rectShape);

      const rectMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      // fix z-fighting issue
      rectMaterial.depthWrite = false;
      const rectMesh = new THREE.Mesh(rectGeometry, rectMaterial);
      const rectMeshBoundingBox = new THREE.Box3().setFromObject(rectMesh);
      const rectCenter = rectMeshBoundingBox.getCenter(new THREE.Vector3());

      const rectSize = new THREE.Vector3();
      rectMeshBoundingBox.getSize(rectSize);

      rectMesh.updateMatrix();
      rectMesh.matrixAutoUpdate = false;

      rectMesh.userData = { id: index, type: "stand-shape" };

      // NOTE create a point

      plane.add(createPoint(rectCenter));

      const isRect = planeCoordinates.length === 4;

      if (true) {
        plane.add(createCSS2DLabel(rectCenter, rectSize));
      }

      if (false) {
        createText({
          text: "lorem lorem lorem",
          vector3: rectCenter,
          add: (text) => {
            plane.add(text);
          },
          rectSize,
          isRect,
        });
      }

      const temp = 0.55;

      //  version 1
      if (false) {
        const textContainerHeight = (2 * rectSize.y) / Math.cos(temp);
        const innerContainer = new ThreeMeshUI.Block({
          width: rectSize.x,
          height: textContainerHeight,
          // backgroundColor: new THREE.Color(0xff0000),
          color: new THREE.Color(0xff0000),
          // alpha: true,
          // justifyContent: "center",
          // textAlign: "center",
          alignContent: "center",
          fontFamily: "/resource/fonts/Roboto-msdf.json",
          fontTexture: "/resource/fonts/Roboto-msdf.png",
          bestFit: "shrink",
          backgroundOpacity: 0,
          fontSize: 8,
        });

        innerContainer.rotation.x = -temp;
        innerContainer.position.copy(rectCenter);
        innerContainer.position.y = innerContainer.position.y - rectSize.y / 2;

        scene.add(innerContainer);

        //

        innerContainer.add(
          new ThreeMeshUI.Text({
            content: selectedHall.name,
          })
        );

        plane.add(innerContainer);
      }

      // version  2

      if (false) {
        fontLoader.load(
          "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
          (font) => {
            const text = "Hello, World!";
            const fontSize = 20;

            const geometry = {
              font, // Font type
              size: fontSize,
              height: 20, // Depth of the text,
              curveSegments: 4,
              bevelEnabled: true,
              // bevelThickness: 5,
              bevelSize: 6,
              bevelSegments: 3,
            };

            let textGeometry = new TextGeometry(text, geometry);

            //Here we compute it's boundingbox
            textGeometry.computeBoundingBox();

            //Here we define the material for the geometry
            const mat = new THREE.MeshBasicMaterial({
              color: new THREE.Color(0x00ff00),
            });

            //Here we create the mesh from using the geometry and material
            let textMesh = new THREE.Mesh(textGeometry, mat);

            textMesh.position.copy(rectCenter);
            // textMesh.position.z = 2000;

            console.log(textMesh.position);

            plane.add(textMesh);

            const textProperties = {
              text: text,
              fontSize: fontSize,
              ...geometry,
            };

            // Add text properties to dat.gui
            gui.add(textProperties, "fontSize").onChange(function (value) {
              textGeometry.dispose(); // Dispose the old geometry
              textGeometry = new TextGeometry(textProperties.text, {
                ...geometry,
                size: value,
              });
              textMesh.geometry = textGeometry;
            });

            // Add text properties to dat.gui
            gui.add(textProperties, "curveSegments").onChange(function (value) {
              textGeometry.dispose(); // Dispose the old geometry
              textGeometry = new TextGeometry(textProperties.text, {
                ...geometry,
                curveSegments: value,
              });
              textMesh.geometry = textGeometry;
            });

            gui.add(textProperties, "height").onChange(function (height) {
              textGeometry.dispose(); // Dispose the old geometry
              textGeometry = new TextGeometry(textProperties.text, {
                ...geometry,
                height,
              });
              textMesh.geometry = textGeometry;
            });
          }
        );
      }

      if (false) {
        const moonDiv = document.createElement("div");
        moonDiv.className = "label";
        moonDiv.textContent = "Moon";
        moonDiv.style.backgroundColor = "transparent";

        const moonLabel = new CSS2DObject(moonDiv);
        moonLabel.position.set(rectMesh.position);
        moonLabel.center.set(0, 1);
        rectMesh.add(moonLabel);
      }

      if (true) {
      }

      // my text
      if (false) {
        fontLoader.load(
          "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
          (font) => {
            const myText = new Text();
            plane.add(myText);
            const testText =
              "lorem lorem lorem lorem ipsum make it longer again";
            let fontSize = 10;

            console.log({ fontSize });

            // Set properties to configure:
            myText.wrapS = THREE.RepeatWrapping;
            myText.anchorX = "left";
            myText.depthOffset = 1;
            myText.lineHeight = 1;
            // myText.whiteSpace = "nowrap";
            // myText.clipRect = [
            //   rectMeshBoundingBox.min.x,
            //   rectMeshBoundingBox.min.y,
            //   rectMeshBoundingBox.max.x,
            //   rectMeshBoundingBox.max.y,
            // ];
            // console.log(scene);
            myText.text = testText;
            // myText.text =
            //   selectedHall.name +
            //   `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum ${index}`;
            myText.fontSize = fontSize;
            myText.position.copy(rectCenter);

            // console.log({ rectCenter, rectMeshBoundingBox });

            if (isRect) {
              myText.position.x = myText.position.x - rectSize.x / 2;
              myText.position.y = myText.position.y + rectSize.y / 2;
              myText.maxWidth = rectSize.x;
            } else {
              const center = findCenterOfGravity(
                planeCoordinates.map(
                  (coord) => new THREE.Vector2(coord[0], coord[1])
                )
              );

              myText.position.x = center?.x;
              myText.position.y = center?.y;
            }

            myText.color = 0x9966ff;
            myText.overflowWrap = "break-word";
            myText.textAlign = "center";
            myText.textIndent = 2;
            myText.userData.type = "text";
            // myText.outlineOffsetX = "1%";

            // Update the rendering:
            myText.sync();
          }
        );
      }

      plane.add(rectMesh);
    });

    console.log(points);

    const temp = points.reduce((acc, cur) => [...acc, cur.x, cur.y, cur.z], []);

    scene.add(plane);

    new DragControls([plane], camera, renderer.domElement);
  });

  // scene.add(innerContainer);

  function handleMouseMove(event) {
    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / (rect.right - rect.left)) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / (rect.bottom - rect.top)) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
  }

  window.addEventListener("mousemove", handleMouseMove, false);
  window.addEventListener("click", handleClick);
  window.addEventListener("resize", onWindowResize);
  renderer.domElement.addEventListener("wheel", onWheel, false);
  labelRenderer.domElement.addEventListener("wheel", onWheel, false);

  animate();
}

// controls.domElement.addEventListener("wheel", onWheel);

function onWheel(event) {
  const zoom = camera.zoom;

  console.log(zoom);

  // console.log(zoom);

  for (let obj of scene.children[0].children) {
    console.log(obj);
    if (obj.userData?.type === "stand-name") {
      const {
        userData: { text },
      } = obj;

      if (zoom > 1) {
        obj.visible = false;
      } else {
        obj.visible = true;
      }
    }

    if (obj.userData?.type === "stand-label") {
      if (zoom > 1) {
        obj.visible = true;
      } else {
        obj.visible = false;
      }
    }
  }
}

function animate() {
  controls.update();
  window.requestAnimationFrame(animate);
  render();
}

// NOTE Stand click event handler
function handleClick(event) {
  const instersects = raycaster.intersectObjects(scene.children?.[0]?.children);

  if (instersects.length > 0) {
    const selectedStand = instersects[0];

    const {
      object: { userData },
    } = selectedStand;

    // debugger;

    // handleStandClick(userData.id);
  }
}

function render() {
  renderer.render(scene, camera);
  labelRenderer?.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

export default init;
