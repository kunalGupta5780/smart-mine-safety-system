import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/* =========================================================
   SMART MINE SAFETY SYSTEM
   AUTONOMOUS RESCUE ROVER
   =========================================================
   - Continuous arched mine tunnel
   - Timber supports
   - Rails
   - Mine lamps
   - Rocks / rubble
   - Tracked rover
   - Autonomous movement
   - Obstacle avoidance
   - Rubble climbing
   - FOLLOW / FPV / FREE camera
   - Mouse orbit
   - Wheel zoom
   - +/- zoom buttons
   - Thermal mode
   - Thermal rescue detection
   - Rescue alert
   - AI anomaly simulation
   - FastAPI /rover-data telemetry
   ========================================================= */

const host = document.getElementById('rover-scene');

if (!host) {
    console.error('Rover scene #rover-scene was not found.');
} else {

    /* =====================================================
       HELPERS
       ===================================================== */

    const $ = (id) => document.getElementById(id);

    const clamp = (value, min, max) =>
        Math.max(min, Math.min(max, value));


    /* =====================================================
       REMOVE OLD PLACEHOLDER / OLD THREE.JS CONTENT
       ===================================================== */

    [...host.children].forEach((child) => {

        if (
            !child.classList.contains('rover-zoom-controls') &&
            !child.classList.contains('rover-camera-controls')
        ) {
            child.remove();
        }

    });


    /* =====================================================
       UI REFERENCES
       ===================================================== */

    const statusBadge = $('rover-status-badge');

    const missionEl = $('rover-mission');
    const positionEl = $('rover-position');
    const movementEl = $('rover-movement');
    const obstacleEl = $('rover-obstacle');
    const batteryEl = $('rover-battery');

    const bottomStateEl = $('rover-bottom-state');
    const autonomyEl = $('rover-autonomy');
    const targetEl = $('rover-target');
    const lastUpdateEl = $('rover-last-update');

    const coEl = $('rover-co');
    const tempEl = $('rover-temp');
    const humidityEl = $('rover-humidity');
    const smokeEl = $('rover-smoke');
    const airflowEl = $('rover-airflow');

    const deployButton = $('rover-deploy-button');
    const pauseButton = $('rover-pause-button');
    const returnButton = $('rover-return-button');

    const normalButton = $('rover-normal-view');
    const cameraButton = $('rover-camera-mode');
    const thermalButton = $('rover-thermal-view');

    const zoomInButton = $('rover-zoom-in');
    const zoomOutButton = $('rover-zoom-out');

    const logEl = $('rover-log');


    /* =====================================================
       MISSION / NAVIGATION
       ===================================================== */

    const START_X = -30;
    const END_X = 38;

    const SPEED = 2.6;

    const OBSTACLE_X = -2;

    const AVOID_Z = 2.8;

    const rubbleZones = [
        {
            start: -18,
            end: -13,
            height: 0.8
        },
        {
            start: -8,
            end: -3,
            height: 1.1
        },
        {
            start: 7,
            end: 12,
            height: 0.9
        },
        {
            start: 22,
            end: 31,
            height: 2.2
        }
    ];

    const rescueTargetPosition =
        new THREE.Vector3(
            27,
            1.05,
            1.2
        );


    /* =====================================================
       SINGLE STATE OBJECT
       ===================================================== */

    const state = {

        moving: false,
        paused: false,
        returning: false,

        missionStarted: false,
        missionComplete: false,

        obstacle: false,
        avoiding: false,
        climbing: false,

        thermal: false,
        personDetected: false,

        battery: 100,

        cameraMode: 'FOLLOW',

        /*
           18 = farther camera
           gives the rover more room when it jumps
        */
        cameraDistance: 18,

        /*
           Mouse orbit values
        */
        yaw: Math.PI,
        pitch: 0.32,

        pointerDown: false,

        lastPointerX: 0,
        lastPointerY: 0,

        lastTelemetry: 0,
        lastSensor: 0

    };


    /* =====================================================
       SENSOR VALUES
       ===================================================== */

    const sensors = {

        co: 10,

        temperature: 26,

        humidity: 54,

        smoke: 2,

        airflow: 2.9

    };


    /* =====================================================
       THREE.JS SCENE
       ===================================================== */

    const scene =
        new THREE.Scene();

    scene.background =
        new THREE.Color(
            0x050608
        );

    scene.fog =
        new THREE.FogExp2(
            0x050608,
            0.021
        );


    /* =====================================================
       CAMERA
       ===================================================== */

    const camera =
        new THREE.PerspectiveCamera(
            52,
            Math.max(host.clientWidth, 1) /
                Math.max(host.clientHeight, 1),
            0.1,
            220
        );


    camera.position.set(
        START_X - 18,
        7,
        9
    );


    /* =====================================================
       RENDERER
       ===================================================== */

    const renderer =
        new THREE.WebGLRenderer({
            antialias: true
        });

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            2
        )
    );

    renderer.setSize(
        Math.max(host.clientWidth, 1),
        Math.max(host.clientHeight, 1)
    );

    renderer.shadowMap.enabled = true;

    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;

    renderer.outputColorSpace =
        THREE.SRGBColorSpace;

    renderer.toneMapping =
        THREE.ACESFilmicToneMapping;

    renderer.toneMappingExposure =
        1.3;

    renderer.domElement.style.display =
        'block';

    renderer.domElement.style.width =
        '100%';

    renderer.domElement.style.height =
        '100%';

    renderer.domElement.style.position =
        'absolute';

    renderer.domElement.style.inset =
        '0';

    renderer.domElement.style.zIndex =
        '1';

    renderer.domElement.style.touchAction =
        'none';

    renderer.domElement.style.cursor =
        'grab';

    host.appendChild(
        renderer.domElement
    );


    /* =====================================================
       LIGHTING
       ===================================================== */

    const ambient =
        new THREE.AmbientLight(
            0x9aa8b5,
            0.95
        );

    scene.add(ambient);


    const directional =
        new THREE.DirectionalLight(
            0xaab6bf,
            1.35
        );

    directional.position.set(
        -20,
        14,
        8
    );

    directional.castShadow = true;

    scene.add(directional);


    /* =====================================================
       MATERIALS
       ===================================================== */

    const wallMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x202426,
            roughness: 1
        });


    const roofMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x1b1e20,
            roughness: 1
        });


    const groundMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x26292b,
            roughness: 1
        });


    const timberMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x5b3b20,
            roughness: 0.95
        });


    const timberDarkMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x3d2818,
            roughness: 1
        });


    const metalMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x555e65,
            metalness: 0.72,
            roughness: 0.35
        });


    const darkMetalMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x11161a,
            metalness: 0.55,
            roughness: 0.65
        });


    const rockMaterials = [

        new THREE.MeshStandardMaterial({
            color: 0x2d3133,
            roughness: 1
        }),

        new THREE.MeshStandardMaterial({
            color: 0x383d40,
            roughness: 1
        }),

        new THREE.MeshStandardMaterial({
            color: 0x24282a,
            roughness: 1
        })

    ];


    /* =====================================================
       MINE ROOT
       ===================================================== */

    const mine =
        new THREE.Group();

    scene.add(mine);


    /* =====================================================
       FLOOR
       ===================================================== */

    const floor =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                150,
                0.28,
                12.5
            ),
            groundMaterial
        );


    floor.position.set(
        35,
        -0.14,
        0
    );

    floor.receiveShadow = true;

    mine.add(floor);


    /* =====================================================
       ARCHED TUNNEL
       ===================================================== */

    function createTunnel(
        startX,
        endX
    ) {

        const slices = 72;
        const arcSteps = 24;

        const innerRadius = 5.15;
        const outerRadius = 5.85;

        const centerY = 0.65;

        const vertices = [];
        const indices = [];


        for (
            let ix = 0;
            ix <= slices;
            ix++
        ) {

            const x =
                THREE.MathUtils.lerp(
                    startX,
                    endX,
                    ix / slices
                );


            for (
                let a = 0;
                a <= arcSteps;
                a++
            ) {

                const t =
                    Math.PI -
                    (
                        Math.PI *
                        a /
                        arcSteps
                    );


                const innerZ =
                    Math.cos(t) *
                    innerRadius;

                const innerY =
                    centerY +
                    Math.sin(t) *
                    innerRadius;


                const outerZ =
                    Math.cos(t) *
                    outerRadius;

                const outerY =
                    centerY +
                    Math.sin(t) *
                    outerRadius;


                vertices.push(
                    x,
                    innerY,
                    innerZ
                );

                vertices.push(
                    x,
                    outerY,
                    outerZ
                );

            }

        }


        const stride =
            (arcSteps + 1) * 2;


        for (
            let ix = 0;
            ix < slices;
            ix++
        ) {

            for (
                let a = 0;
                a < arcSteps;
                a++
            ) {

                const p =
                    a * 2;

                const n =
                    p + 2;


                const r0 =
                    ix * stride;

                const r1 =
                    (ix + 1) * stride;


                indices.push(
                    r0 + p,
                    r1 + p,
                    r0 + n
                );

                indices.push(
                    r1 + p,
                    r1 + n,
                    r0 + n
                );


                indices.push(
                    r0 + p + 1,
                    r0 + n + 1,
                    r1 + p + 1
                );

                indices.push(
                    r1 + p + 1,
                    r0 + n + 1,
                    r1 + n + 1
                );

            }

        }


        const geometry =
            new THREE.BufferGeometry();

        geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(
                vertices,
                3
            )
        );

        geometry.setIndex(
            indices
        );

        geometry.computeVertexNormals();


        const shell =
            new THREE.Mesh(
                geometry,
                roofMaterial
            );

        shell.receiveShadow = true;
        shell.castShadow = true;

        mine.add(shell);


        /* LOWER WALLS */

        const length =
            endX - startX;


        const wallHeight =
            5.6;


        const leftWall =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    length,
                    wallHeight,
                    0.75
                ),
                wallMaterial
            );


        leftWall.position.set(
            (startX + endX) / 2,
            wallHeight / 2,
            -5.42
        );


        leftWall.receiveShadow =
            true;

        mine.add(
            leftWall
        );


        const rightWall =
            leftWall.clone();

        rightWall.position.z =
            5.42;

        mine.add(
            rightWall
        );

    }


    createTunnel(
        -38,
        46
    );


    /* =====================================================
       ROCK DETAILS
       ===================================================== */

    function createRock(
        x,
        y,
        z,
        sx,
        sy,
        sz,
        material
    ) {

        const rock =
            new THREE.Mesh(
                new THREE.DodecahedronGeometry(
                    1,
                    1
                ),
                material
            );


        rock.position.set(
            x,
            y,
            z
        );


        rock.scale.set(
            sx,
            sy,
            sz
        );


        rock.rotation.set(
            Math.random() * 2.5,
            Math.random() * 2.5,
            Math.random() * 2.5
        );


        rock.castShadow = true;
        rock.receiveShadow = true;


        mine.add(
            rock
        );

    }


    for (
        let i = 0;
        i < 58;
        i++
    ) {

        const x =
            -36 +
            Math.random() * 80;


        const side =
            Math.random() <
                0.5
                ? -1
                : 1;


        createRock(

            x,

            0.22 +
                Math.random() *
                    0.42,

            side *
                (
                    4 +
                    Math.random()
                ),

            0.16 +
                Math.random() *
                    0.44,

            0.14 +
                Math.random() *
                    0.35,

            0.18 +
                Math.random() *
                    0.4,

            rockMaterials[
                Math.floor(
                    Math.random() *
                    rockMaterials.length
                )
            ]

        );

    }


    /* =====================================================
       TIMBER SUPPORTS
       ===================================================== */

    function createSupport(x) {

        const postHeight =
            5.25;


        const leftPost =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.38,
                    postHeight,
                    0.38
                ),
                timberMaterial
            );


        leftPost.position.set(
            x,
            postHeight / 2,
            -5.0
        );


        leftPost.castShadow =
            true;

        mine.add(
            leftPost
        );


        const rightPost =
            leftPost.clone();

        rightPost.position.z =
            5.0;

        mine.add(
            rightPost
        );


        const points = [];


        for (
            let i = 0;
            i <= 18;
            i++
        ) {

            const t =
                Math.PI -
                (
                    Math.PI *
                    i /
                    18
                );


            points.push(
                new THREE.Vector3(
                    0,
                    1.0 +
                        Math.sin(t) *
                        4.15,
                    Math.cos(t) *
                        5.0
                )
            );

        }


        const curve =
            new THREE.CatmullRomCurve3(
                points
            );


        const beam =
            new THREE.Mesh(
                new THREE.TubeGeometry(
                    curve,
                    24,
                    0.18,
                    8,
                    false
                ),
                timberDarkMaterial
            );


        beam.position.x =
            x;

        beam.castShadow =
            true;

        mine.add(
            beam
        );

    }


    for (
        let x = -34;
        x <= 42;
        x += 8
    ) {

        createSupport(x);

    }


    /* =====================================================
       RAILS
       ===================================================== */

    for (
        const z of [-1.25, 1.25]
    ) {

        const rail =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    82,
                    0.13,
                    0.13
                ),
                metalMaterial
            );


        rail.position.set(
            0,
            0.08,
            z
        );


        mine.add(
            rail
        );

    }


    /* =====================================================
       SLEEPERS
       ===================================================== */

    for (
        let x = -36;
        x <= 44;
        x += 2.2
    ) {

        const sleeper =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.42,
                    0.12,
                    3.25
                ),
                darkMetalMaterial
            );


        sleeper.position.set(
            x,
            0.02,
            0
        );


        mine.add(
            sleeper
        );

    }


    /* =====================================================
       MINE LAMPS
       ===================================================== */

    function createLamp(x) {

        const housing =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.58,
                    0.18,
                    0.58
                ),
                darkMetalMaterial
            );


        housing.position.set(
            x,
            5.85,
            0
        );


        mine.add(
            housing
        );


        const bulb =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.13,
                    12,
                    12
                ),
                new THREE.MeshBasicMaterial({
                    color: 0xffb25a
                })
            );


        bulb.position.set(
            x,
            5.52,
            0
        );


        mine.add(
            bulb
        );


        const light =
            new THREE.PointLight(
                0xffaf5c,
                1.35,
                11
            );


        light.position.set(
            x,
            5.2,
            0
        );


        mine.add(
            light
        );

    }


    for (
        let x = -28;
        x <= 42;
        x += 8
    ) {

        createLamp(x);

    }


    /* =====================================================
       RUBBLE
       ===================================================== */

    function createRubbleZone(
        start,
        end,
        height,
        count
    ) {

        const group =
            new THREE.Group();

        mine.add(
            group
        );


        for (
            let i = 0;
            i < count;
            i++
        ) {

            const x =
                start +
                Math.random() *
                    (
                        end -
                        start
                    );


            const z =
                -2.7 +
                Math.random() *
                    5.4;


            const rock =
                new THREE.Mesh(
                    new THREE.DodecahedronGeometry(
                        0.45 +
                            Math.random() *
                            0.78,
                        1
                    ),
                    rockMaterials[
                        Math.floor(
                            Math.random() *
                            rockMaterials.length
                        )
                    ]
                );


            rock.position.set(
                x,
                0.3 +
                    Math.random() *
                    height,
                z
            );


            rock.rotation.set(
                Math.random() * 2.5,
                Math.random() * 2.5,
                Math.random() * 2.5
            );


            rock.scale.set(
                1,
                0.7 +
                    Math.random(),
                0.8 +
                    Math.random()
            );


            rock.castShadow = true;
            rock.receiveShadow = true;


            group.add(
                rock
            );

        }

    }


    createRubbleZone(
        -18,
        -13,
        0.8,
        16
    );


    createRubbleZone(
        -8,
        -3,
        1.1,
        20
    );


    createRubbleZone(
        7,
        12,
        0.9,
        18
    );


    createRubbleZone(
        22,
        31,
        2.2,
        44
    );


    /* =====================================================
       WARNING LIGHTS
       ===================================================== */

    function addWarningLamp(
        x,
        z
    ) {

        const light =
            new THREE.PointLight(
                0xff2525,
                1.8,
                7
            );


        light.position.set(
            x,
            2.2,
            z
        );


        mine.add(
            light
        );


        const bulb =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.12,
                    10,
                    10
                ),
                new THREE.MeshBasicMaterial({
                    color: 0xff2525
                })
            );


        bulb.position.copy(
            light.position
        );


        mine.add(
            bulb
        );

    }


    addWarningLamp(
        20,
        -4.7
    );


    addWarningLamp(
        31,
        4.7
    );


    /* =====================================================
       OBSTACLE ROCK
       ===================================================== */

    const obstacle =
        new THREE.Mesh(
            new THREE.DodecahedronGeometry(
                1.55,
                1
            ),
            new THREE.MeshStandardMaterial({
                color: 0x712626,
                roughness: 0.95,
                emissive: 0x210000,
                emissiveIntensity: 0.55
            })
        );


    obstacle.position.set(
        OBSTACLE_X,
        1.05,
        0
    );


    obstacle.scale.set(
        1.2,
        0.95,
        1.15
    );


    obstacle.castShadow =
        true;


    scene.add(
        obstacle
    );


    /* =====================================================
       ROVER
       ===================================================== */

    const rover =
        new THREE.Group();


    rover.position.set(
        START_X,
        0,
        0
    );


    scene.add(
        rover
    );


    /* =====================================================
       ROVER MATERIALS
       ===================================================== */

    const roverBodyMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x37434e,
            metalness: 0.62,
            roughness: 0.4
        });


    const roverYellowMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xc28a20,
            metalness: 0.2,
            roughness: 0.55
        });


    const roverGlassMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x168dbd,
            metalness: 0.55,
            roughness: 0.2,
            emissive: 0x063747,
            emissiveIntensity: 1.2
        });


    /* =====================================================
       ROVER BODY
       ===================================================== */

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                3.6,
                1.15,
                2.35
            ),
            roverBodyMaterial
        );


    body.position.y =
        1.42;


    body.castShadow =
        true;


    rover.add(
        body
    );


    const frontArmor =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.5,
                1.25,
                2.45
            ),
            roverYellowMaterial
        );


    frontArmor.position.set(
        1.7,
        1.43,
        0
    );


    frontArmor.castShadow =
        true;


    rover.add(
        frontArmor
    );


    /* =====================================================
       TRACKS
       ===================================================== */

    function createTrack(z) {

        const track =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    4.15,
                    1.25,
                    0.68
                ),
                darkMetalMaterial
            );


        track.position.set(
            0,
            0.68,
            z
        );


        track.castShadow =
            true;


        rover.add(
            track
        );


        for (
            let x = -1.45;
            x <= 1.45;
            x += 0.72
        ) {

            const wheel =
                new THREE.Mesh(
                    new THREE.CylinderGeometry(
                        0.39,
                        0.39,
                        0.45,
                        18
                    ),
                    metalMaterial
                );


            wheel.rotation.z =
                Math.PI / 2;


            wheel.position.set(
                x,
                0.68,
                z
            );


            wheel.castShadow =
                true;


            rover.add(
                wheel
            );

        }

    }


    createTrack(
        -1.38
    );

    createTrack(
        1.38
    );


    /* =====================================================
       TOP PLATFORM
       ===================================================== */

    const platform =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.3,
                0.42,
                1.65
            ),
            darkMetalMaterial
        );


    platform.position.y =
        2.18;


    platform.castShadow =
        true;


    rover.add(
        platform
    );


    /* =====================================================
       SENSOR MAST
       ===================================================== */

    const mast =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.08,
                0.08,
                1.25,
                12
            ),
            metalMaterial
        );


    mast.position.y =
        2.95;


    rover.add(
        mast
    );


    const sensorHead =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.05,
                0.42,
                0.78
            ),
            darkMetalMaterial
        );


    sensorHead.position.y =
        3.58;


    rover.add(
        sensorHead
    );


    /* =====================================================
       NORMAL CAMERA LENS
       ===================================================== */

    const normalLens =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.15,
                0.15,
                0.13,
                18
            ),
            roverGlassMaterial
        );


    normalLens.rotation.x =
        Math.PI / 2;


    normalLens.position.set(
        0,
        3.58,
        0.43
    );


    rover.add(
        normalLens
    );


    /* =====================================================
       THERMAL CAMERA LENS
       ===================================================== */

    const thermalLens =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.15,
                0.15,
                0.13,
                18
            ),
            new THREE.MeshStandardMaterial({
                color: 0xb34c31,
                emissive: 0x5b1900,
                emissiveIntensity: 1.8,
                metalness: 0.25,
                roughness: 0.25
            })
        );


    thermalLens.rotation.x =
        Math.PI / 2;


    thermalLens.position.set(
        0.3,
        3.58,
        0.43
    );


    rover.add(
        thermalLens
    );


    /* =====================================================
       ANTENNA
       ===================================================== */

    const antenna =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.035,
                0.035,
                1,
                10
            ),
            metalMaterial
        );


    antenna.position.set(
        -0.62,
        3.2,
        -0.5
    );


    rover.add(
        antenna
    );


    const antennaTip =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.08,
                10,
                10
            ),
            new THREE.MeshBasicMaterial({
                color: 0x49bfff
            })
        );


    antennaTip.position.set(
        -0.62,
        3.72,
        -0.5
    );


    rover.add(
        antennaTip
    );


    /* =====================================================
       HEADLIGHTS
       ===================================================== */

    function createHeadlight(z) {

        const bulb =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.13,
                    12,
                    12
                ),
                new THREE.MeshStandardMaterial({
                    color: 0xf4fbff,
                    emissive: 0xbbeaff,
                    emissiveIntensity: 4
                })
            );


        bulb.position.set(
            1.92,
            1.62,
            z
        );


        rover.add(
            bulb
        );


        const light =
            new THREE.SpotLight(
                0xe6f8ff,
                7,
                25,
                Math.PI / 8,
                0.4,
                1
            );


        light.position.set(
            1.92,
            1.62,
            z
        );


        const target =
            new THREE.Object3D();


        target.position.set(
            13,
            0.8,
            z
        );


        rover.add(
            target
        );


        light.target =
            target;


        rover.add(
            light
        );

    }


    createHeadlight(
        -0.65
    );

    createHeadlight(
        0.65
    );


    /* =====================================================
       BEACON
       ===================================================== */

    const beacon =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.12,
                12,
                12
            ),
            new THREE.MeshBasicMaterial({
                color: 0xff2828
            })
        );


    beacon.position.set(
        0,
        2.75,
        0
    );


    rover.add(
        beacon
    );


    /* =====================================================
       THERMAL RESCUE TARGET
       ===================================================== */

    const thermalTarget =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.7,
                20,
                20
            ),
            new THREE.MeshBasicMaterial({
                color: 0xff2658,
                transparent: true,
                opacity: 0
            })
        );


    thermalTarget.position.copy(
        rescueTargetPosition
    );


    scene.add(
        thermalTarget
    );


    const thermalGlow =
        new THREE.PointLight(
            0xff3158,
            0,
            7
        );


    thermalGlow.position.copy(
        rescueTargetPosition
    );


    scene.add(
        thermalGlow
    );


    const thermalRing =
        new THREE.Mesh(
            new THREE.TorusGeometry(
                0.95,
                0.07,
                12,
                32
            ),
            new THREE.MeshBasicMaterial({
                color: 0xff365b,
                transparent: true,
                opacity: 0
            })
        );


    thermalRing.rotation.x =
        Math.PI / 2;


    thermalRing.position.copy(
        rescueTargetPosition
    );


    scene.add(
        thermalRing
    );


    /* =====================================================
       DUST
       ===================================================== */

    const dustGeometry =
        new THREE.BufferGeometry();


    const dustPositions = [];


    for (
        let i = 0;
        i < 300;
        i++
    ) {

        dustPositions.push(

            -35 +
                Math.random() *
                    82,

            0.8 +
                Math.random() *
                    4.8,

            -5.2 +
                Math.random() *
                    10.4

        );

    }


    dustGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(
            dustPositions,
            3
        )
    );


    const dustMaterial =
        new THREE.PointsMaterial({
            color: 0x8f9395,
            size: 0.045,
            transparent: true,
            opacity: 0.18,
            depthWrite: false
        });


    const dust =
        new THREE.Points(
            dustGeometry,
            dustMaterial
        );


    scene.add(
        dust
    );


    /* =====================================================
       ACTIVITY LOG
       ===================================================== */

    function addLog(text) {

        if (!logEl) {
            return;
        }


        const row =
            document.createElement(
                'div'
            );


        row.className =
            'rover-log-entry';


        row.innerHTML =
            `<strong>${new Date().toLocaleTimeString()}</strong> — ${text}`;


        logEl.prepend(
            row
        );


        while (
            logEl.children.length > 10
        ) {

            logEl.removeChild(
                logEl.lastElementChild
            );

        }

    }


    /* =====================================================
       SENSOR UPDATE
       ===================================================== */

    function updateSensors() {

        const progress =
            clamp(
                (
                    rover.position.x -
                    START_X
                ) /
                (
                    END_X -
                    START_X
                ),
                0,
                1
            );


        let co =
            10 +
            progress * 10;


        let temperature =
            26 +
            progress * 4;


        let humidity =
            54 +
            progress * 5;


        let smoke =
            2 +
            progress * 7;


        let airflow =
            2.9 -
            progress * 0.55;


        /* BIG COLLAPSE ZONE */

        if (
            rover.position.x >= 22
        ) {

            const hazardProgress =
                clamp(
                    (
                        rover.position.x -
                        22
                    ) / 16,
                    0,
                    1
                );


            co =
                22 +
                hazardProgress * 24;


            temperature =
                30 +
                hazardProgress * 8;


            humidity =
                59 +
                hazardProgress * 7;


            smoke =
                8 +
                hazardProgress * 18;


            airflow =
                2.2 -
                hazardProgress * 1.05;

        }


        sensors.co =
            Math.round(
                clamp(
                    co +
                    (
                        Math.random() -
                        0.5
                    ) * 1.4,
                    0,
                    100
                )
            );


        sensors.temperature =
            Math.round(
                clamp(
                    temperature +
                    (
                        Math.random() -
                        0.5
                    ) * 0.6,
                    0,
                    100
                )
            );


        sensors.humidity =
            Math.round(
                clamp(
                    humidity +
                    (
                        Math.random() -
                        0.5
                    ) * 1.5,
                    0,
                    100
                )
            );


        sensors.smoke =
            Math.round(
                clamp(
                    smoke +
                    (
                        Math.random() -
                        0.5
                    ) * 1.1,
                    0,
                    100
                )
            );


        sensors.airflow =
            Number(
                clamp(
                    airflow +
                    (
                        Math.random() -
                        0.5
                    ) * 0.08,
                    0.5,
                    5
                ).toFixed(1)
            );


        renderSensors();

    }


    function renderSensors() {

        if (coEl) {
            coEl.textContent =
                `${sensors.co} ppm`;
        }


        if (tempEl) {
            tempEl.textContent =
                `${sensors.temperature} °C`;
        }


        if (humidityEl) {
            humidityEl.textContent =
                `${sensors.humidity} %`;
        }


        if (smokeEl) {
            smokeEl.textContent =
                `${sensors.smoke} %`;
        }


        if (airflowEl) {
            airflowEl.textContent =
                `${sensors.airflow} m/s`;
        }

    }


    /* =====================================================
       AI ANOMALY
       ===================================================== */

    function calculateAnomaly() {

        let score = 0;


        if (
            sensors.co > 40
        ) {
            score += 30;
        } else if (
            sensors.co > 30
        ) {
            score += 15;
        }


        if (
            sensors.temperature > 33
        ) {
            score += 25;
        } else if (
            sensors.temperature > 30
        ) {
            score += 12;
        }


        if (
            sensors.smoke > 20
        ) {
            score += 25;
        } else if (
            sensors.smoke > 10
        ) {
            score += 12;
        }


        if (
            sensors.airflow < 1.5
        ) {
            score += 25;
        } else if (
            sensors.airflow < 2
        ) {
            score += 12;
        }


        return clamp(
            score,
            0,
            100
        );

    }


    function updateAIBox() {

        let aiBox =
            $('rover-ai-box');


        if (!aiBox) {

            aiBox =
                document.createElement(
                    'div'
                );


            aiBox.id =
                'rover-ai-box';


            aiBox.style.cssText = `
                margin-top:10px;
                padding:11px;
                border:1px solid #243341;
                border-radius:9px;
                background:#091119;
                font-size:10px;
            `;


            const side =
                document.querySelector(
                    '.rover-side'
                );


            if (side) {
                side.appendChild(
                    aiBox
                );
            }

        }


        const score =
            calculateAnomaly();


        let status =
            'NORMAL';


        let textColor =
            'var(--green)';


        let message =
            'Environmental conditions remain within simulated baseline.';


        if (
            score >= 70
        ) {

            status =
                'HIGH ANOMALY';

            textColor =
                'var(--red)';

            message =
                'Multiple hazardous environmental indicators detected.';

        } else if (
            score >= 35
        ) {

            status =
                'ANOMALY';

            textColor =
                'var(--yellow)';

            message =
                'Environmental conditions are deviating from baseline.';

        }


        aiBox.innerHTML = `

            <div style="
                color:#60eaa9;
                font-weight:900;
                letter-spacing:.7px;
                font-size:9px;
            ">
                🤖 AI ANOMALY ANALYSIS
            </div>

            <div style="
                margin-top:5px;
                color:${textColor};
                font-weight:900;
            ">
                ${status}
            </div>

            <div style="
                margin-top:3px;
                color:#aeb9c2;
            ">
                Anomaly Score: ${score}%
            </div>

            <div style="
                margin-top:4px;
                color:#c5ced6;
                line-height:1.45;
            ">
                ${message}
            </div>

        `;

    }


    /* =====================================================
       UI UPDATE
       ===================================================== */

    function updateUI() {

        const distance =
            Math.max(
                0,
                Math.round(
                    rover.position.x -
                    START_X
                )
            );


        if (positionEl) {

            positionEl.textContent =
                `${distance} m`;

        }


        if (batteryEl) {

            batteryEl.textContent =
                `${Math.round(state.battery)} %`;

        }


        if (lastUpdateEl) {

            lastUpdateEl.textContent =
                new Date().toLocaleTimeString();

        }


        let currentState =
            'IDLE';


        if (
            state.missionComplete
        ) {

            currentState =
                'MISSION COMPLETE';

        } else if (
            state.moving
        ) {

            if (
                state.paused
            ) {

                currentState =
                    'PAUSED';

            } else if (
                state.returning
            ) {

                currentState =
                    'RETURNING';

            } else if (
                state.climbing
            ) {

                currentState =
                    'CLIMBING';

            } else if (
                state.avoiding
            ) {

                currentState =
                    'AVOIDING';

            } else {

                currentState =
                    'AUTONOMOUS';

            }

        }


        if (statusBadge) {

            statusBadge.textContent =
                currentState;

        }


        if (bottomStateEl) {

            bottomStateEl.textContent =
                currentState;

        }


        if (missionEl) {

            missionEl.textContent =
                state.missionComplete
                    ? 'MISSION COMPLETE'
                    : state.missionStarted
                        ? 'POST-COLLAPSE INSPECTION'
                        : 'STANDBY';

        }


        if (movementEl) {

            movementEl.textContent =
                state.paused
                    ? 'PAUSED'
                    : state.climbing
                        ? 'CLIMBING RUBBLE'
                        : state.avoiding
                            ? 'CHANGING PATH'
                            : state.returning
                                ? 'RETURNING'
                                : state.moving
                                    ? 'FORWARD'
                                    : 'STOPPED';

        }


        if (obstacleEl) {

            obstacleEl.textContent =
                state.obstacle
                    ? (
                        state.climbing
                            ? 'RUBBLE'
                            : 'DETECTED'
                    )
                    : 'CLEAR';

        }


        if (autonomyEl) {

            autonomyEl.textContent =
                state.moving &&
                !state.paused
                    ? 'ACTIVE'
                    : 'READY';

        }


        if (targetEl) {

            targetEl.textContent =
                state.returning
                    ? 'BASE'
                    : state.missionStarted
                        ? 'COLLAPSE ZONE'
                        : 'NONE';

        }

    }


    /* =====================================================
       THERMAL OVERLAY
       ===================================================== */

    let thermalOverlay =
        $('rover-thermal-overlay');


    if (!thermalOverlay) {

        thermalOverlay =
            document.createElement(
                'div'
            );


        thermalOverlay.id =
            'rover-thermal-overlay';


        thermalOverlay.style.cssText = `
            position:absolute;
            inset:0;
            pointer-events:none;
            z-index:8;
            opacity:0;
            transition:opacity .3s;
            background:
                linear-gradient(
                    120deg,
                    rgba(35,0,90,.45),
                    rgba(105,0,170,.28),
                    rgba(255,70,55,.16)
                );
            mix-blend-mode:screen;
        `;


        host.appendChild(
            thermalOverlay
        );

    }


    /* =====================================================
       THERMAL MODE
       ===================================================== */

    function setThermalMode(
        enabled
    ) {

        state.thermal =
            Boolean(enabled);


        normalButton?.classList.toggle(
            'active',
            !state.thermal
        );


        thermalButton?.classList.toggle(
            'thermal-active',
            state.thermal
        );


        if (
            state.thermal
        ) {

            scene.background.setHex(
                0x16002b
            );


            scene.fog.color.setHex(
                0x24003d
            );


            ambient.color.setHex(
    0xaab6c2
);


            thermalOverlay.style.opacity =
                '1';


            thermalTarget.material.opacity =
                0.96;


            thermalRing.material.opacity =
                0.9;


            thermalGlow.intensity =
                4;


            addLog(
                'THERMAL CAMERA: ACTIVE'
            );


            addLog(
                'Scanning for human heat signatures...'
            );

        } else {

            scene.background.setHex(
                0x050608
            );


            scene.fog.color.setHex(
                0x050608
            );


            ambient.color.setHex(
                0x9aa8b5
            );


            thermalOverlay.style.opacity =
                '0';


            thermalTarget.material.opacity =
                0;


            thermalRing.material.opacity =
                0;


            thermalGlow.intensity =
                0;

        }

    }


    /* =====================================================
       THERMAL DETECTION
       ===================================================== */

    function checkThermalDetection() {

        if (
            !state.thermal ||
            state.personDetected
        ) {
            return;
        }


        const distance =
            rover.position.distanceTo(
                thermalTarget.position
            );


        if (
            distance < 6
        ) {

            state.personDetected =
                true;


            addLog(
                '🔥 THERMAL SIGNATURE DETECTED.'
            );


            addLog(
                'PERSON DETECTED UNDER COLLAPSE RUBBLE.'
            );


            addLog(
                '🚨 RESCUE ALERT SENT TO CONTROL ROOM.'
            );


            showRescueAlert();

        }

    }


    /* =====================================================
       RESCUE ALERT
       ===================================================== */

    function showRescueAlert() {

        let alert =
            $('rover-rescue-alert');


        if (!alert) {

            alert =
                document.createElement(
                    'div'
                );


            alert.id =
                'rover-rescue-alert';


            alert.style.cssText = `
                position:absolute;
                top:55px;
                left:50%;
                transform:
                    translateX(-50%)
                    translateY(-10px);
                width:min(350px,82%);
                padding:14px 16px;
                border:1px solid rgba(255,70,70,.65);
                border-radius:11px;
                background:rgba(29,5,11,.96);
                box-shadow:
                    0 0 30px
                    rgba(255,70,70,.25);
                z-index:20;
                opacity:0;
                transition:.3s;
                pointer-events:none;
            `;


            host.appendChild(
                alert
            );

        }


        alert.innerHTML = `

            <div style="
                color:var(--red);
                font-size:11px;
                font-weight:900;
                letter-spacing:.6px;
            ">
                🚨 RESCUE ALERT
            </div>

            <div style="
                margin-top:5px;
                font-size:17px;
                font-weight:900;
            ">
                PERSON DETECTED
            </div>

            <div style="
                margin-top:6px;
                color:#c6d0d8;
                font-size:10px;
                line-height:1.6;
            ">
                Detection: Thermal Camera<br>
                Location: Post-Collapse Zone<br>
                Confidence: 94%
            </div>

            <div style="
                margin-top:7px;
                color:#ff9b9b;
                font-size:9px;
                font-weight:900;
            ">
                CONTROL ROOM NOTIFIED
            </div>

        `;


        requestAnimationFrame(
            () => {

                alert.style.opacity =
                    '1';


                alert.style.transform =
                    'translateX(-50%) translateY(0)';

            }
        );

    }


    /* =====================================================
       CAMERA LABEL
       ===================================================== */

    function updateCameraLabel() {

        if (!cameraButton) {
            return;
        }


        if (
            state.cameraMode ===
            'FOLLOW'
        ) {

            cameraButton.textContent =
                '🎥 FOLLOW VIEW';

        } else if (
            state.cameraMode ===
            'FPV'
        ) {

            cameraButton.textContent =
                '🎥 FPV VIEW';

        } else {

            cameraButton.textContent =
                '🎥 FREE VIEW';

        }

    }


    /* =====================================================
       CAMERA MODE
       ===================================================== */

    function cycleCamera() {

        if (
            state.cameraMode ===
            'FOLLOW'
        ) {

            state.cameraMode =
                'FPV';

        } else if (
            state.cameraMode ===
            'FPV'
        ) {

            state.cameraMode =
                'FREE';

        } else {

            state.cameraMode =
                'FOLLOW';

        }


        updateCameraLabel();


        addLog(
            `Camera mode: ${state.cameraMode}.`
        );

    }


    cameraButton?.addEventListener(
        'click',
        cycleCamera
    );


    updateCameraLabel();


    /* =====================================================
       MOUSE CAMERA CONTROL
       ===================================================== */

    renderer.domElement.addEventListener(
        'pointerdown',
        (event) => {

            if (
                state.cameraMode ===
                'FPV'
            ) {
                return;
            }


            state.pointerDown =
                true;


            state.lastPointerX =
                event.clientX;


            state.lastPointerY =
                event.clientY;


            renderer.domElement.style.cursor =
                'grabbing';


            renderer.domElement.setPointerCapture?.(
                event.pointerId
            );

        }
    );


    renderer.domElement.addEventListener(
        'pointermove',
        (event) => {

            if (
                !state.pointerDown ||
                state.cameraMode ===
                'FPV'
            ) {
                return;
            }


            const dx =
                event.clientX -
                state.lastPointerX;


            const dy =
                event.clientY -
                state.lastPointerY;


            state.yaw -=
                dx * 0.008;


            state.pitch =
                clamp(
                    state.pitch -
                        dy * 0.006,
                    0.10,
                    0.88
                );


            state.lastPointerX =
                event.clientX;


            state.lastPointerY =
                event.clientY;

        }
    );


    function stopPointer(event) {

        state.pointerDown =
            false;


        renderer.domElement.style.cursor =
            'grab';


        try {

            renderer.domElement.releasePointerCapture?.(
                event.pointerId
            );

        } catch (_) {}

    }


    renderer.domElement.addEventListener(
        'pointerup',
        stopPointer
    );


    renderer.domElement.addEventListener(
        'pointercancel',
        stopPointer
    );


    /* =====================================================
       WHEEL ZOOM
       ===================================================== */

    renderer.domElement.addEventListener(
        'wheel',
        (event) => {

            event.preventDefault();


            state.cameraDistance =
                clamp(
                    state.cameraDistance +
                        event.deltaY * 0.02,
                    7,
                    28
                );

        },
        {
            passive: false
        }
    );


    /* =====================================================
       ZOOM BUTTONS
       ===================================================== */

    zoomInButton?.addEventListener(
        'click',
        () => {

            state.cameraDistance =
                clamp(
                    state.cameraDistance - 2,
                    7,
                    28
                );

        }
    );


    zoomOutButton?.addEventListener(
        'click',
        () => {

            state.cameraDistance =
                clamp(
                    state.cameraDistance + 2,
                    7,
                    28
                );

        }
    );


    /* =====================================================
       DEPLOY
       ===================================================== */

    function deploy() {

        rover.position.set(
            START_X,
            0,
            0
        );


        rover.rotation.set(
            0,
            0,
            0
        );


        state.moving =
            true;

        state.paused =
            false;

        state.returning =
            false;

        state.missionStarted =
            true;

        state.missionComplete =
            false;

        state.obstacle =
            false;

        state.avoiding =
            false;

        state.climbing =
            false;

        state.battery =
            100;

        state.personDetected =
            false;


        const alert =
            $('rover-rescue-alert');


        if (alert) {

            alert.style.opacity =
                '0';

        }


        addLog(
            'Rover deployed — autonomous mission started.'
        );


        addLog(
            'Mission: Post-collapse inspection.'
        );


        updateSensors();
        updateAIBox();
        updateUI();
        sendTelemetry();

    }


    /* =====================================================
       PAUSE
       ===================================================== */

    function togglePause() {

        if (
            !state.moving
        ) {
            return;
        }


        state.paused =
            !state.paused;


        addLog(
            state.paused
                ? 'Mission paused by operator.'
                : 'Mission resumed — autonomous navigation active.'
        );


        updateUI();

    }


    /* =====================================================
       RETURN TO BASE
       ===================================================== */

    function returnToBase() {

        if (
            rover.position.x <=
            START_X + 0.2
        ) {
            return;
        }


        state.returning =
            true;

        state.moving =
            true;

        state.paused =
            false;

        state.avoiding =
            false;


        addLog(
            'Return-to-base command received.'
        );


        updateUI();

    }


    /* =====================================================
       FIND RUBBLE
       ===================================================== */

    function getRubbleZone() {

        return rubbleZones.find(
            (zone) =>
                rover.position.x >=
                    zone.start &&
                rover.position.x <=
                    zone.end
        ) || null;

    }


    /* =====================================================
       ROVER MOVEMENT
       ===================================================== */

    function moveRover(delta) {

        if (
            !state.moving ||
            state.paused
        ) {
            return;
        }


        /* ================================================
           RETURNING
           ================================================ */

        if (
            state.returning
        ) {

            const zone =
                getRubbleZone();


            if (zone) {

                state.climbing =
                    true;

                state.obstacle =
                    true;


                const progress =
                    clamp(
                        (
                            rover.position.x -
                            zone.start
                        ) /
                        (
                            zone.end -
                            zone.start
                        ),
                        0,
                        1
                    );


                rover.position.y =
                    Math.sin(
                        progress *
                            Math.PI
                    ) *
                    zone.height;


                rover.position.x -=
                    SPEED *
                    delta;


                rover.rotation.y =
                    Math.PI;


                rover.rotation.z =
                    Math.cos(
                        progress *
                            Math.PI
                    ) *
                    0.16;


                if (
                    rover.position.x <
                    zone.start
                ) {

                    rover.position.y =
                        0;

                    rover.rotation.z =
                        0;

                    state.climbing =
                        false;

                    state.obstacle =
                        false;

                }

            } else {

                rover.position.x -=
                    SPEED *
                    delta;


                rover.position.y +=
                    (
                        0 -
                        rover.position.y
                    ) *
                    Math.min(
                        delta * 5,
                        1
                    );


                rover.rotation.y =
                    Math.PI;

                rover.rotation.z =
                    0;

            }


            if (
                rover.position.x <=
                START_X
            ) {

                rover.position.set(
                    START_X,
                    0,
                    0
                );


                rover.rotation.set(
                    0,
                    0,
                    0
                );


                state.moving =
                    false;

                state.returning =
                    false;

                state.missionStarted =
                    false;

                state.missionComplete =
                    true;

                state.climbing =
                    false;

                state.obstacle =
                    false;


                addLog(
                    'Rover reached base successfully.'
                );


                addLog(
                    'Mission cycle complete.'
                );


                updateUI();

            }


            state.battery =
                Math.max(
                    0,
                    state.battery -
                        delta *
                        0.08
                );


            return;

        }


        /* ================================================
           NORMAL FORWARD MODE
           ================================================ */

        const rubble =
            getRubbleZone();


        const obstacleDistance =
            Math.abs(
                rover.position.x -
                OBSTACLE_X
            );


        /* OBSTACLE DETECTION */

        if (
            !state.avoiding &&
            !rubble &&
            obstacleDistance <
                2.5
        ) {

            state.avoiding =
                true;

            state.obstacle =
                true;


            addLog(
                'Rock obstacle detected — alternate path engaged.'
            );

        }


        /* ================================================
           OBSTACLE AVOIDANCE
           ================================================ */

        if (
            state.avoiding
        ) {

            rover.position.z +=
                (
                    AVOID_Z -
                    rover.position.z
                ) *
                Math.min(
                    delta * 3,
                    1
                );


            rover.position.x +=
                SPEED *
                delta;


            rover.rotation.z =
                Math.sin(
                    performance.now() *
                        0.002
                ) *
                0.035;


            if (
                rover.position.x >
                OBSTACLE_X + 3
            ) {

                state.avoiding =
                    false;

                state.obstacle =
                    false;


                rover.position.z =
                    0;

                rover.rotation.z =
                    0;


                addLog(
                    'Rock obstacle cleared — main route restored.'
                );

            }

        }


        /* ================================================
           RUBBLE CLIMBING
           ================================================ */

        else if (
            rubble
        ) {

            if (
                !state.climbing
            ) {

                state.climbing =
                    true;

                state.obstacle =
                    true;


                addLog(
                    rubble.height > 1.8
                        ? 'Major collapse detected — tracked rover climbing rubble.'
                        : 'Loose rubble detected — tracked rover climbing.'
                );

            }


            const progress =
                clamp(
                    (
                        rover.position.x -
                        rubble.start
                    ) /
                    (
                        rubble.end -
                        rubble.start
                    ),
                    0,
                    1
                );


            rover.position.y =
                Math.sin(
                    progress *
                        Math.PI
                ) *
                rubble.height;


            rover.position.x +=
                SPEED *
                delta;


            rover.rotation.z =
                -Math.cos(
                    progress *
                        Math.PI
                ) *
                0.17;


            if (
                rover.position.x >
                rubble.end
            ) {

                rover.position.y =
                    0;

                rover.rotation.z =
                    0;

                state.climbing =
                    false;

                state.obstacle =
                    false;


                addLog(
                    'Rubble traversed — continuing inspection.'
                );

            }

        }


        /* ================================================
           NORMAL MOVEMENT
           ================================================ */

        else {

            rover.position.x +=
                SPEED *
                delta;


            rover.position.y +=
                (
                    0 -
                    rover.position.y
                ) *
                Math.min(
                    delta * 5,
                    1
                );


            rover.position.z +=
                (
                    0 -
                    rover.position.z
                ) *
                Math.min(
                    delta * 3,
                    1
                );


            rover.rotation.z =
                0;

            rover.rotation.y =
                0;

        }


        /* ================================================
           END OF MISSION
           ================================================ */

        if (
            rover.position.x >=
            END_X
        ) {

            rover.position.x =
                END_X;


            state.moving =
                false;

            state.obstacle =
                true;


            addLog(
                'Inspection zone reached.'
            );


            addLog(
                'Thermal/environmental scan active.'
            );


            updateUI();

        }


        state.battery =
            Math.max(
                0,
                state.battery -
                    delta *
                    0.17
            );

    }


    /* =====================================================
       FASTAPI TELEMETRY
       ===================================================== */

    async function sendTelemetry() {

        const position =
            Math.max(
                0,
                Math.round(
                    rover.position.x -
                    START_X
                )
            );


        let movement =
            'STOPPED';


        if (
            state.paused
        ) {

            movement =
                'PAUSED';

        } else if (
            state.climbing
        ) {

            movement =
                'CLIMBING';

        } else if (
            state.avoiding
        ) {

            movement =
                'CHANGING PATH';

        } else if (
            state.returning
        ) {

            movement =
                'RETURNING';

        } else if (
            state.moving
        ) {

            movement =
                'FORWARD';

        }


        const payload = {

            rover_id:
                'ROVER_01',

            mission:
                state.missionStarted
                    ? 'POST-COLLAPSE INSPECTION'
                    : 'STANDBY',

            position_m:
                position,

            movement:
                movement,

            obstacle:
                state.obstacle,

            autonomous:
                state.moving &&
                !state.paused,

            battery:
                Math.round(
                    state.battery
                ),

            co:
                sensors.co,

            temperature:
                sensors.temperature,

            humidity:
                sensors.humidity,

            smoke_density:
                sensors.smoke,

            air_flow:
                sensors.airflow,

            thermal_mode:
                state.thermal,

            person_detected:
                state.personDetected,

            ai_status:
                'ACTIVE',

            timestamp:
                new Date().toISOString()

        };


        try {

            const response =
                await fetch(
                    '/rover-data',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            if (
                !response.ok
            ) {

                throw new Error(
                    `HTTP ${response.status}`
                );

            }

        } catch (error) {

            console.warn(
                'Rover telemetry unavailable:',
                error.message
            );

        }

    }


    /* =====================================================
       CAMERA UPDATE
       ===================================================== */

    const lookTarget =
        new THREE.Vector3();


    function updateCamera(delta) {

        /* ================================================
           FOLLOW CAMERA
           ================================================ */

        if (
            state.cameraMode ===
            'FOLLOW'
        ) {

            /*
               IMPORTANT:
               Mouse orbit now actually affects FOLLOW mode.
               Camera is farther back and higher.
            */

            const horizontal =
                state.cameraDistance *
                Math.cos(
                    state.pitch
                );


            const desiredX =
                rover.position.x +
                Math.cos(
                    state.yaw
                ) *
                horizontal;


            const desiredZ =
                rover.position.z +
                Math.sin(
                    state.yaw
                ) *
                horizontal;


            const desiredY =
                rover.position.y +
                2.5 +
                state.cameraDistance *
                Math.sin(
                    state.pitch
                );


            camera.position.x +=
                (
                    desiredX -
                    camera.position.x
                ) *
                Math.min(
                    delta * 6,
                    1
                );


            camera.position.y +=
                (
                    desiredY -
                    camera.position.y
                ) *
                Math.min(
                    delta * 6,
                    1
                );


            camera.position.z +=
                (
                    desiredZ -
                    camera.position.z
                ) *
                Math.min(
                    delta * 6,
                    1
                );


            lookTarget.set(
                rover.position.x,
                rover.position.y + 1.2,
                rover.position.z
            );


            camera.lookAt(
                lookTarget
            );

        }


        /* ================================================
           FPV
           ================================================ */

        else if (
            state.cameraMode ===
            'FPV'
        ) {

            const fpv =
                new THREE.Vector3(
                    2.15,
                    2.8,
                    0
                );


            fpv.applyQuaternion(
                rover.quaternion
            );


            fpv.add(
                rover.position
            );


            camera.position.lerp(
                fpv,
                Math.min(
                    delta * 8,
                    1
                )
            );


            const fpvLook =
                new THREE.Vector3(
                    12,
                    2.1,
                    0
                );


            fpvLook.applyQuaternion(
                rover.quaternion
            );


            fpvLook.add(
                rover.position
            );


            camera.lookAt(
                fpvLook
            );

        }


        /* ================================================
           FREE CAMERA
           ================================================ */

        else {

            const horizontal =
                state.cameraDistance *
                Math.cos(
                    state.pitch
                );


            camera.position.x =
                rover.position.x +
                Math.cos(
                    state.yaw
                ) *
                horizontal;


            camera.position.z =
                rover.position.z +
                Math.sin(
                    state.yaw
                ) *
                horizontal;


            camera.position.y =
                rover.position.y +
                2 +
                state.cameraDistance *
                Math.sin(
                    state.pitch
                );


            lookTarget.set(
                rover.position.x,
                rover.position.y + 1.2,
                rover.position.z
            );


            camera.lookAt(
                lookTarget
            );

        }

    }


    /* =====================================================
       BUTTON EVENTS
       ===================================================== */

    deployButton?.addEventListener(
        'click',
        deploy
    );


    pauseButton?.addEventListener(
        'click',
        togglePause
    );


    returnButton?.addEventListener(
        'click',
        returnToBase
    );


    normalButton?.addEventListener(
        'click',
        () => {

            state.cameraMode =
                'FOLLOW';

            updateCameraLabel();

            setThermalMode(
                false
            );

            addLog(
                'Normal follow camera restored.'
            );

        }
    );


    thermalButton?.addEventListener(
        'click',
        () => {

            setThermalMode(
                !state.thermal
            );

        }
    );


    /* =====================================================
       RESIZE
       ===================================================== */

    function resize() {

        const width =
            Math.max(
                host.clientWidth,
                1
            );


        const height =
            Math.max(
                host.clientHeight,
                1
            );


        camera.aspect =
            width /
            height;


        camera.updateProjectionMatrix();


        renderer.setSize(
            width,
            height
        );

    }


    window.addEventListener(
        'resize',
        resize
    );


    /* =====================================================
       INITIAL STATE
       ===================================================== */

    updateSensors();

    updateAIBox();

    updateUI();

    setThermalMode(
        false
    );

    resize();


    /* =====================================================
       ANIMATION LOOP
       ===================================================== */

    const clock =
        new THREE.Clock();


    function animate() {

        requestAnimationFrame(
            animate
        );


        const delta =
            Math.min(
                clock.getDelta(),
                0.05
            );


        /* MOVEMENT */

        moveRover(
            delta
        );


        const now =
            performance.now();


        /* SENSOR UPDATE */

        if (
            now -
            state.lastSensor >=
            1000
        ) {

            state.lastSensor =
                now;


            updateSensors();

            updateAIBox();

            updateUI();

        }


        /* TELEMETRY */

        if (
            now -
            state.lastTelemetry >=
            1000
        ) {

            state.lastTelemetry =
                now;


            sendTelemetry();

        }


        /* THERMAL */

        checkThermalDetection();


        if (
            state.thermal
        ) {

            const pulse =
                0.86 +
                Math.sin(
                    now * 0.006
                ) *
                0.14;


            thermalTarget.scale.setScalar(
                pulse
            );


            thermalRing.rotation.z +=
                delta * 1.2;

        }


        /* DUST */

        dust.rotation.y +=
            delta *
            0.01;


        /* BEACON */

        const beaconOn =
            Math.sin(
                now * 0.008
            ) > 0;


        beacon.material.color.setHex(
            beaconOn
                ? 0xff2929
                : 0x401010
        );


        /* CAMERA */

        updateCamera(
            delta
        );


        /* RENDER */

        renderer.render(
            scene,
            camera
        );

    }


    /* =====================================================
       START
       ===================================================== */

    animate();


    console.log(
        '✅ Smart Mine autonomous rover loaded successfully.'
    );

}