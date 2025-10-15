import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { roomsData, clueMap, itemsData } from '@/lib/GameData';
import styles from './Game.module.css';  // Import CSS Module for game styles
import { Link } from 'lucide-react';

const Game = () => {
  // Refs for THREE.js objects
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const raycasterRef = useRef(null);
  const animationIdRef = useRef(null);
  const jumpscareVideoRef = useRef(null);
  const doorVideoRef = useRef(null);
  const audioRef = useRef({ correctSound: null, wrongSound: null, backgroundMusic: null });
  
  // Game state ref (non-reactive for performance)
  const gameStateRef = useRef({
    gameInitialized: false, loadCompliat: false, currentIndex: 0, targets: [],
    isTransitioning: false, lon: 0, lat: 0, phi: 0, theta: 0,
    isUserInteracting: false, onPointerDownPointerX: 0, onPointerDownPointerY: 0,
    onPointerDownLon: 0, onPointerDownLat: 0, mouseDownX: 0, mouseDownY: 0,
    isDragging: false, mouse: new THREE.Vector2(), roomsUnlocked: 1, doorObject: null,
    jumpscareTriggered: false, roomTimer: null, roomStartTime: null,
    roomTimeLimit: 300000, roomTimeRemaining: 0,
    dpadPressed: { up: false, down: false, left: false, right: false },
    currentRoomIndex: 0, currentScore: 0, currentRoomScores: [0, 0, 0, 0]
  });
  
  // React state for UI
  const [showLanding, setShowLanding] = useState(true);
  const [score, setScore] = useState(0);
  const [currentClue, setCurrentClue] = useState('Clue will appear here...');
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [currentRoom, setCurrentRoom] = useState(0);
  const [roomScores, setRoomScores] = useState([0, 0, 0, 0]);
  const [timerDisplay, setTimerDisplay] = useState('5:00');
  const [timerColor, setTimerColor] = useState('#4CAF50');
  const [audioMuted, setAudioMuted] = useState(false);
  const [showJumpscare, setShowJumpscare] = useState(false);
  const [showDoorTransition, setShowDoorTransition] = useState(false);
  const [roomProgress, setRoomProgress] = useState([]);
  const [scoreFlash, setScoreFlash] = useState({ text: '', className: '' });

  // Initialize audio
  useEffect(() => {
    audioRef.current.correctSound = new Audio('/audio/correct.mp3');
    audioRef.current.correctSound.volume = 0.7;
    audioRef.current.wrongSound = new Audio('/audio/wrong.mp3');
    audioRef.current.wrongSound.volume = 0.5;
    audioRef.current.backgroundMusic = new Audio('/audio/background.mp3');
    audioRef.current.backgroundMusic.volume = 0.3;
    audioRef.current.backgroundMusic.loop = true;
    return () => { if (audioRef.current.backgroundMusic) audioRef.current.backgroundMusic.pause(); };
  }, []);

  // Initialize THREE.js scene
  useEffect(() => {
    if (showLanding || !containerRef.current) return;
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1100);
    camera.position.set(0, 0, 0);
    camera.target = new THREE.Vector3(0, 0, 0);
    cameraRef.current = camera;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const geometry = new THREE.SphereGeometry(600, 60, 40);
    geometry.scale(-1, 1, 1);
    
    // Create mesh with NO texture initially - loadRoom() will set it
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x333333,
      side: THREE.DoubleSide // CRITICAL: DoubleSide to show both inside and outside
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'backGround';
    scene.add(mesh);
    console.log('Background sphere created with DoubleSide material');
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 50;
    raycaster.params.Line.threshold = 50;
    raycasterRef.current = raycaster;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    loadAllItems(scene);
    setTimeout(() => setupGame(), 100);
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      updateCamera();
      renderer.render(scene, camera);
    };
    animate();
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [showLanding]);

  // Load all items into scene
  const loadAllItems = (scene) => {
    const textureLoader = new THREE.TextureLoader();
    console.log(`Loading ${itemsData.length} items into scene...`);
    itemsData.forEach((item, index) => {
      const material = new THREE.MeshBasicMaterial({
        map: textureLoader.load(item.image, 
          (texture) => {
            console.log(`✓ Item texture loaded: "${item.name}" (${index + 1}/${itemsData.length})`);
          },
          undefined,
          (error) => {
            console.error(`✗ Failed to load texture for "${item.name}":`, error);
          }
        ),
        transparent: true,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: true
      });
      material.map.minFilter = THREE.LinearFilter;
      const geometry = new THREE.PlaneGeometry(item.geometry[0], item.geometry[1]);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = item.name;
      mesh.position.set(...item.position);
      mesh.rotation.set(...item.rotation);
      mesh.scale.set(...item.scale);
      mesh.visible = false;
      scene.add(mesh);
      console.log(`Added to scene: "${mesh.name}" at position [${item.position.join(', ')}]`);
    });
    gameStateRef.current.loadCompliat = true;
    console.log('All items added to scene');
  };

  // Setup game
  const setupGame = () => {
    gameStateRef.current.gameInitialized = true;
    gameStateRef.current.currentIndex = 0;
    const saved = localStorage.getItem('roomsUnlocked');
    if (saved) gameStateRef.current.roomsUnlocked = parseInt(saved);
    const urlParams = new URLSearchParams(window.location.search);
    const requested = urlParams.get('room');
    let startRoom = 0;
    if (requested !== null) {
      const idx = parseInt(requested);
      if (idx < gameStateRef.current.roomsUnlocked) startRoom = idx;
    }
    loadRoom(startRoom);
    if (!audioMuted && audioRef.current.backgroundMusic) {
      audioRef.current.backgroundMusic.play().catch(() => {});
    }
    setTimeout(() => {
      if (!gameStateRef.current.jumpscareTriggered) triggerJumpscare();
    }, 60000);
  };

  // Load room
  const loadRoom = (roomIndex) => {
    console.log(`=== Loading Room ${roomIndex} ===`);
    if (roomIndex < 0 || roomIndex >= roomsData.length) {
      console.error(`Invalid room index: ${roomIndex}`);
      return;
    }
    const room = roomsData[roomIndex];
    console.log(`Room data:`, room.name, `Background: ${room.background}`);
    setCurrentRoom(roomIndex);
    gameStateRef.current.currentRoomIndex = roomIndex;
    gameStateRef.current.isTransitioning = false;
    console.log('Transition flag reset to false');
    if (gameStateRef.current.roomTimer) clearInterval(gameStateRef.current.roomTimer);
    const scene = sceneRef.current;
    const backgroundMesh = scene.getObjectByName('backGround');
    if (backgroundMesh) {
      const loader = new THREE.TextureLoader();
      const timestamp = Date.now();
      console.log(`Loading background texture: ${room.background}?t=${timestamp}`);
      loader.load(
        `${room.background}?t=${timestamp}`,
        (texture) => {
          console.log(`✓ Background texture loaded successfully for room ${roomIndex}`);
          console.log(`  - Texture size: ${texture.image.width}x${texture.image.height}`);
          console.log(`  - Image source: ${texture.image.src}`);
          
          // Configure texture
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.needsUpdate = true;
          
          // Dispose old material and texture
          if (backgroundMesh.material) {
            if (backgroundMesh.material.map) {
              backgroundMesh.material.map.dispose();
            }
            backgroundMesh.material.dispose();
          }
          
          // Create new material with DoubleSide rendering (matches original implementation)
          const newMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide
          });
          
          backgroundMesh.material = newMaterial;
          backgroundMesh.material.needsUpdate = true;
          
          console.log(`  - Material updated with DoubleSide rendering`);
          console.log(`  - Background mesh visible: ${backgroundMesh.visible}`);
          
          // Force multiple renders to ensure texture shows
          if (rendererRef.current && scene && cameraRef.current) {
            for (let i = 0; i < 3; i++) {
              rendererRef.current.render(scene, cameraRef.current);
            }
          }
          
          console.log(`✓ Background texture applied and rendered`);
        },
        (progress) => {
          if (progress.lengthComputable) {
            const percent = (progress.loaded / progress.total) * 100;
            console.log(`Loading background: ${percent.toFixed(1)}%`);
          }
        },
        (error) => {
          console.error(`✗ Failed to load background for room ${roomIndex}:`, error);
          console.error(`Attempted path: ${room.background}`);
          console.error(`Full URL would be: ${window.location.origin}${room.background}`);
          
          if (backgroundMesh.material) {
            if (backgroundMesh.material.map) backgroundMesh.material.map.dispose();
            backgroundMesh.material.dispose();
          }
          
          // Fallback to gray material on error
          backgroundMesh.material = new THREE.MeshBasicMaterial({
            color: 0x666666,
            side: THREE.DoubleSide
          });
          backgroundMesh.material.needsUpdate = true;
          
          if (rendererRef.current && scene && cameraRef.current) {
            rendererRef.current.render(scene, cameraRef.current);
          }
          
          console.log('Applied fallback gray material');
        }
      );
    } else {
      console.error('❌ CRITICAL: Background mesh not found in scene!');
    }
    
    // Verify background sphere is rendering
    if (backgroundMesh) {
      console.log('=== Background Sphere Info ===');
      console.log(`  - Position: ${backgroundMesh.position.x}, ${backgroundMesh.position.y}, ${backgroundMesh.position.z}`);
      console.log(`  - Scale: ${backgroundMesh.scale.x}, ${backgroundMesh.scale.y}, ${backgroundMesh.scale.z}`);
      console.log(`  - Visible: ${backgroundMesh.visible}`);
      console.log(`  - Material side: ${backgroundMesh.material.side === THREE.BackSide ? 'BackSide' : backgroundMesh.material.side === THREE.FrontSide ? 'FrontSide' : 'DoubleSide'}`);
      console.log(`  - Mesh scale: ${backgroundMesh.scale.x}, ${backgroundMesh.scale.y}, ${backgroundMesh.scale.z}`);
      console.log(`  - Has texture: ${backgroundMesh.material.map ? 'YES' : 'NO'}`);
      if (backgroundMesh.material.map) {
        console.log(`  - Texture loaded: ${backgroundMesh.material.map.image ? 'YES' : 'NO'}`);
      }
    }
    
    // Hide all objects first
    let hiddenCount = 0;
    scene.children.forEach(o => {
      if (o && o.name && o.name !== 'backGround' && o.name !== 'door') {
        o.visible = false;
        hiddenCount++;
      }
    });
    console.log(`Hidden ${hiddenCount} objects`);
    
    // Show room objects
    let visibleCount = 0;
    console.log(`Making objects visible for room: ${room.objects.join(', ')}`);
    room.objects.forEach(objName => {
      const obj = scene.getObjectByName(objName);
      if (obj) {
        obj.visible = true;
        visibleCount++;
        console.log(`  ✓ Made visible: "${objName}"`);
      } else {
        console.warn(`  ✗ Object not found in scene: "${objName}"`);
      }
    });
    console.log(`Made ${visibleCount}/${room.objects.length} room objects visible`);
    
    // Show fake objects
    if (room.fakeObjects) {
      let fakeCount = 0;
      room.fakeObjects.forEach(objName => {
        const obj = scene.getObjectByName(objName);
        if (obj) {
          obj.visible = true;
          fakeCount++;
        }
      });
      console.log(`Made ${fakeCount} fake objects visible`);
    }
    
    gameStateRef.current.targets = room.objects.slice();
    gameStateRef.current.currentIndex = 0;
    const firstClue = clueMap[room.objects[0]] || `Find: ${room.objects[0]}`;
    setCurrentClue(firstClue);
    console.log('First clue:', firstClue);
    
    // Debug: List all objects in scene with their names
    console.log('=== ALL OBJECTS IN SCENE ===');
    scene.children.forEach((obj, index) => {
      if (obj.name) {
        console.log(`  [${index}] "${obj.name}" - visible: ${obj.visible}`);
      }
    });
    console.log('=== TARGET OBJECTS FOR THIS ROOM ===');
    room.objects.forEach((targetName, index) => {
      const obj = scene.getObjectByName(targetName);
      console.log(`  [${index}] Target: "${targetName}" - Found in scene: ${obj ? 'YES' : 'NO'} - Visible: ${obj ? obj.visible : 'N/A'}`);
    });
    
    updateRoomProgressIndicator(roomIndex);
    startRoomTimer();
    console.log(`Room ${roomIndex} loading complete`);
  };

  // Timer functions
  const startRoomTimer = () => {
    gameStateRef.current.roomStartTime = Date.now();
    gameStateRef.current.roomTimeRemaining = gameStateRef.current.roomTimeLimit;
    if (gameStateRef.current.roomTimer) clearInterval(gameStateRef.current.roomTimer);
    gameStateRef.current.roomTimer = setInterval(() => {
      const elapsed = Date.now() - gameStateRef.current.roomStartTime;
      gameStateRef.current.roomTimeRemaining = gameStateRef.current.roomTimeLimit - elapsed;
      if (gameStateRef.current.roomTimeRemaining <= 0) {
        clearInterval(gameStateRef.current.roomTimer);
        handleRoomTimeout();
      } else {
        updateTimerDisplay();
      }
    }, 100);
    updateTimerDisplay();
  };

  const updateTimerDisplay = () => {
    const seconds = Math.max(0, Math.ceil(gameStateRef.current.roomTimeRemaining / 1000));
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    setTimerDisplay(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
    if (seconds <= 30) setTimerColor('#ff4444');
    else if (seconds <= 60) setTimerColor('#ff9800');
    else setTimerColor('#4CAF50');
  };

  const handleRoomTimeout = () => {
    if (gameStateRef.current.currentRoomIndex < roomsData.length - 1) {
      setCurrentClue("Time's up! Moving to next room...");
      setTimeout(() => showDoorTransitionVideo(), 2000);
    } else {
      setTimeout(() => endGame(), 2000);
    }
  };

  const updateRoomProgressIndicator = (idx) => {
    const progress = roomsData.map((room, i) => ({
      status: i < idx ? 'completed' : i === idx ? 'current' : 'pending'
    }));
    setRoomProgress(progress);
  };

  // Camera update
  const updateCamera = () => {
    const state = gameStateRef.current;
    const camera = cameraRef.current;
    if (!camera) return;
    const rotSpeed = 1.0;
    if (state.dpadPressed.right) state.lon += rotSpeed;
    if (state.dpadPressed.left) state.lon -= rotSpeed;
    if (state.dpadPressed.up) state.lat += rotSpeed;
    if (state.dpadPressed.down) state.lat -= rotSpeed;
    state.lat = Math.max(-85, Math.min(85, state.lat));
    state.phi = THREE.MathUtils.degToRad(90 - state.lat);
    state.theta = THREE.MathUtils.degToRad(state.lon);
    camera.target.x = 500 * Math.sin(state.phi) * Math.cos(state.theta);
    camera.target.y = 500 * Math.cos(state.phi);
    camera.target.z = 500 * Math.sin(state.phi) * Math.sin(state.theta);
    camera.lookAt(camera.target);
  };

  // Mouse/Touch event handlers
  const onMouseDown = useCallback((e) => {
    if (e.target.closest('.dpad-container') || e.target.closest('button')) return;
    const state = gameStateRef.current;
    state.isUserInteracting = true;
    state.isDragging = false;
    state.mouseDownX = e.clientX;
    state.mouseDownY = e.clientY;
    state.onPointerDownPointerX = e.clientX;
    state.onPointerDownPointerY = e.clientY;
    state.onPointerDownLon = state.lon;
    state.onPointerDownLat = state.lat;
  }, []);

  const onMouseMove = useCallback((e) => {
    const state = gameStateRef.current;
    state.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    state.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    if (state.isUserInteracting) {
      const deltaX = Math.abs(e.clientX - state.mouseDownX);
      const deltaY = Math.abs(e.clientY - state.mouseDownY);
      if (deltaX > 5 || deltaY > 5) {
        state.isDragging = true;
        state.lon = (state.onPointerDownPointerX - e.clientX) * 0.1 + state.onPointerDownLon;
        state.lat = (e.clientY - state.onPointerDownPointerY) * 0.1 + state.onPointerDownLat;
      }
    }
  }, []);

  const onMouseUp = useCallback((e) => {
    const state = gameStateRef.current;
    if (state.isUserInteracting && !state.isDragging) {
      if (!e.target.closest('button') && !e.target.closest('.dpad-container')) {
        state.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        state.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        handleSelection();
      }
    }
    state.isUserInteracting = false;
    state.isDragging = false;
  }, []);

  const onTouchStart = useCallback((e) => {
    if (e.target.closest('.dpad-container') || e.target.closest('button')) return;
    const state = gameStateRef.current;
    state.mouseDownX = e.touches[0].clientX;
    state.mouseDownY = e.touches[0].clientY;
    state.onPointerDownPointerX = e.touches[0].clientX;
    state.onPointerDownPointerY = e.touches[0].clientY;
    state.onPointerDownLon = state.lon;
    state.onPointerDownLat = state.lat;
    state.isDragging = false;
  }, []);

  const onTouchMove = useCallback((e) => {
    const state = gameStateRef.current;
    if (e.touches.length > 0) {
      const deltaX = Math.abs(e.touches[0].clientX - state.mouseDownX);
      const deltaY = Math.abs(e.touches[0].clientY - state.mouseDownY);
      if (deltaX > 5 || deltaY > 5) {
        state.isDragging = true;
        state.lon = (state.onPointerDownPointerX - e.touches[0].clientX) * 0.1 + state.onPointerDownLon;
        state.lat = (e.touches[0].clientY - state.onPointerDownPointerY) * 0.1 + state.onPointerDownLat;
      }
    }
  }, []);

  const onTouchEnd = useCallback((e) => {
    const state = gameStateRef.current;
    if (!state.isDragging) {
      if (!e.target.closest('button') && !e.target.closest('.dpad-container')) {
        state.mouse.x = (state.onPointerDownPointerX / window.innerWidth) * 2 - 1;
        state.mouse.y = -(state.onPointerDownPointerY / window.innerHeight) * 2 + 1;
        handleSelection();
      }
    }
    state.isDragging = false;
  }, []);

  // Wheel zoom removed - only D-pad controls allowed
  // const onWheel = useCallback((e) => {
  //   const camera = cameraRef.current;
  //   if (camera && camera.fov + e.deltaY * 0.05 <= 90) {
  //     camera.fov += e.deltaY * 0.05;
  //     camera.updateProjectionMatrix();
  //   }
  // }, []);

  // Attach event listeners
  useEffect(() => {
    if (showLanding) return;
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
    // Wheel zoom removed
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [showLanding, onMouseDown, onMouseMove, onMouseUp, onTouchStart, onTouchMove, onTouchEnd]);

  // Object selection and detection
  const handleSelection = () => {
    const state = gameStateRef.current;
    if (!state.gameInitialized || state.isTransitioning) return;
    const raycaster = raycasterRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    raycaster.setFromCamera(state.mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true).filter(hit => {
      return hit.object && hit.object.name !== 'backGround' && hit.object.name !== 'door';
    });
    console.log(`Raycaster found ${intersects.length} potential objects`);
    if (intersects.length > 0) {
      console.log('Top 3 intersections:', intersects.slice(0, 3).map(hit => ({
        name: hit.object.name,
        visible: hit.object.visible,
        distance: hit.distance
      })));
    }
    if (intersects.length === 0) {
      console.log('No objects intersected - applying penalty');
      updateScore(-2);
      return;
    }
    const hitObj = intersects[0].object;
    if (!hitObj.visible || (hitObj.userData && hitObj.userData.isAnimating)) {
      updateScore(-2);
      return;
    }
    const expected = state.targets[state.currentIndex];
    const room = roomsData[gameStateRef.current.currentRoomIndex];
    const isFake = room.fakeObjects && room.fakeObjects.includes(hitObj.name);
    console.log(`Clicked: "${hitObj.name}" | Expected: "${expected}" | Match: ${hitObj.name === expected}`);
    
    // Debug character codes to detect invisible characters
    if (hitObj.name !== expected && hitObj.name.includes('Hour') || expected.includes('Hour')) {
      console.log('HOUR GLASS DEBUG:');
      console.log('  Clicked chars:', Array.from(hitObj.name).map(c => `${c}(${c.charCodeAt(0)})`).join(' '));
      console.log('  Expected chars:', Array.from(expected).map(c => `${c}(${c.charCodeAt(0)})`).join(' '));
      console.log('  Clicked length:', hitObj.name.length);
      console.log('  Expected length:', expected.length);
    }
    
    if (hitObj.name === expected) {
      console.log('✓ Correct object found!');
      animateCorrectObject(hitObj);
      updateScore(5);
      setTimeout(() => nextClue(), 2200);
    } else if (isFake) {
      updateScore(-2);
      const orig = currentClue;
      setCurrentClue('This object is not what you seek...');
      setTimeout(() => setCurrentClue(orig), 1500);
    } else {
      updateScore(-2);
    }
  };

  // Animate object when found
  const animateCorrectObject = (object) => {
    if (!object) return;
    object.userData.isAnimating = true;
    const origPos = object.position.clone();
    const origScale = object.scale.clone();
    const origOpacity = object.material.opacity || 1;
    if (object.material) object.material.transparent = true;
    const duration = 2000;
    const startTime = Date.now();
    const camera = cameraRef.current;
    const centerPos = new THREE.Vector3();
    centerPos.copy(camera.target).normalize().multiplyScalar(100);
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      if (progress < 0.25) {
        const scale = 1 + (progress / 0.25) * 0.5;
        object.scale.setScalar(scale * origScale.x);
      } else if (progress < 0.75) {
        const moveProgress = (progress - 0.25) / 0.5;
        object.position.lerpVectors(origPos, centerPos, moveProgress);
      } else {
        object.position.copy(centerPos);
        if (object.material) {
          object.material.opacity = origOpacity * (1 - ((progress - 0.75) / 0.25));
        }
      }
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        object.visible = false;
        object.position.copy(origPos);
        object.scale.copy(origScale);
        if (object.material) object.material.opacity = origOpacity;
        object.userData.isAnimating = false;
      }
    };
    requestAnimationFrame(animate);
  };

  // Score system
  const updateScore = (delta) => {
    setScore(prev => {
      const newScore = prev + delta;
      gameStateRef.current.currentScore = newScore;
      return newScore;
    });
    setRoomScores(prev => {
      const updated = [...prev];
      updated[gameStateRef.current.currentRoomIndex] += delta;
      gameStateRef.current.currentRoomScores = updated;
      return updated;
    });
    setScoreFlash({
      text: (delta > 0 ? '+' : '') + delta,
      className: delta > 0 ? 'flash-green' : 'flash-red'
    });
    setTimeout(() => setScoreFlash({ text: '', className: '' }), 750);
    if (!audioMuted) {
      if (delta > 0 && audioRef.current.correctSound) {
        audioRef.current.correctSound.currentTime = 0;
        audioRef.current.correctSound.play().catch(() => {});
      } else if (delta < 0 && audioRef.current.wrongSound) {
        audioRef.current.wrongSound.currentTime = 0;
        audioRef.current.wrongSound.play().catch(() => {});
      }
    }
  };

  // Game progression
  const nextClue = () => {
    const state = gameStateRef.current;
    state.currentIndex++;
    if (state.currentIndex >= state.targets.length) {
      if (state.roomTimer) clearInterval(state.roomTimer);
      if (state.currentRoomIndex < roomsData.length - 1) {
        setCurrentClue('Room Complete! Moving to next room...');
        console.log('All objects found in room', state.currentRoomIndex);
        setTimeout(() => showDoorTransitionVideo(), 1000);
      } else {
        console.log('All rooms complete!');
        endGame();
      }
    } else {
      const nextTarget = state.targets[state.currentIndex];
      setCurrentClue(clueMap[nextTarget] || `Find: ${nextTarget}`);
    }
  };

  // Room transitions
  const showDoorTransitionVideo = () => {
    if (gameStateRef.current.isTransitioning) {
      console.warn('Already transitioning, ignoring duplicate call');
      return;
    }
    
    console.log('=== Starting Room Transition ===');
    gameStateRef.current.isTransitioning = true;
    setShowDoorTransition(true);
    
    // Use setTimeout to ensure state updates and ref is available
    setTimeout(() => {
      const video = doorVideoRef.current;
      if (video) {
        console.log('Door video element found, resetting and playing');
        video.currentTime = 0;
        video.muted = false;
        video.volume = 0.8;
        
        video.onerror = (e) => {
          console.error('Door video error:', e);
          setShowDoorTransition(false);
          transitionToNextRoom();
        };
        
        video.onended = () => {
          console.log('Door video ended normally');
          setShowDoorTransition(false);
          transitionToNextRoom();
        };
        
        video.play().catch((err) => {
          console.error('Failed to play door video:', err);
          setShowDoorTransition(false);
          transitionToNextRoom();
        });
        
        // Fallback if video doesn't end
        setTimeout(() => {
          if (gameStateRef.current.isTransitioning && showDoorTransition) {
            console.warn('Door video timeout (10s) - forcing transition');
            setShowDoorTransition(false);
            transitionToNextRoom();
          }
        }, 10000);
      } else {
        console.warn('No door video element available - direct transition');
        // No video available, proceed directly
        setTimeout(() => {
          setShowDoorTransition(false);
          transitionToNextRoom();
        }, 1500);
      }
    }, 100);
  };

  const transitionToNextRoom = () => {
    if (!gameStateRef.current.isTransitioning) {
      console.warn('transitionToNextRoom called but not transitioning');
      return;
    }
    
    const currentRoomIndex = gameStateRef.current.currentRoomIndex;
    const nextRoom = currentRoomIndex + 1;
    console.log('Transitioning from room', currentRoomIndex, 'to room', nextRoom);
    
    // Check if next room exists
    if (nextRoom >= roomsData.length) {
      console.log('No more rooms available, ending game');
      gameStateRef.current.isTransitioning = false;
      setTimeout(() => endGame(), 500);
      return;
    }
    
    if (nextRoom >= gameStateRef.current.roomsUnlocked) {
      gameStateRef.current.roomsUnlocked = nextRoom + 1;
      localStorage.setItem('roomsUnlocked', gameStateRef.current.roomsUnlocked);
      console.log('Unlocked room', nextRoom);
    }
    
    setTimeout(() => {
      loadRoom(nextRoom);
    }, 500);
  };

  // End game
  const endGame = () => {
    console.log('Ending game with score:', gameStateRef.current.currentScore);
    console.log('Room scores:', gameStateRef.current.currentRoomScores);
    setFinalScore(gameStateRef.current.currentScore);
    setRoomScores(gameStateRef.current.currentRoomScores);
    setGameOver(true);
    if (gameStateRef.current.roomTimer) clearInterval(gameStateRef.current.roomTimer);
  };

  // Jumpscare
  const triggerJumpscare = () => {
    if (gameStateRef.current.jumpscareTriggered) return;
    console.log('Triggering jumpscare...');
    gameStateRef.current.jumpscareTriggered = true;
    if (audioRef.current.backgroundMusic) audioRef.current.backgroundMusic.pause();
    setShowJumpscare(true);
    
    setTimeout(() => {
      const video = jumpscareVideoRef.current;
      if (video) {
        console.log('Jumpscare video found, setting up handlers');
        video.muted = false;
        video.volume = 0.8;
        video.currentTime = 0;
        
        // Set up event handlers BEFORE playing
        video.onended = () => {
          console.log('Jumpscare video ended');
          setShowJumpscare(false);
          if (!audioMuted && audioRef.current.backgroundMusic) {
            audioRef.current.backgroundMusic.play().catch(() => {});
          }
        };
        
        video.onerror = (e) => {
          console.error('Jumpscare video error:', e);
          setShowJumpscare(false);
          if (!audioMuted && audioRef.current.backgroundMusic) {
            audioRef.current.backgroundMusic.play().catch(() => {});
          }
        };
        
        video.play().catch((err) => {
          console.error('Failed to play jumpscare video:', err);
          setShowJumpscare(false);
          if (!audioMuted && audioRef.current.backgroundMusic) {
            audioRef.current.backgroundMusic.play().catch(() => {});
          }
        });
        
        // Fallback timeout
        setTimeout(() => {
          if (jumpscareVideoRef.current && !jumpscareVideoRef.current.paused) {
            console.log('Jumpscare timeout, forcing end');
            setShowJumpscare(false);
            if (!audioMuted && audioRef.current.backgroundMusic) {
              audioRef.current.backgroundMusic.play().catch(() => {});
            }
          }
        }, 10000);
      } else {
        console.warn('No jumpscare video element found');
        setShowJumpscare(false);
        if (!audioMuted && audioRef.current.backgroundMusic) {
          audioRef.current.backgroundMusic.play().catch(() => {});
        }
      }
    }, 100);
  };

  // Audio controls
  const toggleMute = () => {
    setAudioMuted(prev => {
      const newMuted = !prev;
      if (newMuted) {
        if (audioRef.current.backgroundMusic) audioRef.current.backgroundMusic.pause();
      } else {
        if (gameStateRef.current.gameInitialized && audioRef.current.backgroundMusic) {
          audioRef.current.backgroundMusic.play().catch(() => {});
        }
      }
      return newMuted;
    });
  };

  // Restart game
  const restartGame = () => {
    setGameOver(false);
    setScore(0);
    setCurrentRoom(0);
    setRoomScores([0, 0, 0, 0]);
    gameStateRef.current.currentIndex = 0;
    gameStateRef.current.currentRoomIndex = 0;
    gameStateRef.current.currentScore = 0;
    gameStateRef.current.currentRoomScores = [0, 0, 0, 0];
    gameStateRef.current.jumpscareTriggered = false;
    loadRoom(0);
  };

  return (
    <>
      {showLanding ? (
        <LandingPage onStart={() => setShowLanding(false)} roomsUnlocked={gameStateRef.current.roomsUnlocked} />
      ) : (
        <div className={styles.gameContainer}>
          <div ref={containerRef} id="container" />
          <div className={styles.uiRoot}>
            <div id="clueBar" className={`${styles.clueBar} fade-in`}>{currentClue}</div>
            <div className={styles.scorePanel}>
              <span id="scoreLabel">Score: </span>
              <span id="scoreValue" className={styles.scoreValue}>{score}</span>
              <span id="scoreFlash" className={`${styles.scoreFlash} ${scoreFlash.className}`}>{scoreFlash.text}</span>
            </div>
            <div className={styles.timerDisplay} style={{ color: timerColor }}>{timerDisplay}</div>
            <button className={`${styles.backButton}`} onClick={() => setShowLanding(true)}>← Back to Menu</button>
            <button className={`${styles.muteButton} ${audioMuted ? styles.muted : ''}`} onClick={toggleMute}>
              {audioMuted ? '🔇' : '🔊'}
            </button>
            <div className={styles.roomProgress}>
              {roomProgress.map((r, i) => (
                <span key={i} className={`${styles.roomProgressDot} ${r.status}`} />
              ))}
            </div>
            {gameOver && (
              <div className={styles.endOverlay}>
                <div className={styles.endContent}>
                  <h1>You've Conquered the Shadows of Bhangarh!</h1>
                  <p style={{ fontSize: '18px', margin: '15px 0', color: '#ffd700' }}>🏆 Victory Achieved! 🏆</p>
                  <p>You've explored all the haunted chambers and found every cursed artifact.</p>
                  <p className={styles.gameOverTotalScore}>
                    Total Score: <span className={styles.gameOverTotalScoreValue}>{finalScore}</span>
                  </p>
                  <div className={styles.gameOverScoreBreakdown}>
                    <h3 className={styles.gameOverRoomTitle}>Room Scores:</h3>
                    {roomsData.map((room, i) => (
                      <div key={i} className={styles.gameOverRoomScore}>
                        <strong>{room.name}:</strong> 
                        <span className={roomScores[i] >= 0 ? styles.gameOverRoomScorePositive : styles.gameOverRoomScoreNegative}>
                          {roomScores[i]} points
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.endButtons}>
                    <Link href='/game/escape_room'><button>Proceed to Next Round</button></Link>
                  </div>
                </div>
              </div>
            )}
            {showJumpscare && (
              <div className={styles.jumpscareOverlay}>
                <video ref={jumpscareVideoRef} className={styles.jumpscareVideo} autoPlay>
                  <source src="/jumpscare/jumpscare.mp4" type="video/mp4" />
                </video>
              </div>
            )}
            {showDoorTransition && (
              <div className={styles.doorTransitionOverlay}>
                <video ref={doorVideoRef} className={styles.doorTransitionVideo} autoPlay>
                  <source src="/assets/dooropening.mp4" type="video/mp4" />
                </video>
              </div>
            )}
            <DPad onPress={(dir, pressed) => { gameStateRef.current.dpadPressed[dir] = pressed; }} />
          </div>
        </div>
      )}
    </>
  );
};

// Landing Page Component
const LandingPage = ({ onStart, roomsUnlocked }) => {
  return (
    <div className={styles.landingPage}>
      <div className={styles.landingContainer}>
        <div className={styles.header}>
          <h1 className={styles.gameTitle}>Shadows of Bhangarh</h1>
          <p className={styles.subtitle}>A Horror Hidden Object Experience</p>
        </div>
        <div className={styles.content}>
          <div className={styles.storySection}>
            <h2>The Legend</h2>
            <p>Deep within the cursed ruins of Bhangarh Fort lies a collection of haunted artifacts. Each object holds the memory of those who perished within these walls. Only by finding them all can you escape the shadows that bind this place.</p>
          </div>
          <div className={styles.instructionsSection}>
            <h2>How to Play</h2>
            <div className={styles.instructionGrid}>
              <div className={styles.instructionItem}>
                <div className={styles.instructionIcon}>🔍</div>
                <h3>Read the Clue</h3>
                <p>Each riddle describes a hidden object in cryptic terms. Think carefully about what it might be.</p>
              </div>
              <div className={styles.instructionItem}>
                <div className={styles.instructionIcon}>👆</div>
                <h3>Click to Find</h3>
                <p>Click on objects in the 3D scene. You can drag to look around without penalty.</p>
              </div>
              <div className={styles.instructionItem}>
                <div className={styles.instructionIcon}>⚡</div>
                <h3>Score Points</h3>
                <p>Correct finds: <span className={styles.pointsPositive}>+5</span><br/>Wrong clicks: <span className={styles.pointsNegative}>-2</span></p>
              </div>
              <div className={styles.instructionItem}>
                <div className={styles.instructionIcon}>🎯</div>
                <h3>Sequential Hunt</h3>
                <p>Find objects one by one. Each clue leads to the next until all are discovered.</p>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.footer}>
          <button className={styles.startButton} onClick={onStart}>
            <span className={styles.buttonText}>Enter the Shadows</span>
            <span className={styles.buttonSubtitle}>Begin Your Hunt</span>
          </button>
          <div className={styles.roomSelection}>
            <h3 style={{ color: '#ff9800', margin: '20px 0 10px 0', fontSize: '18px' }}>Or Select a Specific Room:</h3>
            <div className={styles.roomButtons}>
              {roomsData.map((room, idx) => (
                <button
                  key={idx}
                  className={styles.roomBtn}
                  disabled={idx >= roomsUnlocked}
                  onClick={() => window.location.href = `?room=${idx}`}
                >
                  <span className={styles.roomNumber}>{idx + 1}</span>
                  <span className={styles.roomName}>{room.name}</span>
                  {idx >= roomsUnlocked && <div style={{ fontSize: '12px', color: '#ff4444', marginTop: '5px' }}>🔒 Locked</div>}
                </button>
              ))}
            </div>
          </div>
          <p className={styles.warning}>⚠️ Best experienced with headphones for full atmospheric immersion</p>
        </div>
      </div>
    </div>
  );
};

// D-Pad Component
const DPad = ({ onPress }) => {
  const handlePress = (dir, pressed) => {
    onPress(dir, pressed);
  };
  
  return (
    <div className={styles.dpadContainer}>
      <div className={styles.dpadCenter} />
      <button
        className={`${styles.dpadButton} ${styles.dpadUp}`}
        onMouseDown={() => handlePress('up', true)}
        onMouseUp={() => handlePress('up', false)}
        onMouseLeave={() => handlePress('up', false)}
        onTouchStart={(e) => { e.preventDefault(); handlePress('up', true); }}
        onTouchEnd={(e) => { e.preventDefault(); handlePress('up', false); }}
      >
        <div className={styles.dpadArrow} />
      </button>
      <button
        className={`${styles.dpadButton} ${styles.dpadRight}`}
        onMouseDown={() => handlePress('right', true)}
        onMouseUp={() => handlePress('right', false)}
        onMouseLeave={() => handlePress('right', false)}
        onTouchStart={(e) => { e.preventDefault(); handlePress('right', true); }}
        onTouchEnd={(e) => { e.preventDefault(); handlePress('right', false); }}
      >
        <div className={styles.dpadArrow} />
      </button>
      <button
        className={`${styles.dpadButton} ${styles.dpadDown}`}
        onMouseDown={() => handlePress('down', true)}
        onMouseUp={() => handlePress('down', false)}
        onMouseLeave={() => handlePress('down', false)}
        onTouchStart={(e) => { e.preventDefault(); handlePress('down', true); }}
        onTouchEnd={(e) => { e.preventDefault(); handlePress('down', false); }}
      >
        <div className={styles.dpadArrow} />
      </button>
      <button
        className={`${styles.dpadButton} ${styles.dpadLeft}`}
        onMouseDown={() => handlePress('left', true)}
        onMouseUp={() => handlePress('left', false)}
        onMouseLeave={() => handlePress('left', false)}
        onTouchStart={(e) => { e.preventDefault(); handlePress('left', true); }}
        onTouchEnd={(e) => { e.preventDefault(); handlePress('left', false); }}
      >
        <div className={styles.dpadArrow} />
      </button>
    </div>
  );
};

export default Game;
