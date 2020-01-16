import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import GeoJSON from 'ol/format/GeoJSON';
import {Image as ImageLayer, Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {bbox as bboxStrategy} from 'ol/loadingstrategy';
import BingMaps from 'ol/source/BingMaps';
import VectorSource from 'ol/source/Vector';
import {Stroke, Style} from 'ol/style';
import OSM from 'ol/source/OSM';
import ImageWMS from 'ol/source/ImageWMS';
import {transform} from 'ol/proj';


var layers_for_WFS = [
  new TileLayer({
    source: new OSM()
  })
];
var layers_for_WMS=[
  new TileLayer({
      source: new OSM()
  })
];

document.getElementById("wfs_request_button").onclick= function testWMSRequest(){
  var requestSelect=document.getElementById("request_wfs");
  var selectedrequest=requestSelect.options[requestSelect.selectedIndex].value;
  console.log(selectedrequest);
  if(selectedrequest==="GetFeature"){
    getFeatureKun();
  }
  else{
    console.log("not feature");
  }
}
function getFeatureKun(){
  console.log("here");
  var xhttp=new XMLHttpRequest();
  xhttp.onreadystatechange=function(){
    if(this.readyState==4 && this.status==200){
      getFeatureRequest(this);
    }
  };
  xhttp.open("GET","http://localhost:8080/geoserver/wfs?service=wfs&version=1.1.1&request=GetCapabilities",true);
  xhttp.send();
}
function getFeatureRequest(xmlDocument){
  console.log("here2");
  var responseParser=new DOMParser();
  var xmlDoc=responseParser.parseFromString(xmlDocument.responseText,"application/xml");

  var featureSelect=document.getElementById("featureType_wfs");
  var selectedfeature=featureSelect.options[featureSelect.selectedIndex].value;
  var features=xmlDoc.getElementsByTagName("FeatureType");
  console.log(features.length);
  var temp=0;
  var name="";
  var XMLUrl="";
  for(var i=0;i<features.length;i++){
    
    if(features[i].innerHTML!=undefined){
      if(features[i].getElementsByTagName("Title")[0].innerHTML===selectedfeature){
        temp=i;
        name=features[temp].getElementsByTagName("Name")[0].innerHTML;
        console.log("feature:"+name);
      }
    } 
  }
  setGMLFeature(temp,name);
  var req="http://localhost:8080/geoserver/IND_adm/ows?service=WFS&version=1.0.0&request=GetFeature&typeName="+name.replace(":", "%3A")+"&outputFormat=application%2Fjson";
  console.log(name.replace(":", "%"));
  console.log(req);
  document.getElementById("map").innerHTML="";
  var vectorSource = new VectorSource({
  format: new GeoJSON(),
  url: function(extent) {
    return req;
  },
  strategy: bboxStrategy
});
var WFSLayer=new VectorLayer({
  source: vectorSource,
  style: new Style({
    stroke: new Stroke({
      width: 2
    })
  })
})

layers_for_WFS.push(WFSLayer);


var map = new Map({
  layers: layers_for_WFS,
  target: document.getElementById('map'),
  view: new View({
    center: [0, 0],
    zoom: 0
  })
});

}

document.getElementById("wms_request_button").onclick= function wmsSubmitTest(){
  var requestSelect=document.getElementById("request_wms");
  var selectedrequest=requestSelect.options[requestSelect.selectedIndex].value;
  console.log(selectedrequest);
  if(selectedrequest==="GetMap"){
    getMapKun();
  }
  else if(selectedrequest==="GetFeatureInfo"){
    getFeatureInfoKun();
  }
}
function getMapKun(){
  var xhttp=new XMLHttpRequest();
  xhttp.onreadystatechange=function(){
    if(this.readyState==4 && this.status==200){
      getMapRequest(this);
    }
  };
  xhttp.open("GET","http://localhost:8080/geoserver/wms?service=wms&version=1.1.1&request=GetCapabilities",true);
  xhttp.send();
}
function getMapRequest(xmlDocument){
  var responseParser=new DOMParser();
  var xmlDoc=responseParser.parseFromString(xmlDocument.responseText,"application/xml");
  
  var layerSelect=document.getElementById("layer_wms");
  var selectedLayer=layerSelect.options[layerSelect.selectedIndex].value;
  console.log("title of selectedLayer:"+selectedLayer);
  var noOfLayers=xmlDoc.getElementsByTagName("Layer").length;
  console.log(noOfLayers)
  var layers=xmlDoc.getElementsByTagName("Layer");
  var temp=0;
  var style="rain";
  for(var i=0;i<noOfLayers;i++){
    if(layers[i].tagName!=undefined){
      if(layers[i].getElementsByTagName("Title")[0].innerHTML===selectedLayer){
        temp=i;
        style=layers[temp].getElementsByTagName("Style")[0].getElementsByTagName("Name")[0].innerHTML;
        console.log(style);
      }

    }
  }
  var layerName=layers[temp].getElementsByTagName("Name")[0].innerHTML;
  console.log("layer's name is:"+layerName);
  var srsSelect=document.getElementById("crs_wms");
  var selectedSRS=srsSelect.options[srsSelect.selectedIndex].value;
  console.log("srs:"+selectedSRS);
  var minX=Number(document.getElementById("minX").value);
  var minY=Number(document.getElementById("minY").value);
  var maxX=Number(document.getElementById("maxX").value);
  var maxY=Number(document.getElementById("maxY").value);
  var img=document.createElement("img");
  var minXMap = (minX + 180) / 360 * 256;
  var minYMap = ((1 - Math.log(Math.tan(minY * Math.PI / 180) + 1 / Math.cos(minY * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, 0)) * 256;
  var maxXMap = (maxX + 180) / 360 * 256;
  var maxYMap = ((1 - Math.log(Math.tan(maxY * Math.PI / 180) + 1 / Math.cos(maxY * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, 0)) * 256;
  console.log("this be coordinates"+minXMap+","+minYMap+","+maxXMap+","+maxYMap);
  console.log(selectedSRS);
  var cenX=(minX+maxX)/2;
  var cenY=(minY+maxY)/2;
  console.log(minX);
  var minEdge=transform([minX,minY], selectedSRS, 'EPSG:3857');
  var maxEdge=transform([maxX,maxY], selectedSRS, 'EPSG:3857');
  console.log("minX transformed:"+minEdge[0]);
  console.log("minY transformed:"+minEdge[1]);
  document.getElementById("map").innerHTML="";
  var anImageLayer=new ImageLayer({
      extent: [minEdge[0], minEdge[1], maxEdge[0], maxEdge[1]],
      source: new ImageWMS({
        url: 'http://localhost:8080/geoserver/wms',
        params: {'LAYERS': layerName},
        ratio: 1,
        serverType: 'geoserver'
      })
    });
  layers_for_WMS.push(anImageLayer);
  var map = new Map({
    layers: layers_for_WMS,
    target: 'map',
    view: new View({
      center: transform([cenX,cenY], selectedSRS, 'EPSG:3857'),
      zoom: 4
    })
  });
  var aLayer=new ImageLayer({
      extent: [minEdge[0], minEdge[1], maxEdge[0], maxEdge[1]],
      source: new ImageWMS({
        url: 'http://localhost:8080/geoserver/wms',
        params: {'LAYERS': layerName},
        ratio: 1,
        serverType: 'geoserver'
      })
    });
  var extent = aLayer.getExtent();
  map.getView().fit(extent, map.getSize()); 
  //map.setCenter(lonlat);

  //img.src="http://localhost:8080/geoserver/wms?bbox="+minX+","+minY+","+maxX+","+maxY+"&styles="+style+"&Format=image/png&request=GetMap&layers="+layerName+"&width=550&height=250&srs="+selectedSRS;
  //img.src="http://localhost:8080/geoserver/wms?bbox=-130,24,-66,50&styles=population&Format=image/png&request=GetMap&layers=topp:states&width=550&height=250&srs=EPSG:4326";
  //document.getElementById("map").appendChild(img);
}

function getFeatureInfoKun(){
  var xhttp=new XMLHttpRequest();
  xhttp.onreadystatechange=function(){
    if(this.readyState==4 && this.status==200){
      getFeatureInfoRequest(this);
    }
  };
  xhttp.open("GET","http://localhost:8080/geoserver/wms?service=wms&version=1.1.1&request=GetCapabilities",true);
  xhttp.send();
}
function getFeatureInfoRequest(xmlDocument){
  var responseParser=new DOMParser();
  var xmlDoc=responseParser.parseFromString(xmlDocument.responseText,"application/xml");
  
  var layerSelect=document.getElementById("layer_wms");
  var selectedLayer=layerSelect.options[layerSelect.selectedIndex].value;
  console.log("title of selectedLayer:"+selectedLayer);
  var noOfLayers=xmlDoc.getElementsByTagName("Layer").length;
  console.log(noOfLayers)
  var layers=xmlDoc.getElementsByTagName("Layer");
  var temp=0;
  var style="rain";
  for(var i=0;i<noOfLayers;i++){
    if(layers[i].tagName!=undefined){
      if(layers[i].getElementsByTagName("Title")[0].innerHTML===selectedLayer){
        temp=i;
        style=layers[temp].getElementsByTagName("Style")[0].getElementsByTagName("Name")[0].innerHTML;
        console.log(style);
      }

    }
  }
  var layerName=layers[temp].getElementsByTagName("Name")[0].innerHTML;
  var srsSelect=document.getElementById("crs_wms");
  var selectedSRS=srsSelect.options[srsSelect.selectedIndex].value;
  console.log("srs:"+selectedSRS);
  var minX=document.getElementById("minX").value;
  var minY=document.getElementById("minY").value;
  var maxX=document.getElementById("maxX").value;
  var maxY=document.getElementById("maxY").value;
  var request="http://localhost:8080/geoserver/wms?bbox="+minX+","+minY+
  ","+maxX+","+maxY+"&styles="+style+"&format=jpeg&info_format=text/plain&request=GetFeatureInfo&layers="+
  layerName+"&query_layers="+layerName+"&width=550&height=250&x=170&y=160";
  var win = window.open(request, '_blank');
  win.focus(); 
}
function setGMLFeature(index,name){
  console.log("here");
  var xhttp=new XMLHttpRequest();
  xhttp.onreadystatechange=function(){
    if(this.readyState==4 && this.status==200){
      populateTextArea(this,name);
    }
  };
  xhttp.open("GET",getWebFeatureGML(index),true);
  xhttp.send();
}

function populateTextArea(xmlDocument,name) {
  var responseParser=new DOMParser();
  var xmlDoc=responseParser.parseFromString(xmlDocument.responseText,"application/xml");
  document.getElementById("wfs_textarea_label").innerHTML="GML response for GetFeature request of "+name+" : ";
  document.getElementById("wfs_textarea").value=xmlDocument.responseText;
}
function getWebFeatureGML(index){
  var requests=[
    "http://localhost:8080/geoserver/IND_adm/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=IND_adm%3AIND_adm0",
    "http://localhost:8080/geoserver/IND_adm/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=IND_adm%3AIND_adm1",
    "localhost:8080/geoserver/IND_adm/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=IND_adm%3AIND_adm2",
    "http://localhost:8080/geoserver/IND_adm/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=IND_adm%3AIND_adm3",
    "http://localhost:8080/geoserver/IND_adm/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=IND_adm%3AIND_rails",
    "http://localhost:8080/geoserver/IND_adm/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=IND_adm%3AIND_roads",
    "http://localhost:8080/geoserver/IND_adm/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=IND_adm%3AIND_water_areas_dcw",
    "http://localhost:8080/geoserver/IND_adm/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=IND_adm%3AIND_water_lines_dcw",
    "http://localhost:8080/geoserver/tiger/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tiger%3Apoly_landmarks",
    "http://localhost:8080/geoserver/tiger/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tiger%3Apoi",
    "http://localhost:8080/geoserver/tiger/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tiger%3Atiger_roads",
    "http://localhost:8080/geoserver/topp/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=topp%3Atasmania_cities",
    "http://localhost:8080/geoserver/topp/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=topp%3Atasmania_roads",
    "http://localhost:8080/geoserver/topp/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=topp%3Atasmania_state_boundaries",
    "http://localhost:8080/geoserver/topp/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=topp%3Atasmania_water_bodies",
    "http://localhost:8080/geoserver/topp/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=topp%3Astates",
    "http://localhost:8080/geoserver/tiger/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tiger%3Agiant_polygon"
  ]
  return requests[index];
}