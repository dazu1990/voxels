import React, {useEffect, useLayoutEffect, useRef, useState} from 'react'
import * as THREE from "three"
import {BufferGeometryUtils} from 'three/examples/jsm/utils/BufferGeometryUtils'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier'



import './style.sass';

const Voxels = () => {
    
    const mount = useRef<HTMLDivElement>(null)
    const [isAnimating, setAnimating] = useState(true)
    const animeControls = useRef({
        start: ()=>{return},
        stop: ()=>{return}
    })

    const getRandomInt = (min : number, max : number) => {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    // this grabs an array and accumulates the sum i.e. [[1,2,3],[1,2]] -> [[1,2,3],[4,5]]
    const accumulate = (arr :number[]) => arr.map(((sum:number) => (value :number) => sum += value)(0));



    useLayoutEffect(() => {
        let width = null !== mount.current ? mount.current.clientWidth : window.innerWidth
        let height = null !== mount.current ? mount.current.clientHeight : window.innerHeight
        let frameId :number = 0

        const scene: THREE.Scene = new THREE.Scene()
        const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

        const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({antialias: true})

        const controls = new OrbitControls(camera, renderer.domElement)

        
        // this defines size of grid so : (10 - 1) === a grid of 10 * 10 * 10 cubes. should eventually be (100 - 1). 
        const gridSize: number = (5 - 1);
        // total number of cubes. Eventually should === 1000000
        const totalCube: number = Math.pow((gridSize + 1), 3) 
        console.log('TOTAL CUBES', totalCube)

        // DEV TOOL : create random array of 24 colours
        let colorArray : number[] = []
        for (let index = 0; index < 24; index++) {
            colorArray.push(Math.random() * 0xffffff)
        }

        // scene.add(cube)
        renderer.setClearColor('#000000')
        renderer.setSize(width, height)


        // example user info
        interface userCubes {
            ids: number[],
            name: string,
            color: number,
            url: string
        }
        let userInfo : userCubes[] = []

        // this is a temporary function to generate random users
        const generateRandomUsers = ()=>{

            const divvy = (number : number, parts : number, min : number) => {
                // this function divvys the number into equal parts with a part having a minimal number

                const randombit : number = number - min * parts;
                const out = [];
                
                for (var i=0; i < parts; i++) {
                out.push(Math.random());
                }
                
                const mult : number = randombit / out.reduce(function (a,b) {return a+b;});
                
                return out.map(function (el) { return Math.round(el * mult + min); });
            }
            
            // how many users. this defines the parts
            const userCount : number = 3;
            // this the maxium number of user generated cubes within these groups
            const maxUserMadeCubes : number = getRandomInt(Math.round(totalCube*0.25) ,totalCube );
            console.log('maxUserMadeCubes = ', maxUserMadeCubes)
            // this creates an array of the divvied up parts i.e. [1,1,3]= total 5 cubes in 3 parts
            let arrayOfSplits : number[] = divvy(maxUserMadeCubes, userCount, 1);


            // this grabs an array and accumulates the sum i.e. [1,1,3] -> [1,2,5]
            const splitSums = accumulate(arrayOfSplits)

            // this grabs the arrays of splits and maps them into properties of user object arrays
            arrayOfSplits.forEach((split,i)=>{
                let prevSplit = 0;
                if(i > 0) prevSplit = splitSums[ i - 1 ] 
            
                let theIds : number[] = [];
                for (let j = 0; j < split; j++) {
                    theIds.push(j + prevSplit )
                }
        
                userInfo.push({
                    ids: theIds,
                    name: `randomUser_${i}`,
                    color: colorArray[Math.floor(Math.random()*colorArray.length)],
                    url: `www.google.com`
                })
                
            })
        }

        generateRandomUsers()

        const userIds : number[][] = userInfo.map(({ ids }) => ids)

        const createCubeArray = () => {
            let geometries = [];
            let matrix = new THREE.Matrix4();
            let position = new THREE.Vector3();
            let quaternion = new THREE.Quaternion();
            let scale = new THREE.Vector3();
        
            
        
        
            let finalgeometries : THREE.BufferGeometry;
        
        
        
        
            let positionArray : number[][] = []
        
            for ( let z = - (gridSize/2); z <= (gridSize/2); ++ z )
                            for ( let y = - (gridSize/2); y <= (gridSize/2); ++ y )
                                for ( let x = - (gridSize/2); x <= (gridSize/2); ++ x ) {
                                    positionArray.push([x,y,z])
                                }
        
            // console.log('userIds = ', userIds.flat(), ' positionArray = ', positionArray, positionArray.length, ' userCubeClusters = ', userCubeClusters , ' totalCube = ',totalCube)
            const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000, wireframe: true })
            for (let index = 0; index < totalCube; index++) {
                if( userIds.flat().includes(index) ){
        
                    // basic cube geometry
                    let cubeGeometry: THREE.BoxBufferGeometry = new THREE.BoxBufferGeometry( 1, 1, 1 )
                    let nonIndexCubeGeometry = cubeGeometry.toNonIndexed()
                    nonIndexCubeGeometry.translate(positionArray[index][0],positionArray[index][1],positionArray[index][2])
                    // cubeGeometry = cubeGeometry.toNonIndexed();
        
                    position.x = positionArray[index][0]
                    position.y = positionArray[index][1]
                    position.z = positionArray[index][2]
                    // console.log('postion', position)
        
                    matrix.compose( position, quaternion , scale )
                    cubeGeometry.applyMatrix4( matrix )
                    geometries.push( nonIndexCubeGeometry )
                }
            }

            finalgeometries = BufferGeometryUtils.mergeBufferGeometries( geometries );
            
            let finalCubes = new THREE.Mesh( finalgeometries, material )
            const modifier = new SimplifyModifier();
            const simplified = finalCubes.clone();
            simplified.material = simplified.material.clone();
            simplified.material = new THREE.MeshBasicMaterial({ color: 0xFF0000, wireframe: true })

            const count = Math.floor( simplified.geometry.attributes.position.count * 0.1 ); // number of vertices to remove
            simplified.geometry = modifier.modify( simplified.geometry, count );


            console.log('finalCubes', finalCubes)


            

        
            // scene.add( finalCubes)
            scene.add( simplified)

        }
        createCubeArray();

        camera.position.z = 15



        const renderScene = () => {
            renderer.render(scene, camera)
        }

        const handleResize = () => {
            width = null !== mount.current ? mount.current.clientWidth : window.innerWidth
            height = null !== mount.current ? mount.current.clientHeight : window.innerHeight
            renderer.setSize(width, height)
            camera.aspect = width / height
            camera.updateProjectionMatrix()
            renderScene()
        }
        
        const animate = () => {
            // cube.rotation.x += 0.01
            // cube.rotation.y += 0.01
            controls.update()

            renderScene()
            frameId = window.requestAnimationFrame(animate)
        }

        const start = () => {
            if (!frameId) {
                frameId = requestAnimationFrame(animate)
            }
        }

        const stop = () => {
            cancelAnimationFrame(frameId)
            frameId = 0
        }

        if(null !== mount.current){
            mount.current.appendChild(renderer.domElement)
        }
        
        window.addEventListener('resize', handleResize)
        start()
        if(null !== animeControls.current){
            animeControls.current = { start, stop }
        }
        
        
        return () => {
            stop()
            window.removeEventListener('resize', handleResize)
            if(null !== mount.current){
                mount.current.removeChild(renderer.domElement)
            }

            // scene.remove(cube)
            // geometry.dispose()
            // material.dispose()
        }
    }, [])

    useEffect(() => {
        if(null !== mount.current){
            if (isAnimating) {
                animeControls.current.start()
            } else {
                animeControls.current.stop()
            }
        }
        
    }, [isAnimating])

    return (<div className="voxels" ref={mount} onClick={() => {setAnimating(!isAnimating)} } />)
}
  
export default Voxels
