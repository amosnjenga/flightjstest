$('document').ready(function(){
	//Map Container
	var map;
	function setupMap(){
		mapboxgl.accessToken = 'pk.eyJ1IjoiYW1vc25qZW5nYSIsImEiOiJjbDlnbXI1MjgwaXUwM3FvOG9pcGRoMDZkIn0.2ZjwHR-LWwVod9zaeX1gcQ';
		map = new mapboxgl.Map({
			container: 'map',
			style:"mapbox://styles/amosnjenga/cl9qrumw6002114nu7a69dieq", 
			center:[25.369151201517298,47.86050101086971],
			zoom: 3,
			//pitch:40,
			maxZoom:6,
			projection: 'naturalEarth' // starting projection
			//minZoom:11
		});
		map.addControl(new mapboxgl.NavigationControl());
		// disable map rotation using right click + drag
		map.dragRotate.disable();
 
		// disable map rotation using touch rotation gesture
		map.touchZoomRotate.disableRotation();
	}
	setupMap();

	//Map Functions
	var markerRecord={};

	function addPointMarker(coords){
		let k = "marker_"
		let i = Object.keys(markerRecord). length;
		i+=1;
		markerRecord['marker_'+i+''] = new mapboxgl.Marker().setLngLat(coords).addTo(map);
		return markerRecord['marker_'+i+'']
		
	}

	function parseCoords(string){
		let splitVals = string.split(',');
		return [parseInt(splitVals[0]),parseInt(splitVals[1])]
	}

	function createBoundingBox(point1,point2){
		let bbx = turf.bbox(turf.featureCollection([turf.point(point1),
			 turf.point(point2)]));
			return [[bbx[0],bbx[1]],[bbx[2],bbx[3]]];
	}

	function generateArc(route,origin,destination,steps){
		//const distance = turf.distance(start, end, { units: 'miles' });
		const lineDistance = turf.length(route.features[0]);
		const midpoint = turf.midpoint(turf.point(origin),turf.point(destination));
		const bearing = turf.bearing(turf.point(origin),turf.point(destination));
		//const leftSideArc = bearing + 90 > 180 ? -180 + (bearing + 90 - 180) : bearing + 90;

		let leftSideArc;
		if (bearing >= 0) {
		 	leftSideArc = bearing + 90 > 180 ? bearing - 270 : bearing + 90;
		  } else {
		  	leftSideArc = bearing - 90 < -180 ? bearing + 270 : bearing - 90;
		 };


		const dest = turf.destination(midpoint, lineDistance /-20, leftSideArc);
		// curvedLine gets rendered to the page
		const arc = turf.bezierSpline(
		  turf.lineString([origin, dest.geometry.coordinates, destination]),
		);
		console.log(turf.length(arc),"arc length");
		return arc;
	}//generateArc

	function animate(map,counter,route,point,pointid,steps){
		running = true;
		console.log(running,"running inside");
		const start = route.features[0].geometry.coordinates[counter >= steps ? counter - 1: counter];
		const end = route.features[0].geometry.coordinates[counter >= steps ? counter : counter + 1];
		if (!start || !end) {
			running = false;
			return;
		}

		point.features[0].geometry.coordinates = route.features[0].geometry.coordinates[counter];
		point.features[0].properties.bearing=turf.bearing(turf.point(start),turf.point(end));
		map.getSource(pointid).setData(point);

		//Request the next frame of animationas long as the end has not been reached
		if(counter < steps){
			requestAnimationFrame(function(){
				animate(map,counter,route,point,pointid,steps);
			});
		}else{
			// let fps = 20;
			// setTimeout(()=>{
			// 	requestAnimationFrame(function(){
			// 		animate(map,counter,route,point,steps);
			// 	});
			// },500/fps);
		}

		counter += 1;
		
	}//animate
    
    function animateflightroute(map,origin,destination,steps){
    	//A simple line from origin to destination
		const route = {
			'type':'FeatureCollection',
			'features':[{
				'type':'Feature',
				'geometry':{
					'type':'LineString',
					'coordinates':[origin,destination]
				}
			}]
		};//route

		//A single point that animates along the route.
		//Coordinates are initially set to origin.
		const point = {
			'type':'FeatureCollection',
			'features':[{
				'type':'Feature',
				'properties':{},
				'geometry':{
					'type':'Point',
					'coordinates':origin
				}
			}]
		}//Point

		route.features[0].geometry.coordinates = generateArc(route,origin,destination,steps).geometry.coordinates;
		let counter = 0;

		//Add a source and layer displaying a point which will
		//be animated in a circle
		map.addSource('route',{
			'type':'geojson',
			'data':route
		});


		map.addLayer({
			'id':'route',
			'source':'route',
			'type':'line',
			'paint':{
				'line-width':2,
				'line-dasharray': [0, 2, 2],
				'line-color':'#007cbf'
			}
		});//addLayer

		map.addSource('point',{
			'type':'geojson',
			'data':point
		});

		map.addLayer({
			'id':'point',
			'source':'point',
			'type':'symbol',
			'layout':{
				'icon-image':'airplane',
				'icon-size':0.20,
				'icon-rotate':['get','bearing'],
				'icon-rotation-alignment':'map',
				'icon-allow-overlap':true,
				'icon-ignore-placement':true
			}
		});//addLayer

		//Start animation
		let running = false;
		animate(map,counter,route,point,'point',steps);

    }


	function animatecameraroute(map,origin,destination,steps){
		const route = {
					'type':'FeatureCollection',
					'features':[{
						'type':'Feature',
						'geometry':{
							'type':'LineString',
							'coordinates':[origin,destination]
						}
					}]
		};//route
		const point = {
					'type':'FeatureCollection',
					'features':[{
						'type':'Feature',
						'properties':{},
						'geometry':{
							'type':'Point',
							'coordinates':origin
						}
					}]
				}//Point

		//Calculate the distance in kilometers bwtween route start/end point.
		const lineDistance = turf.length(route.features[0]);
		console.log(lineDistance,"lineDistance");

		const arc = [];
		
		//Draw an arc btn the `origin` & `destination` of the two points
		for(let i = 0;i<lineDistance;i+=lineDistance/steps){
			const segment = turf.along(route.features[0],i);
			arc.push(segment.geometry.coordinates);
		}


		route.features[0].geometry.coordinates = arc;

        let counter = 0;

		map.addSource('cameraroute',{
					'type':'geojson',
					'data':route
				});

		map.addLayer({
			'id':'cameraroute',
			'source':'cameraroute',
			'type':'line',
			'paint':{
				'line-width':2,
				'line-dasharray': [0, 2, 2],
				'line-color':'grey'
			}
		});//addLayer

		map.addSource('camerapoint',{
			'type':'geojson',
			'data':point
		});

		map.addLayer({
			'id':'camerapoint',
			'source':'camerapoint',
			'type':'symbol',
			'layout':{
				'icon-image':'airplane',
				'icon-size':0.20,
				'icon-rotate':['get','bearing'],
				'icon-rotation-alignment':'map',
				'icon-allow-overlap':true,
				'icon-ignore-placement':true
			},
			'paint':{
				'icon-opacity':0.5
			}
		});//addLayer

		animate(map,counter,route,point,'camerapoint',steps);
		
		
	}


	map.on('load',()=>{
		document.getElementById('playButton').addEventListener('click',()=>{
			//alert("play");
			let airport1 = $('#airport1').val();
			let airport2 = $('#airport2').val();

			//console.log(markerRecord);
			markerRecordLength = Object.keys(markerRecord).length;
			if(markerRecordLength!=0){
				for(let i=1;i<=markerRecordLength;i++){
					//console.log(i);
					markerRecord['marker_'+i+''].remove();
				}
				markerRecord = {}
			}
			
			
			if(airport1 != "" && airport2 != ""){
				//console.log(airport1,airport2);
				airport1 = parseCoords(airport1);
				airport2 = parseCoords(airport2);
				addPointMarker(airport1);
				addPointMarker(airport2);
				let bounds = createBoundingBox(airport1,airport2);
				map.fitBounds(bounds);

				//Animation logic
				let origin = airport1;
				let destination = airport2;

				
				//Calculate the distance in kilometers bwtween route start/end point.
				const steps = 500;

				//Used to increment the value of the point measurment against the route
				let counter = 0;

				
				map.loadImage('https://cdn-icons-png.flaticon.com/128/1679/1679938.png',
					(error,image)=>{
						if (error) throw error;

						map.addImage('airplane',image);
					}
					);
                
              
				animateflightroute(map,origin,destination,steps);
				setTimeout(function(){
					animatecameraroute(map,origin,destination,steps);
				},1750);
				
				
			}else{
				alert("Empty Values!");
			}
		});//EventListener

		// document.getElementById('replayButton').addEventListener('click',()=>{
		//     alert("replayButton");
		// });//eventListener
	});//load

});//Document Ready


