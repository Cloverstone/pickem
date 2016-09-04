window.onload =function(){
	templates['comment'] = Hogan.compile(`<li  class="list-group-item">{{content}}!</li>`);
}