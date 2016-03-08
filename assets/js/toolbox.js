// function render(template, data){
// 	if(typeof templates[template] === 'undefined'){
// 		templates[template] =  Hogan.compile($('#'+template).html());
// 	}
//   return templates[template].render(data, templates);
// }


debug=true;
alert = function(value){ if(debug){console.log(value);} };
function render(template, data){
	if(typeof templates[template] === 'undefined'){
		if($('[name='+template+']').length > 0){
			if(!$('[name='+template+']').attr('src')){
				templates[template] =  Hogan.compile($('[name='+template+']').html());
			}else{					
				// $.get(, function (data) {
				//   templates[template]= Hogan.compile(data);
				// }, 'html')

				jQuery.ajax({
	        url: $('[name='+template+']').attr('src'),
	        success: function (data) {
						templates[template]= Hogan.compile(data);
	        },
	        async: false
		    });
			}
			$('#'+template).remove();
		}else{
			return Hogan.compile(template).render(data, templates);	
		}
	}
	if(typeof templates[template] !== 'undefined' && templates[template].length !== 0 ){
 	 return templates[template].render(data, templates);
	}else{
		alert('not found:'+template);
	}
}



function getNodeIndex(node) {
  var index = 0;
  while (node = node.previousSibling) {
    if (node.nodeType != 3 || !/^\s*$/.test(node.data)) {
      index++;
    }
  }
  return index;
}		
function store(){
	$.jStorage.set('session', JSON.stringify(session));
}
function clear(){
	$.jStorage.set('session', JSON.stringify({}));
	document.location.reload();
}





// var urlParams;
var hashParams
var QueryStringToHash = function QueryStringToHash  (query) {
  var query_string = {};
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    pair[0] = decodeURIComponent(pair[0]);
    pair[1] = decodeURIComponent((pair[1] || "").split('+').join(' '));
      // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
      // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
      // If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  } 
  return query_string;
};
// (window.onpopstate = function () {
// 		hashParams = QueryStringToHash(document.location.hash.substr(1) || "")
//     var match,
//         pl     = /\+/g,  // Regex for replacing addition symbol with a space
//         search = /([^&=]+)=?([^&]*)/g,
//         decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
//         query  = window.location.search.substring(1);

//     urlParams = {};
//     while (match = search.exec(query))
//        urlParams[decode(match[1])] = decode(match[2]);
// })();


