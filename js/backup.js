function animateStraightLine(origin,destination){
					const cameraroute = {
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
					const camerapoint = {
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
					const lineDistance = turf.length(cameraroute.features[0]);

					const arc = [];
					//Number of steps to use in the arc and animation,more steps means
					//a smoother arc and animation,btu too many steps will result in a 
					//low frame rate
					const steps = 500;


					//Draw an arc btn the `origin` & `destination` of the two points
					for(let i = 0;i<lineDistance;i+=lineDistance/steps){
						const segment = turf.along(cameraroute.features[0],i);
						arc.push(segment.geometry.coordinates);
					}

					//Update the route with calculated arc coordinates
					cameraroute.features[0].geometry.coordinates = arc;

					//Used to increment the value of the point measurment against the route
					let counter = 0;


					map.addSource('cameraroute',{
						'type':'geojson',
						'data':cameraroute
					});
					map.addLayer({
						'id':'cameraroute',
						'source':'cameraroute',
						'type':'line',
						'paint':{
							'line-width':2,
							'line-dasharray': [0, 2, 2],
							'line-color':'gray'
						}
					});//addLayer
					map.addSource('camerapoint',{
						'type':'geojson',
						'data':camerapoint
					});
					map.addLayer({
						'id':'camerapoint',
						'source':'camerapoint',
						'type':'symbol',
						'layout':{
							'icon-image':'airport',
							'icon-size':1.5,
							'icon-rotate':['get','bearing'],
							'icon-rotation-alignment':'map',
							'icon-allow-overlap':true,
							'icon-ignore-placement':true
						}
					});//addLayer

					let running = false;
					function animate(){
						running = true;
						//document.getElementById('replayButton').disabled = true;
						const start = cameraroute.features[0].geometry.coordinates[counter >= steps ? counter - 1: counter];
						const end = cameraroute.features[0].geometry.coordinates[counter >= steps ? counter : counter + 1];

						if (!start || !end){
							running = false;
							//document.getElementById('replayButton').disabled = false;
							return;
						}
						//Update point geometry to a new position based on counter denoting
						//the index to access the arc
						camerapoint.features[0].geometry.coordinates = cameraroute.features[0].geometry.coordinates[counter];

						//Calculate the bearing to ensure the icon is rotated to match the 
						//route arc
						//The bearing is calculated btn the current point and the next point,except
						//at the end of the arc,which uses the previous point a d the current point
						camerapoint.features[0].properties.bearing=turf.bearing(turf.point(start),turf.point(end));

						//Update the source with this new data
						map.getSource('camerapoint').setData(camerapoint);

						//Request the next frame of animationas long as the end has not been reached
						if(counter < steps){
							requestAnimationFrame(animate);
						}

						counter = counter + 1;
					}//animate

					//Start the animation
					animate(counter);

				}//animate Strigntline

				function animateCurve(origin,destination){
                     

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

					//Calculate the distance in kilometers bwtween route start/end point.
					const lineDistance = turf.length(route.features[0]);

					const arc = [];
					//Number of steps to use in the arc and animation,more steps means
					//a smoother arc and animation,btu too many steps will result in a 
					//low frame rate
					const steps = 500;


					//Draw an arc btn the `origin` & `destination` of the two points
					for(let i = 0;i<lineDistance;i+=lineDistance/steps){
						const segment = turf.along(route.features[0],i);
						arc.push(segment.geometry.coordinates);
					}
	                
	                //
	                //const distance = turf.distance(start, end, { units: 'miles' });
					const midpoint = turf.midpoint(turf.point(origin),turf.point(destination));
					const bearing = turf.bearing(turf.point(origin),turf.point(destination));
					const leftSideArc = bearing + 90 > 180 ? -180 + (bearing + 90 - 180) : bearing + 90;
					const dest = turf.destination(midpoint, lineDistance /-20, leftSideArc);
					// curvedLine gets rendered to the page
					const curvedLine = turf.bezierSpline(
					  turf.lineString([origin, dest.geometry.coordinates, destination]),
					);
					
					//Update the route with calculated arc coordinates
					let line = turf.lineString(arc);
					let mycurve = turf.bezierSpline(line,{steps: 500, sharpness:1});
					route.features[0].geometry.coordinates = mycurve.geometry.coordinates;

					//}//Create Animation function
					//createRoute(airport1,airport2);

					//Used to increment the value of the point measurment against the route
					let counter = 0;

					//Add a source and layer displaying a point which will
					//be animated in a circle
					map.addSource('route',{
						'type':'geojson',
						'data':route
					});
					map.addSource('point',{
						'type':'geojson',
						'data':point
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

					map.addLayer({
						'id':'point',
						'source':'point',
						'type':'symbol',
						'layout':{
							'icon-image':'airport',
							'icon-size':1.5,
							'icon-rotate':['get','bearing'],
							'icon-rotation-alignment':'map',
							'icon-allow-overlap':true,
							'icon-ignore-placement':true
						}
					});//addLayer

					let running = false;
					function animate(){
						running = true;
						//document.getElementById('replayButton').disabled = true;
						const start = route.features[0].geometry.coordinates[counter >= steps ? counter - 1: counter];
						const end = route.features[0].geometry.coordinates[counter >= steps ? counter : counter + 1];

						if (!start || !end){
							running = false;
							//document.getElementById('replayButton').disabled = false;
							return;
						}
						//Update point geometry to a new position based on counter denoting
						//the index to access the arc
						point.features[0].geometry.coordinates = route.features[0].geometry.coordinates[counter];

						//Calculate the bearing to ensure the icon is rotated to match the 
						//route arc
						//The bearing is calculated btn the current point and the next point,except
						//at the end of the arc,which uses the previous point a d the current point
						point.features[0].properties.bearing=turf.bearing(turf.point(start),turf.point(end));

						//Update the source with this new data
						map.getSource('point').setData(point);

						//Request the next frame of animationas long as the end has not been reached
						if(counter < steps){
							requestAnimationFrame(animate);
						}

						counter = counter + 1;
					}//animate
					//Start the animation
					animate(counter);
					
			    }//animateCurve


			    animateCurve(origin,destination);
			    //setTimeout(animateStraightLine,1500,origin,destination);
